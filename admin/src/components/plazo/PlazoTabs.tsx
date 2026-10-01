import { NavLink } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** "Sur Plazo" sub-navigation: listing, pricing, payouts (with the payment milestone). */
export function PlazoTabs({ right }: { right?: React.ReactNode }) {
  const t = fr.plazo.tabs;
  const tab = "flex min-h-11 items-center px-4 text-lg font-semibold uppercase tracking-wider";
  return (
    <div className="flex flex-wrap items-center gap-1 border-b-2 border-primary">
      <NavLink to="/plazo/fiche" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.listing}
      </NavLink>
      <NavLink to="/plazo/tarifs" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.pricing}
      </NavLink>
      <span aria-disabled="true" className={cn(tab, "cursor-not-allowed text-muted-foreground")} title={fr.plazo.soon}>
        {t.payouts}
        <span className="ml-2 border border-border px-1.5 text-xs">{fr.plazo.soon}</span>
      </span>
      {right && <div className="ml-auto flex items-center gap-2.5 pb-1.5">{right}</div>}
    </div>
  );
}
