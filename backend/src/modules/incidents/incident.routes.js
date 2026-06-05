const express = require("express");
const incidentController = require("./incident.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  requireRole("admin", "moderador"),
  incidentController.getPendingIncidents
);

router.patch(
  "/:id/resolve",
  authMiddleware,
  requireRole("admin", "moderador"),
  incidentController.resolveIncident
);

router.get(
  "/:id/download",
  authMiddleware,
  requireRole("admin", "moderador"),
  incidentController.downloadIncidentFile
);

router.delete(
  "/:id/publication",
  authMiddleware,
  requireRole("admin", "moderador"),
  incidentController.deletePostFromIncident
);

module.exports = router;
