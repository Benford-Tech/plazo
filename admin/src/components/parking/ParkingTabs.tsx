import { NavLink } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** "Parking" sub-navigation: the plan (bloc 2) and the settings. */
export function ParkingTabs({ right }: { right?: React.ReactNode }) {
  const t = fr.parking.tabs;
  const tab = "flex min-h-11 items-center px-4 text-lg font-semibold uppercase tracking-wider";
  return (
    <div className="flex flex-wrap items-center gap-1 border-b-2 border-primary">
      <NavLink to="/parking/plan" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.plan}
      </NavLink>
      <NavLink to="/parking/reglages" className={({ isActive }) => cn(tab, isActive ? "bg-primary font-bold text-primary-foreground" : "hover:bg-accent")}>
        {t.settings}
      </NavLink>
      {right && <div className="ml-auto flex items-center gap-2.5 pb-1.5">{right}</div>}
    </div>
  );
}
