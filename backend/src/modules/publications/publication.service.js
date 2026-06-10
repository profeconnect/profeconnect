const fs = require("fs");
const path = require("path");
const prisma = require("../../lib/prisma");
const { mapCommentToResponse } = require("../comments/comment.service");
const {
  buildReactionSummary,
  getMyReaction,
} = require("../reactions/reaction.service");
const {
  getPublicUrl,
  isStorageUri,
  uploadPublicationFile,
  removeStorageObjects,
  removeLocalFile,
} = require("../../lib/storage");

const PUBLIC_DIR = path.resolve(__dirname, "../../../public");

function mapAttachmentToResponse(attachment) {
  if (!attachment) return attachment;

  return {
    ...attachment,
    url: getPublicUrl(attachment.path),
  };
}

function mapPostToResponse(post, currentUserId) {
  const shouldHideAuthor = post.isAnonymous;
  const reactions = post.reactions ?? [];

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    isAnonymous: post.isAnonymous,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    attachments: (post.attachments ?? []).map(mapAttachmentToResponse),
    comments: (post.comments ?? []).map(mapCommentToResponse),
    tags: post.tags ?? [],
    reactionSummary: buildReactionSummary(reactions),
    myReaction: getMyReaction(reactions, currentUserId),
    author: shouldHideAuthor
      ? {
        id: null,
        firstName: "Anónimo",
        lastName: "",
        institutionalEmail: null,
        role: null,
      }
      : {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        institutionalEmail: post.author.institutionalEmail,
        role: post.author.role?.name,
      },
    reportCount: post._count?.Reports || 0,
  };
}

function mapFileToAttachment(file) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    path: file.storageUri || file.path,
    size: file.size,
    type: file.mimetype.startsWith("image/") ? "IMAGE" : "DOCUMENT",
    isSuspicious: file.isSuspicious || false,
  };
}

async function createPublication({ title, content, isAnonymous, authorId, files = [], tagIds }) {
  const uploadedObjects = [];

  try {
    for (const file of files) {
      const uploadResult = await uploadPublicationFile(file);
      if (uploadResult.storedInSupabase) {
        file.storageUri = uploadResult.uri;
        file.storedInSupabase = true;
        uploadedObjects.push(uploadResult);
      }
    }

    const post = await prisma.$transaction(async (tx) => {
      const createdPost = await tx.post.create({
        data: {
          title: title.trim(),
          content: content.trim(),
          isAnonymous: isAnonymous ?? false,
          authorId,
          attachments: {
            create: files.map(mapFileToAttachment),
          },
          ...(tagIds !== undefined && {
            tags: {
              connect: tagIds.map(id => ({ id })),
            },
          }),
        },
        include: {
          author: {
            include: {
              role: true,
            },
          },
          attachments: true,
          comments: {
            orderBy: {
              createdAt: "asc",
            },
            include: {
              author: {
                include: {
                  role: true,
                },
              },
            },
          },
          tags: true,
          reactions: {
            select: {
              type: true,
              userId: true,
            },
          },
        },
      });

      for (const file of files) {
        if (file.isSuspicious) {
          await tx.securityIncident.create({
            data: {
              userId: authorId,
              fileName: file.originalname,
              attemptedMime: file.attemptedMime || file.mimetype,
              detectedMime: file.detectedMime || "unknown",
              status: "PENDING",
              physicalPath: file.storageUri || file.path,
              postId: createdPost.id,
              fileMetadata: file.extractedMetadata || null
            },
          });
        }
      }

      return createdPost;
    });

    for (const file of files) {
      if (file.storedInSupabase) {
        removeLocalFile(file.path);
      }
    }

    return mapPostToResponse(post, authorId);
  } catch (error) {
    await removeStorageObjects(uploadedObjects);
    for (const file of files) {
      removeLocalFile(file.path);
    }
    throw error;
  }
}

async function getPublicationFeed({ tagIds, currentUserId, page = 1, limit = 10 } = {}) {
  const skip = (page - 1) * limit;

  const whereClause = {
    status: "PUBLISHED",
    deletedAt: null,
    ...(tagIds && tagIds.length > 0 && {
      tags: { some: { id: { in: tagIds } } },
    }),
  };

  const [total, posts] = await Promise.all([
    prisma.post.count({ where: whereClause }),
    prisma.post.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
      include: {
        /*
        _count: {
          select: { Reports: true }
        },
        */
        author: {
          include: {
            role: true,
          },
        },
        attachments: true,
        comments: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            author: {
              include: {
                role: true,
              },
            },
          },
        },
        tags: true,
        reactions: {
          select: {
            type: true,
            userId: true,
          },
        },
      },
    })
  ]);

  return {
    items: posts.map((post) => mapPostToResponse(post, currentUserId)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

async function getPublicationById(id, currentUserId) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        include: {
          role: true,
        },
      },
      attachments: true,
      comments: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          author: {
            include: {
              role: true,
            },
          },
        },
      },
      tags: true,
      reactions: {
        select: {
          type: true,
          userId: true,
        },
      },
    },
  });

  if (!post || post.deletedAt) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return mapPostToResponse(post, currentUserId);
}

async function updatePublication(id, userId, data) {
  const existing = await prisma.post.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (existing.authorId !== userId) {
    const error = new Error("No tienes permiso para modificar esta publicación");
    error.statusCode = 403;
    throw error;
  }

  if (existing.deletedAt) {
    const error = new Error("La publicación ha sido eliminada");
    error.statusCode = 400;
    throw error;
  }

  const updateData = {};
  if (data.title !== undefined) updateData.title = data.title.trim();
  if (data.content !== undefined) updateData.content = data.content.trim();
  if (data.isAnonymous !== undefined) updateData.isAnonymous = data.isAnonymous;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.tags !== undefined) {
    updateData.tags = {
      set: data.tags.map(id => ({ id })),
    };
  }

  const post = await prisma.post.update({
    where: { id },
    data: updateData,
    include: {
      author: {
        include: {
          role: true,
        },
      },
      attachments: true,
      comments: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          author: {
            include: {
              role: true,
            },
          },
        },
      },
      tags: true,
      reactions: {
        select: {
          type: true,
          userId: true,
        },
      },
    },
  });

  return mapPostToResponse(post, userId);
}

async function deletePublication(id, user) {
  const existing = await prisma.post.findUnique({
    where: { id },
  });

  if (!existing) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (existing.authorId !== user.id && user.role !== 'admin') {
    const error = new Error("No tienes permiso para eliminar esta publicación");
    error.statusCode = 403;
    throw error;
  }

  if (existing.deletedAt) {
    const error = new Error("La publicación ya ha sido eliminada");
    error.statusCode = 400;
    throw error;
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: "HIDDEN",
    },
  });

  return { id: post.id, deletedAt: post.deletedAt };
}

async function getPublicationAttachments(postId) {
  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post || post.deletedAt) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  const attachments = await prisma.postAttachment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  return attachments.map((att) => {
    const folder = att.type === "IMAGE" ? "images" : "documents";
    const diskPath = path.join(PUBLIC_DIR, folder, att.filename);
    return {
      ...mapAttachmentToResponse(att),
      existsOnDisk: isStorageUri(att.path) ? false : fs.existsSync(diskPath),
    };
  });
}

module.exports = {
  createPublication,
  getPublicationFeed,
  getPublicationById,
  updatePublication,
  deletePublication,
  getPublicationAttachments,
};
