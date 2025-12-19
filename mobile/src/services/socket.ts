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
    socketInstance = io(API_BASE, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on('connect', () => {
      console.log('[Socket] Connected');
    });

    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    return socketInstance;
  } catch (error) {
    console.error('[Socket] Failed to initialize:', error);
    return null;
  }
}

/**
 * Lấy socket instance hiện tại
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

