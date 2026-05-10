const { response, chat, chatStream } = require("../../lib/openai");

async function getResponse(prompt) {
    return await response(prompt);
}

async function sendChat(messages) {
    return await chat(messages);
}

async function sendChatStream(messages, onToken) {
    return await chatStream(messages, onToken);
}

module.exports = {
    getResponse,
    sendChat,
    sendChatStream
}