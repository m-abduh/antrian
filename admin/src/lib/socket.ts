'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let adminSocket: Socket | null = null;

export function getAdminSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;
  if (adminSocket) return adminSocket;
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
  adminSocket = io(baseUrl, { auth: { token }, transports: ['websocket', 'polling'] });
  adminSocket.on('connect_error', (err) => {
    if (err.message === 'Invalid token') {
      disconnectAdminSocket();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  });
  return adminSocket;
}

export function disconnectAdminSocket() {
  if (adminSocket) { adminSocket.disconnect(); adminSocket = null; }
}
