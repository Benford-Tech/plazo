import { NavLink } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** "Sur Plazo" sub-navigation: listing, pricing and the flyer (payouts are followed on Stripe, see OnlinePayments). */
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
      <NavLink to="/plazo/flyer" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.flyer}
      </NavLink>
      <NavLink to="/plazo/site" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.site}
      </NavLink>
      {right && <div className="ml-auto flex items-center gap-2.5 pb-1.5">{right}</div>}
    </div>
  );
}
