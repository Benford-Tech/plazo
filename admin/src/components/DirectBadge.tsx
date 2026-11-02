import { Handshake } from "lucide-react";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** The handshake of a booking made with the parking itself: « En direct » (02/11/2026). */
export function DirectBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  const t = fr.direct;
  return (
    <span
      title={t.title}
      aria-label={compact ? t.badge : undefined}
      data-testid="direct-badge"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-lime/30 font-semibold text-lime-deep",
        compact ? "p-1" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Handshake className="size-3.5" aria-hidden="true" />
      {!compact && t.badge}
    </span>
  );
}
