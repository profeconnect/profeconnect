require("dotenv/config");

const { executeTool, tools } = require("./ai-tools");
const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.CHATBOT_API_KEY,
  baseURL: "https://api.deepseek.com/v1"
})

const SYSTEM_PROMPT = "Eres un asistente de IA para un foro de docentes, no hables de temas que no sean educativos";


// Chatbot functions
async function response(prompt) {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt }
    ]

    const response = await client.chat.completions.create({
      model: "deepseek-v4-flash",
      messages,
      tools,
      tool_choice: "auto"
    })

    const message = response.choices[0].message;

    if (message.tool_calls) {
      const toolCall = message.tool_calls[0];
      const result = await executeTool(toolCall);
      messages.push(message);

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });

      const finalResponse = await client.chat.completions.create({
        model: "deepseek-v4-flash",
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      return finalResponse.choices[0].message.content;
    } else {
      return message.content;
    }
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
      tools,
      tool_choice: "auto"
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {
      const toolCall = message.tool_calls[0];
      const result = await executeTool(toolCall);
      allMessages.push(message);

      allMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });

      const finalResponse = await client.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: allMessages,
        max_tokens: 1500,
        temperature: 0.7,
      });

      return finalResponse.choices[0].message.content;
    } else {
      return message.content;
    }
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
      stream: true,
      tools,
      tool_choice: "auto"
    });

    let toolCallId = "";
    let functionName = "";
    let functionArgs = "";
    let isToolCall = false;

    let fullContent = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta || {};

      if (delta.tool_calls) {
        isToolCall = true;
        const toolCallDelta = delta.tool_calls[0];
        if (toolCallDelta.id) toolCallId += toolCallDelta.id;
        if (toolCallDelta.function?.name) functionName += toolCallDelta.function.name;
        if (toolCallDelta.function?.arguments) functionArgs += toolCallDelta.function.arguments;
      }

      const token = delta.content || "";
      if (token) {
        fullContent += token;
        onToken(token);
      }
    }

    if (isToolCall) {
      const toolCall = {
        id: toolCallId,
        type: "function",
        function: {
          name: functionName,
          arguments: functionArgs
        }
      };

      const result = await executeTool(toolCall);

      allMessages.push({
        role: "assistant",
        content: null,
        tool_calls: [toolCall]
      });

      allMessages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });

      const finalStream = await client.chat.completions.create({
        model: "deepseek-v4-flash",
        messages: allMessages,
        stream: true,
      });

      for await (const chunk of finalStream) {
        const token = chunk.choices[0]?.delta?.content || "";
        if (token) {
          fullContent += token;
          onToken(token);
        }
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