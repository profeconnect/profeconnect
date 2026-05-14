const express = require("express");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const commentController = require("./comment.controller");

const router = express.Router();

router.delete(
  "/:id",
  authMiddleware,
  requireRole("docente", "admin"),
  commentController.deleteComment
);

module.exports = router;
