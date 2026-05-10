require("dotenv/config");

const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.CHATBOT_API_KEY,
    baseURL: "https://api.deepseek.com/v1"
})

const SYSTEM_PROMPT = "Eres un asistente de IA para un foro de docentes, no hables de temas que no sean educativos";

async function response(prompt) {
    try {
        const messages = [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt }
        ]

        const response = await client.chat.completions.create({
            model: "deepseek-v4-flash",
            messages,
            max_tokens: 200,
            temperature: 0.7
        })

        return response.choices[0].message.content
    } catch (err) {
        console.log(err)
    }
}

async function chat(messages) {
    try {
        const filtered = messages.filter(m => m.role !== "system");
        const allMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...filtered
        ];

        const response = await client.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: allMessages,
            max_tokens: 200,
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

async function chatStream(messages, onToken) {
    try {
        const filtered = messages.filter(m => m.role !== "system");
        const allMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...filtered
        ];

        const stream = await client.chat.completions.create({
            model: "deepseek-v4-flash",
            messages: allMessages,
            max_tokens: 200,
            temperature: 0.7,
            stream: true
        });

        let fullContent = "";
        for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content || "";
            if (token) {
                fullContent += token;
                onToken(token);
            }
        }
        return fullContent;
    } catch (err) {
        console.log(err);
        throw err;
    }
}

module.exports = {
    response,
    chat,
    chatStream
}