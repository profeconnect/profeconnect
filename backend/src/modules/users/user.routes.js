const express = require("express");
const userController = require("./user.controller");

const { userIdParamDto, updateUserStatusDto } = require("./user.dto");

// Middlewares
const validateDto = require("../../middlewares/validate.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin"),
  userController.getUsers
);

router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("admin"),
  validateDto(userIdParamDto, "params"),
  validateDto(updateUserStatusDto, "body"),
  userController.updateUserStatus
);

router.get(
  "/:id/cedula-photo",
  authMiddleware,
  requireRole("admin", "moderador"),
  validateDto(userIdParamDto, "params"),
  userController.getUserCedulaPhoto
);

module.exports = router;