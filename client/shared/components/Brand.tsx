import { Play } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="WatchLine">
      <span className="brand-mark">
        <Play size={compact ? 15 : 18} fill="currentColor" />
      </span>
      <span className={compact ? "brand-name brand-name-small" : "brand-name"}>
        Watch<span>Line</span>
      </span>
    </div>
  );
}
