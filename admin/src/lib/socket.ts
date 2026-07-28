'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let adminSocket: Socket | null = null;

export function getAdminSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;
  if (adminSocket?.connected) return adminSocket;
  if (adminSocket) adminSocket.disconnect();
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
  adminSocket = io(baseUrl, { auth: { token }, transports: ['websocket', 'polling'] });
  return adminSocket;
}

export function disconnectAdminSocket() {
  if (adminSocket) { adminSocket.disconnect(); adminSocket = null; }
}
