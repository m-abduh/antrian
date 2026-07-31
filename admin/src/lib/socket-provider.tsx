'use client';

import { createContext, useContext, useEffect, useRef, useReducer, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  kicked: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, isConnected: false, kicked: false });

export function useAdminSocket() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const token = (session as any)?.accessToken;
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useReducer((_: boolean, next: boolean) => next, false);
  const [kicked, setKicked] = useState(false);
  const [, forceRender] = useReducer(x => x + 1, 0);

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !token) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        tokenRef.current = null;
        setIsConnected(false);
        setKicked(false);
        forceRender();
      }
      return;
    }

    if (socketRef.current?.connected && tokenRef.current === token) {
      return;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '');
    const socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));
    socket.on('kicked', (msg: string) => {
      console.log('[WS] kicked:', msg);
      socket.disconnect();
      socket.removeAllListeners();
      socketRef.current = null;
      tokenRef.current = null;
      setIsConnected(false);
      setKicked(true);
      forceRender();
    });

    socketRef.current = socket;
    tokenRef.current = token;
    forceRender();

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      if (socketRef.current === socket) {
        socketRef.current = null;
        tokenRef.current = null;
      }
    };
  }, [session, sessionStatus, token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, kicked }}>
      {children}
    </SocketContext.Provider>
  );
}
