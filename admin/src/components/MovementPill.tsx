import { fr } from "@/lib/fr";
import type { Movement } from "@/lib/movement";
import { cn } from "@/lib/utils";

/** « ARRIVÉE » / « DÉPART » on its colour (green, indigo), or « ARRIVÉE · sam. 4 oct., 06:30 » with a time. */
export function MovementPill({ kind, time, className }: { kind: Movement; time?: string; className?: string }) {
  const label = fr.movement[kind];
  return (
    <span
      data-testid={`movement-${kind}`}
      className={cn(
        "inline-flex w-fit shrink-0 items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-white",
        kind === "arrival" ? "bg-ok" : "bg-info",
        className,
      )}
    >
      {time ? `${label} · ${time}` : label}
    </span>
  );
}
