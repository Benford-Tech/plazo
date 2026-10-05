import { CalendarDays, ClipboardList, Globe, LayoutDashboard, LogOut, ShieldCheck, SquareParking, UserRound, Users } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { can, type Permission } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { Logo } from "./Logo";
import { ViewAsBanner } from "./platform/ViewAsBanner";
import { ViewSwitch } from "./platform/ViewSwitch";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
const NAV: { label: string; to: string; icon: Icon; permission?: Permission }[] = [
  { label: fr.nav.dashboard, to: "/", icon: LayoutDashboard, permission: "reservations:view" },
  { label: fr.nav.planning, to: "/planning", icon: CalendarDays, permission: "reservations:view" },
  { label: fr.nav.reservations, to: "/reservations", icon: ClipboardList, permission: "reservations:view" },
  { label: fr.nav.parking, to: "/parking", icon: SquareParking, permission: "reservations:view" },
  { label: fr.nav.plazo, to: "/plazo", icon: Globe, permission: "parking:manage" },
  { label: fr.nav.team, to: "/equipe", icon: Users, permission: "team:manage" },
  { label: fr.nav.account, to: "/mon-compte", icon: UserRound },
];

/**
 * Direction B, fusion "Flotte + Opérations" (05/10/2026): a black rail on the left with an icon and
 * a label per section (the current one in yellow), a thin top bar with the parking and the account;
 * on a phone the rail becomes a scrollable row under the top bar.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter(i => !i.permission || can(user?.role, i.permission));
  // The super admin's own operator space links to the "Plateforme" space (hidden from operators,
  // and while viewing another operator's space: the banner leads back).
  const platformAdmin = !!user?.isPlatformAdmin && !user.viewAs;
  if (platformAdmin) items.push({ label: fr.nav.platform, to: "/plateforme", icon: ShieldCheck });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <ViewAsBanner />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="sticky top-0 z-20 shrink-0 border-b border-panel-line bg-panel-shell lg:h-screen lg:w-[196px] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-4 pt-3 lg:px-4 lg:pb-5 lg:pt-5">
            <Logo height={28} suffix="Pro" className="shrink-0" />
            <button
              onClick={handleLogout}
              aria-label={fr.nav.logout}
              className="ml-auto flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground lg:hidden"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Navigation principale" className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1 lg:flex-col lg:gap-0.5 lg:px-2 lg:pb-0">
            {items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "group flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-1.5 text-[14px] font-semibold uppercase tracking-wide",
                    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {/* The "Flotte" rail: a rounded tile per section, the current one yellow. */}
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border",
                        isActive ? "border-transparent bg-primary text-primary-foreground" : "border-panel-line bg-panel text-muted-foreground group-hover:bg-panel-2",
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden h-12 items-center gap-4 border-b border-panel-line bg-panel-shell px-6 lg:flex">
            <span className="truncate text-sm uppercase tracking-wide text-muted-foreground">{user?.operatorName}</span>
            {platformAdmin ? (
              <ViewSwitch current="own" className="ml-auto" />
            ) : (
              <span className="ml-auto truncate text-sm text-muted-foreground">
                {user?.name} · {user ? fr.roles[user.role] : ""}
              </span>
            )}
            <button
              onClick={handleLogout}
              aria-label={fr.nav.logout}
              className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </header>
          <EmailVerificationBanner />
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
