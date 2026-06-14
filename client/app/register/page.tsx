import type { Metadata } from "next";
import { AuthView } from "@/features/auth/views/AuthView";

export const metadata: Metadata = {
  title: "Daftar | WatchLine",
};

export default function RegisterPage() {
  return <AuthView mode="register" />;
}
