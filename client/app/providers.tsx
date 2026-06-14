"use client";

import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { WebSocketProvider } from "@/shared/providers/WebSocketProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      <AuthProvider>{children}</AuthProvider>
    </WebSocketProvider>
  );
}
