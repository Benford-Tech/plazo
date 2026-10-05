import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import { cn } from "@/lib/utils";

/** "Parking" sub-navigation: the plan and the settings (managers), the occupation and the spot planning (everyone). */
export function ParkingTabs({ right }: { right?: React.ReactNode }) {
  const t = fr.parking.tabs;
  const { user } = useAuth();
  const manager = can(user?.role, "parking:manage");
  const tab =
    "flex min-h-11 items-center px-4 text-lg font-semibold uppercase tracking-wider";
  const link = ({ isActive }: { isActive: boolean }) =>
    cn(
      tab,
      isActive
        ? "bg-primary font-bold text-primary-foreground"
        : "hover:bg-accent",
    );
  return (
    <div className="flex flex-wrap items-center gap-1 border-b-2 border-lime-deep">
      {manager && (
        <NavLink to="/parking/plan" className={link}>
          {t.plan}
        </NavLink>
      )}
      <NavLink to="/parking/occupation" className={link}>
        {t.occupation}
      </NavLink>
      <NavLink to="/parking/planning" className={link}>
        {t.planning}
      </NavLink>
      {manager && (
        <NavLink to="/parking/reglages" className={link}>
          {t.settings}
        </NavLink>
      )}
      {right && (
        <div className="ml-auto flex items-center gap-2.5 pb-1.5">{right}</div>
      )}
    </div>
  );
}
