import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export interface UseSocketOptions {
  autoConnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const { autoConnect = true, onConnect, onDisconnect, onError } = options;

  useEffect(() => {
    if (!autoConnect) return;

    // Create socket connection
    const socket = io(import.meta.env.VITE_SERVER_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      timeout: 5000,
    });

    socketRef.current = socket;

    // Event listeners
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      onConnect?.();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      onDisconnect?.();
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      onError?.(error);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [autoConnect, onConnect, onDisconnect, onError]);

  const emit = (event: string, data?: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
    
    // Return cleanup function
    return () => {
      socketRef.current?.off(event, callback);
    };
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      socketRef.current?.off(event, callback);
    } else {
      socketRef.current?.off(event);
    }
  };

  return {
    socket: socketRef.current,
    connected: socketRef.current?.connected || false,
    emit,
    on,
    off,
  };
}
