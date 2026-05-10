require("dotenv/config");

const dns = require("dns");
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const setupChatbotSocket = require("./modules/chatbot/chatbot.socket");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.set("io", io);

setupChatbotSocket(io);

server.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
  console.log(`Socket.IO disponible en http://localhost:${PORT}/chatbot`);
});
