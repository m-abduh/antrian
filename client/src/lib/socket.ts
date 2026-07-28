'use client';

import { io, Socket } from 'socket.io-client';

let customerSocket: Socket | null = null;
let currentSlug: string | null = null;

export function getCustomerSocket(slug: string): Socket {
  if (customerSocket?.connected && currentSlug === slug) return customerSocket;

  if (!customerSocket || currentSlug !== slug) {
    if (customerSocket) {
      customerSocket.disconnect();
      customerSocket.removeAllListeners();
    }
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
    customerSocket = io(baseUrl, { query: { slug }, transports: ['websocket', 'polling'] });
    currentSlug = slug;
  }

  if (!customerSocket.connected) {
    customerSocket.connect();
  }

  return customerSocket;
}

export function disconnectCustomerSocket() {
  if (customerSocket) {
    customerSocket.disconnect();
    customerSocket.removeAllListeners();
    customerSocket = null;
    currentSlug = null;
  }
}
