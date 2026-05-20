const fs = require("fs");
const path = require("path");
const prisma = require("../../lib/prisma");
const { mapCommentToResponse } = require("../comments/comment.service");

const PUBLIC_DIR = path.resolve(__dirname, "../../../public");

function mapPostToResponse(post) {
  const shouldHideAuthor = post.isAnonymous;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    isAnonymous: post.isAnonymous,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    attachments: post.attachments,
    comments: (post.comments ?? []).map(mapCommentToResponse),
    tags: post.tags ?? [],
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
  };
}

function mapFileToAttachment(file) {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    path: file.path,
    size: file.size,
    type: file.mimetype.startsWith("image/") ? "IMAGE" : "DOCUMENT",
    isSuspicious: file.isSuspicious || false,
  };
}

async function createPublication({ title, content, isAnonymous, authorId, files = [], tagIds }) {
  const post = await prisma.post.create({
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
    },
  });

  for (const file of files) {
    if (file.isSuspicious) {
      await prisma.securityIncident.create({
        data: {
          userId: authorId,
          fileName: file.originalname,
          attemptedMime: file.attemptedMime || file.mimetype,
          detectedMime: file.detectedMime || "unknown",
          status: "PENDING",
          physicalPath: file.path,
          postId: post.id,
          fileMetadata: file.extractedMetadata || null
        }
      });
    }
  }

  return mapPostToResponse(post);
}

async function getPublicationFeed({ tagIds } = {}) {
  const posts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      ...(tagIds && tagIds.length > 0 && {
        tags: { some: { id: { in: tagIds } } },
      }),
    },
    orderBy: {
      createdAt: "desc",
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
    },
  });

  return posts.map(mapPostToResponse);
}

async function getPublicationById(id) {
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
    },
  });

  if (!post || post.deletedAt) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  return mapPostToResponse(post);
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
    },
  });

  return mapPostToResponse(post);
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
      ...att,
      existsOnDisk: fs.existsSync(diskPath),
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
