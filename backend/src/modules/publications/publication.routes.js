const express = require("express");
const publicationController = require("./publication.controller");

// Middlewares
const upload = require("../../middlewares/publication-upload.middleware");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");
const validateDto = require("../../middlewares/validate.middleware");
const { createPublicationDto, updatePublicationDto } = require("./publication.dto");
const validatePublicationFiles = require("../../middlewares/validate-publication-files.middleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole("docente", "admin"),
  upload.array("files"),
  validatePublicationFiles,
  validateDto(createPublicationDto),
  publicationController.createPublication
);

router.get(
  "/",
  authMiddleware,
  requireRole("docente", "admin"),
  publicationController.getPublicationFeed
);

router.get(
  "/:id",
  authMiddleware,
  requireRole("docente", "admin"),
  publicationController.getPublicationById
);

router.put(
  "/:id",
  authMiddleware,
  requireRole("docente", "admin"),
  upload.array("files"),
  validatePublicationFiles,
  validateDto(updatePublicationDto),
  publicationController.updatePublication
);

router.delete(
  "/:id",
  authMiddleware,
  requireRole("docente", "admin"),
  publicationController.deletePublication
);

module.exports = router;
