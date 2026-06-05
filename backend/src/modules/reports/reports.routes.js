const express = require("express");
const reportsController = require("./reports.controller");

const authMiddleware = require("../../middlewares/auth.middleware");
const requireRole = require("../../middlewares/role.middleware");

const router = express.Router();

router.get("/posts",
    authMiddleware,
    requireRole("admin", "moderador"),
    reportsController.getReportedPosts);

router.get("/",
    authMiddleware,
    requireRole("admin", "moderador"),
    reportsController.getAllReports);

router.get("/:postId",
    authMiddleware,
    requireRole("admin", "moderador"),
    reportsController.getReportsByPostId);

router.post("/:postId",
    authMiddleware,
    reportsController.createReport);

router.delete("/:postId",
    authMiddleware,
    requireRole("admin", "moderador"),
    reportsController.deleteReports);

router.get("/:postId/total",
    authMiddleware,
    requireRole("admin", "moderador"),
    reportsController.getTotalReportsByPostId);

module.exports = router;