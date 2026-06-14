"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ClientMessage,
  ConnectionStatus,
  ServerMessage,
} from "@/shared/types/protocol";

type MessageListener = (message: ServerMessage) => void;

type WebSocketContextValue = {
  status: ConnectionStatus;
  send: (message: ClientMessage) => boolean;
  subscribe: (listener: MessageListener) => () => void;
};

const WebSocketContext = createContext<WebSocketContextValue | null>(null);
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080";

export function WebSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const socketRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef(new Set<MessageListener>());
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");

  useEffect(() => {
    let disposed = false;

    const connect = () => {
      if (disposed) return;
      setStatus("connecting");

      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        attemptsRef.current = 0;
        setStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as ServerMessage;
          listenersRef.current.forEach((listener) => listener(message));
        } catch {
          // Ignore malformed frames; the server protocol is JSON-only.
        }
      };

      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (disposed) return;
        socketRef.current = null;
        setStatus("disconnected");
        const delay = Math.min(1000 * 2 ** attemptsRef.current, 8000);
        attemptsRef.current += 1;
        retryRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      disposed = true;
      if (retryRef.current) clearTimeout(retryRef.current);
      socketRef.current?.close();
    };
  }, []);

  const send = useCallback((message: ClientMessage) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(message));
    return true;
  }, []);

  const subscribe = useCallback((listener: MessageListener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const value = useMemo(
    () => ({ status, send, subscribe }),
    [status, send, subscribe],
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used inside WebSocketProvider");
  }
  return context;
}
