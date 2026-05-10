const { sendChat, sendChatStream } = require("./chatbot.service");

function setupChatbotSocket(io) {
    const chatNamespace = io.of("/chatbot");

    chatNamespace.on("connection", (socket) => {
        console.log(`Cliente conectado al chatbot: ${socket.id}`);

        socket.on("chat:message", async (data) => {
            const { messages } = data;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                socket.emit("chat:error", { message: "Se requiere un array de mensajes" });
                return;
            }

            try {
                const response = await sendChat(messages);
                socket.emit("chat:response", { message: response });
            } catch (err) {
                console.error(err);
                socket.emit("chat:error", { message: "Error al obtener respuesta de la IA" });
            }
        });

        socket.on("chat:stream", async (data) => {
            const { messages } = data;

            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                socket.emit("chat:error", { message: "Se requiere un array de mensajes" });
                return;
            }

            try {
                await sendChatStream(messages, (token) => {
                    socket.emit("chat:token", { token });
                });
                socket.emit("chat:done");
            } catch (err) {
                console.error(err);
                socket.emit("chat:error", { message: "Error en el stream de la IA" });
            }
        });

        socket.on("disconnect", () => {
            console.log(`Cliente desconectado del chatbot: ${socket.id}`);
        });
    });
}

module.exports = setupChatbotSocket;
