import { io, Socket } from 'socket.io-client';
import { TOKEN_STORAGE_KEY } from './client';

const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:3000';

let socket: Socket | null = null;

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export function getChatbotSocket(): Socket {
  if (socket?.connected) return socket;

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);

  socket = io(`${SOCKET_URL}/chatbot`, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('Conectado al chatbot');
  });

  socket.on('disconnect', (reason) => {
    console.log('Desconectado del chatbot:', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('Error de conexión al chatbot:', err.message);
  });

  return socket;
}

export function disconnectChatbot(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function sendChatMessage(
  messages: ChatMessage[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const s = getChatbotSocket();
    s.emit('chat:message', { messages });
    s.once('chat:response', (data: { message: string }) => {
      resolve(data.message);
    });
    s.once('chat:error', (data: { message: string }) => {
      reject(new Error(data.message));
    });
  });
}

export function sendChatStream(
  messages: ChatMessage[],
  onToken: (token: string) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const s = getChatbotSocket();
    let fullContent = '';

    s.on('chat:token', (data: { token: string }) => {
      fullContent += data.token;
      onToken(data.token);
    });

    s.once('chat:done', () => {
      s.off('chat:token');
      resolve(fullContent);
    });

    s.once('chat:error', (data: { message: string }) => {
      s.off('chat:token');
      reject(new Error(data.message));
    });

    s.emit('chat:stream', { messages });
  });
}
