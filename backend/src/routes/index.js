const express = require("express");
const { ApiResponse } = require("../config/api.response");

const authRoutes = require("../modules/auth/auth.routes");
const registrationRequestRoutes = require("../modules/registrationRequests/registrationRequest.routes");
const userRoutes = require("../modules/users/user.routes");
const profileRoutes = require("../modules/profiles/profile.routes");
const chatbotRoutes = require("../modules/chatbot/chatbot.routes");
const publicationRoutes = require("../modules/publications/publication.routes");
const commentRoutes = require("../modules/comments/comment.routes");

const categoryRoutes = require("../modules/category/category.routes");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", (req, res) => {
  res.json(new ApiResponse(true, 200, "Backend activo"));
});

router.get("/health/db", async (req, res, next) => {
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    res.json(new ApiResponse(true, 200, "PostgreSQL accesible", { ok: true }));
  } catch (err) {
    next(err);
  }
});

router.use("/auth", authRoutes);
router.use("/admin/registration-requests", registrationRequestRoutes);
router.use("/admin/users", userRoutes);
router.use("/profiles", profileRoutes);
router.use("/publications", publicationRoutes);
router.use("/comments", commentRoutes);

// Chatbot
router.use("/chatbot", chatbotRoutes);

// Posts
router.use("/categories", categoryRoutes);

module.exports = router;