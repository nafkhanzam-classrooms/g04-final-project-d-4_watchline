"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWebSocket } from "@/shared/providers/WebSocketProvider";
import type {
  ConnectionStatus,
  User,
} from "@/shared/types/protocol";

const TOKEN_KEY = "watchline-session";

type AuthContextValue = {
  user: User | null;
  status: ConnectionStatus;
  loading: boolean;
  initialized: boolean;
  error: string;
  login: (username: string, password: string) => void;
  register: (username: string, password: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { status, send, subscribe } = useWebSocket();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState("");

  useEffect(
    () =>
      subscribe((message) => {
        if (message.type === "AUTH_OK") {
          const session = {
            username: message.username,
            token: message.token,
          };
          localStorage.setItem(TOKEN_KEY, JSON.stringify(session));
          setUser(session);
          setError("");
          setLoading(false);
          setInitialized(true);
        }
        if (message.type === "AUTH_FAIL") {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setError(message.message);
          setLoading(false);
          setInitialized(true);
        }
        if (message.type === "LOGOUT_OK") {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setLoading(false);
          setInitialized(true);
        }
      }),
    [subscribe],
  );

  useEffect(() => {
    if (status !== "connected") return;
    const rawSession = localStorage.getItem(TOKEN_KEY);
    if (!rawSession) {
      setInitialized(true);
      return;
    }

    try {
      const session = JSON.parse(rawSession) as User;
      setLoading(true);
      setInitialized(false);
      send({ type: "RECONNECT", token: session.token });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setInitialized(true);
    }
  }, [status, send]);

  const authenticate = useCallback(
    (mode: "LOGIN" | "REGISTER", username: string, password: string) => {
      setError("");
      setLoading(true);
      const sent = send({ type: mode, username: username.trim(), password });
      if (!sent) {
        setError("Server belum terhubung. Coba lagi dalam beberapa saat.");
        setLoading(false);
      }
    },
    [send],
  );

  const logout = useCallback(() => {
    if (user) send({ type: "LOGOUT", token: user.token });
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setInitialized(true);
  }, [send, user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      loading,
      initialized,
      error,
      login: (username: string, password: string) =>
        authenticate("LOGIN", username, password),
      register: (username: string, password: string) =>
        authenticate("REGISTER", username, password),
      logout,
    }),
    [authenticate, error, initialized, loading, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
