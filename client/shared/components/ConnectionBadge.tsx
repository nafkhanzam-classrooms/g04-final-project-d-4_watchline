import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/shared/types/protocol";

export function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  const online = status === "connected";
  return (
    <span className={`connection-badge ${online ? "online" : ""}`}>
      {online ? <Wifi size={13} /> : <WifiOff size={13} />}
      {online
        ? "Live"
        : status === "connecting"
          ? "Menghubungkan"
          : "Terputus"}
    </span>
  );
}
