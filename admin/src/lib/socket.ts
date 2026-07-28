'use client';

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from './auth-token';

let adminSocket: Socket | null = null;

export function getAdminSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;

  if (adminSocket?.connected) return adminSocket;

  if (!adminSocket) {
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
    adminSocket = io(baseUrl, { auth: { token }, transports: ['websocket', 'polling'] });

    adminSocket.on('connect', () => {
      console.log('[WS Admin] connected socketId=' + adminSocket?.id);
    });

    adminSocket.on('disconnect', (reason) => {
      console.log('[WS Admin] disconnected reason=' + reason);
    });

    adminSocket.on('connect_error', (err) => {
      console.log('[WS Admin] connect_error msg=' + err.message);
    });

    adminSocket.io.on('reconnect', (attempt) => {
      console.log('[WS Admin] reconnected after attempt=' + attempt);
    });

    adminSocket.io.on('reconnect_attempt', (attempt) => {
      console.log('[WS Admin] reconnect_attempt attempt=' + attempt);
    });

    adminSocket.io.on('reconnect_error', (err) => {
      console.log('[WS Admin] reconnect_error msg=' + err.message);
    });

    adminSocket.io.on('reconnect_failed', () => {
      console.log('[WS Admin] reconnect_failed');
    });
  }

  if (!adminSocket.connected) {
    adminSocket.connect();
  }

  return adminSocket;
}

export function disconnectAdminSocket() {
  if (adminSocket) {
    adminSocket.disconnect();
    adminSocket.removeAllListeners();
    adminSocket = null;
  }
}
