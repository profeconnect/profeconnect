const express = require("express");
const registrationRequestController = require("./registrationRequest.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "moderador"),
  registrationRequestController.getRegistrationRequests
);

router.get(
  "/:id/cedula-photo",
  authMiddleware,
  requireRole("admin", "moderador"),
  registrationRequestController.getRegistrationRequestCedulaPhoto
);

router.patch(
  "/:id/approve",
  authMiddleware,
  requireRole("admin"),
  registrationRequestController.approveRegistrationRequest
);

router.patch(
  "/:id/reject",
  authMiddleware,
  requireRole("admin"),
  registrationRequestController.rejectRegistrationRequest
);

module.exports = router;