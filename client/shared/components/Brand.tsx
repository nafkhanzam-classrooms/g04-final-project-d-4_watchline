import { Play } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" aria-label="WatchLine">
      <span className="flex items-center justify-center w-10 h-10 bg-accent rounded-full text-white">
        <Play size={compact ? 15 : 18} fill="currentColor" />
      </span>
      <span className={`font-bold tracking-tight ${compact ? "text-xl" : "text-xl"}`}>
        Watch<span className="text-accent">Line</span>
      </span>
    </div>
  );
}
