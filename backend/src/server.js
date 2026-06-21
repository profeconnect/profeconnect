require("dotenv/config");

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const setupChatbotSocket = require("./modules/chatbot/chatbot.socket");
const prisma = require("./lib/prisma");
const { verifyEmailTransport } = require("./lib/email");

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
  },
});

setupChatbotSocket(io);

async function start() {
  try {
    await prisma.$connect();
    console.log("PostgreSQL conectado (Prisma)");
  } catch (err) {
    console.error(
      "No se pudo conectar al inicio con PostgreSQL. El API arrancará, pero login y otros endpoints fallarán hasta corregir la base de datos."
    );
    if (process.env.NODE_ENV !== "production") {
      console.error("(Detalle)", err.message);
    }
  }

  server.listen(PORT, () => {
    void verifyEmailTransport();
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
  });
}

start();
