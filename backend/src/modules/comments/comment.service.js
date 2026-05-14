const prisma = require("../../lib/prisma");

function mapCommentToResponse(comment) {
  const shouldHideAuthor = comment.isAnonymous;

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt,
    author: shouldHideAuthor
      ? {
          id: null,
          firstName: "Anónimo",
          lastName: "",
          institutionalEmail: null,
          role: null,
        }
      : {
          id: comment.author.id,
          firstName: comment.author.firstName,
          lastName: comment.author.lastName,
          institutionalEmail: comment.author.institutionalEmail,
          role: comment.author.role?.name ?? null,
        },
  };
}

async function createComment({ postId, authorId, content }) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      deletedAt: true,
      status: true,
    },
  });

  if (!post || post.deletedAt) {
    const error = new Error("Publicación no encontrada");
    error.statusCode = 404;
    throw error;
  }

  if (post.status !== "PUBLISHED") {
    const error = new Error("No se puede comentar esta publicación");
    error.statusCode = 400;
    throw error;
  }

  const comment = await prisma.comment.create({
    data: {
      content: content.trim(),
      postId,
      authorId,
    },
    include: {
      author: {
        include: {
          role: true,
        },
      },
    },
  });

  return mapCommentToResponse(comment);
}

async function deleteComment(commentId, user) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    const error = new Error("Comentario no encontrado");
    error.statusCode = 404;
    throw error;
  }

  if (comment.authorId !== user.id && user.role !== "admin") {
    const error = new Error("No tienes permiso para eliminar este comentario");
    error.statusCode = 403;
    throw error;
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  return { id: commentId };
}

module.exports = {
  mapCommentToResponse,
  createComment,
  deleteComment,
};
