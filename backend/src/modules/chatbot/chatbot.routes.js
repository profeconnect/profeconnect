const express = require("express");
const chatbotController = require("./chatbot.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, chatbotController.getResponseController);

module.exports = router;