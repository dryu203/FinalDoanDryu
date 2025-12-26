import { apiGet, apiPost } from './api';
import { getSocket, SocketEvents } from './socket';

export type ChatMessageDto = {
  _id: string;
  room: string;
  userId: string;
  userName?: string;
  content: string;
  attachment?: {
    url: string;
    name: string;
    size: number;
    mimeType?: string;
  };
  createdAt: string;
};

export async function fetchMessages(room = 'global', limit = 100): Promise<ChatMessageDto[]> {
  const res = await apiGet<{ data?: ChatMessageDto[] }>(
    `/api/chat/messages?room=${encodeURIComponent(room)}&limit=${limit}`
  );
  return res?.data || [];
}

export async function markAsRead(room: string, messageId: string): Promise<void> {
  await apiPost('/api/chat/read', { room, messageId });
}

// Socket.io real-time functions
export type MessageHandler = (message: ChatMessageDto) => void;
export type TypingHandler = (data: { room: string; userId: string; userName?: string; typing: boolean }) => void;

export function subscribeToMessages(
  room: string,
  onMessage: MessageHandler
): () => void {
  const socket = getSocket();
  if (!socket) {
    console.warn('[Chat] Socket not initialized, cannot subscribe to messages');
    return () => {};
  }

  // Join room
  socket.emit('chat:join', room);
  
  // Create a specific handler function so we can remove it later
  const messageHandler = (payload: ChatMessageDto) => {
    if (payload.room === room) {
      onMessage(payload);
    }
  };

  // Subscribe to messages
  socket.on('chat:message', messageHandler);

  // Re-join room on reconnect
  const reconnectHandler = () => {
    console.log('[Chat] Socket reconnected, rejoining room:', room);
    socket.emit('chat:join', room);
  };
  socket.on('connect', reconnectHandler);

  // Cleanup function
  return () => {
    socket.off('chat:message', messageHandler);
    socket.off('connect', reconnectHandler);
    socket.emit('chat:leave', room);
  };
}

export function sendMessage(
  room: string,
  content: string,
  attachment?: { url: string; name: string; size: number; mimeType?: string }
): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = getSocket();
    if (!socket) {
      reject(new Error('Socket not connected'));
      return;
    }

    socket.emit(
      'chat:send',
      { room, content, attachment },
      (err?: string) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve();
        }
      }
    );
  });
}

export function sendTyping(room: string, typing: boolean): void {
  const socket = getSocket();
  if (!socket) return;
  socket.emit('chat:typing', { room, typing });
}

export function subscribeToTyping(
  room: string,
  onTyping: TypingHandler
): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  const typingHandler = (data: { room: string; userId: string; userName?: string; typing: boolean }) => {
    if (data.room === room) {
      onTyping(data);
    }
  };

  socket.on('chat:typing', typingHandler);

  return () => {
    socket.off('chat:typing', typingHandler);
  };
}

