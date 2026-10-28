import { NavLink } from "react-router-dom";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/** « Jour · Prévisionnel » (28/10/2026): the two views of the Planning menu. */
export function PlanningTabs() {
  const t = fr.forecast;
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex h-9 items-center rounded-full px-4 text-sm font-semibold",
      isActive ? "bg-lime text-lime-ink" : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );
  return (
    <nav aria-label={t.tabsLabel} className="flex w-fit gap-1 rounded-full border border-panel-line bg-panel p-1">
      <NavLink to="/planning" end className={tab}>
        {t.tabs.day}
      </NavLink>
      <NavLink to="/planning/previsionnel" className={tab}>
        {t.tabs.forecast}
      </NavLink>
    </nav>
  );
}
