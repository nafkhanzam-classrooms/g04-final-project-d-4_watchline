import { Play } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 ${compact ? "max-md:justify-center" : ""}`}
      aria-label="WatchLine"
    >
      {/* <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-white">
        <Play size={compact ? 15 : 18} fill="currentColor" />
      </span> */}
      <span
        className={`text-xl font-bold tracking-tight ${
          compact ? "max-md:hidden" : ""
        }`}
      >
        Watch<span className="text-accent">Line</span>
      </span>
    </div>
  );
}
