import { fr } from "@/lib/fr";

/** Discreet "Démo" tag on the fictional parkings of the demo data (next to their title). */
export function DemoBadge() {
  return (
    <span
      title={fr.demo.hint}
      className="inline-flex h-5 items-center rounded-md border border-line px-1.5 text-[11px] font-semibold tracking-wide text-soft uppercase"
    >
      {fr.demo.badge}
      <span className="sr-only"> : {fr.demo.hint}</span>
    </span>
  );
}
