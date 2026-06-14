import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/shared/types/protocol";

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const online = status === "connected";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-line bg-white/5 px-3 py-2 text-xs font-semibold ${online ? "text-green" : "text-muted"}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {online
        ? "Live"
        : status === "connecting"
          ? "Menghubungkan"
          : "Terputus"}
    </span>
  );
}
