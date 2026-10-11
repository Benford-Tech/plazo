import { fr } from "@/lib/fr";

/** Discreet "Démo" tag on the fictional parkings of the demo data (next to their title): a neutral soft pill. */
export function DemoBadge() {
  return (
    <span title={fr.demo.hint} className="pill">
      {fr.demo.badge}
      <span className="sr-only"> : {fr.demo.hint}</span>
    </span>
  );
}
