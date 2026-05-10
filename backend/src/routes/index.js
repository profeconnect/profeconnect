const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const registrationRequestRoutes = require("../modules/registrationRequests/registrationRequest.routes");
const userRoutes = require("../modules/users/user.routes");
const profileRoutes = require("../modules/profiles/profile.routes");
const chatbotRoutes = require("../modules/chatbot/chatbot.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Backend activo",
  });
});

router.use("/auth", authRoutes);
router.use("/admin/registration-requests", registrationRequestRoutes);
router.use("/admin/users", userRoutes);
router.use("/profiles", profileRoutes);

// Chatbot
router.use("/chatbot", chatbotRoutes);

module.exports = router;