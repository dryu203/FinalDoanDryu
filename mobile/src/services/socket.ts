import { io, Socket } from 'socket.io-client';
import { API_BASE } from '../config/api';
import { getAuthToken } from './auth';

let socketInstance: Socket | null = null;

export type SocketEvents = {
  'chat:message': (payload: any) => void;
  'chat:typing': (payload: { room: string; userId: string; userName?: string; typing: boolean }) => void;
  'presence:state': (payload: { userId: string; online: boolean }) => void;
};

/**
 * Khởi tạo và kết nối Socket.io
 */
export async function initializeSocket(): Promise<Socket | null> {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  const token = await getAuthToken();
  if (!token) {
    console.warn('[Socket] No auth token, cannot connect');
    return null;
  }

  try {
    // Disconnect existing instance if any
    if (socketInstance) {
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
      socketInstance = null;
    }

    socketInstance = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity, // Keep trying to reconnect
      reconnectionDelayMax: 5000,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected');
      // Auto-join global room on connect/reconnect
      socketInstance?.emit('chat:join', 'global');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      // Re-join global room on reconnect
      socketInstance?.emit('chat:join', 'global');
    });

    return socketInstance;
  } catch (error) {
    console.error('[Socket] Failed to initialize:', error);
    return null;
  }
}

/**
 * Lấy socket instance hiện tại
 * Trả về null nếu chưa được initialize
 * Nên gọi initializeSocket() trước khi dùng
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Ngắt kết nối socket
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

