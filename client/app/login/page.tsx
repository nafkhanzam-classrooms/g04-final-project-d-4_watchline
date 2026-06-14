import type { Metadata } from "next";
import { AuthView } from "@/features/auth/views/AuthView";

export const metadata: Metadata = {
  title: "Masuk | WatchLine",
};

export default function LoginPage() {
  return <AuthView mode="login" />;
}
