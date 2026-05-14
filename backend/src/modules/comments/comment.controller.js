const { ApiResponse } = require("../../config/api.response");
const commentService = require("./comment.service");

async function createComment(req, res, next) {
  try {
    const comment = await commentService.createComment({
      postId: Number(req.params.id),
      authorId: req.user.id,
      content: req.body.content,
    });

    return res
      .status(201)
      .json(new ApiResponse(true, 201, "Comentario añadido correctamente", comment));
  } catch (error) {
    next(error);
  }
}

async function deleteComment(req, res, next) {
  try {
    const result = await commentService.deleteComment(Number(req.params.id), req.user);

    return res
      .status(200)
      .json(new ApiResponse(true, 200, "Comentario eliminado correctamente", result));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComment,
  deleteComment,
};
