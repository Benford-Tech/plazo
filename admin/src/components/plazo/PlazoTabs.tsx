import { NavLink } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** "Sur Plazo" sub-navigation: listing and pricing (payouts are followed on Stripe, see OnlinePayments). */
export function PlazoTabs({ right }: { right?: React.ReactNode }) {
  const t = fr.plazo.tabs;
  const tab = "flex min-h-11 items-center px-4 text-lg font-semibold uppercase tracking-wider";
  return (
    <div className="flex flex-wrap items-center gap-1 border-b-2 border-lime-deep">
      <NavLink to="/plazo/fiche" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.listing}
      </NavLink>
      <NavLink to="/plazo/tarifs" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.pricing}
      </NavLink>
      {right && <div className="ml-auto flex items-center gap-2.5 pb-1.5">{right}</div>}
    </div>
  );
}
