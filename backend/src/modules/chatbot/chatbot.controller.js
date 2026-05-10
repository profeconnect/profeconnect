const { getResponse } = require("./chatbot.service");

async function getResponseController(req, res) {
    const { prompt } = req.body;

    if (!prompt) {
        const error = new Error("Falta el parámetro 'prompt'");
        error.statusCode = 400;
        throw error;
    }

    try {
        const response = await getResponse(prompt);
        res.json({ response });
    } catch (err) {
        console.log(err);
        res.status(err.statusCode || 500).json({ error: err.message });
    }
}

module.exports = {
    getResponseController
}