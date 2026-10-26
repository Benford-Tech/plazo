import {
  BusFront,
  CalendarDays,
  ClipboardList,
  Euro,
  FileCheck,
  FileSignature,
  Globe,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SquareParking,
  UserRound,
  Users,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { can, type Permission } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { ContractBanner } from "./ContractBanner";
import { GettingStartedNav } from "./GettingStartedNav";
import { EmailVerificationBanner } from "./EmailVerificationBanner";
import { Logo } from "./Logo";
import { DemoBanner } from "./DemoBanner";
import { ViewAsBanner } from "./platform/ViewAsBanner";
import { ViewSwitch } from "./platform/ViewSwitch";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
/** W-A (26/10/2026, « réorganise le menu par rôle »): the rail in three sections, a header over each. */
type NavSection = "operations" | "manager" | "account";
const SECTIONS: NavSection[] = ["operations", "manager", "account"];
type NavItem = {
  label: string;
  to: string;
  icon: Icon;
  permission?: Permission;
  section: NavSection;
};
const NAV: NavItem[] = [
  {
    label: fr.nav.dashboard,
    to: "/",
    icon: LayoutDashboard,
    permission: "reservations:view",
    section: "operations",
  },
  {
    label: fr.nav.planning,
    to: "/planning",
    icon: CalendarDays,
    permission: "reservations:view",
    section: "operations",
  },
  {
    label: fr.nav.shuttles,
    to: "/navettes",
    icon: BusFront,
    permission: "reservations:view",
    section: "operations",
  },
  {
    label: fr.nav.reservations,
    to: "/reservations",
    icon: ClipboardList,
    permission: "reservations:view",
    section: "operations",
  },
  // CA-B (09/10/2026): managers only.
  {
    label: fr.nav.revenue,
    to: "/chiffre-affaires",
    icon: Euro,
    permission: "revenue:view",
    section: "manager",
  },
  {
    label: fr.nav.parking,
    to: "/parking",
    icon: SquareParking,
    permission: "reservations:view",
    section: "operations",
  },
  {
    label: fr.nav.plazo,
    to: "/plazo",
    icon: Globe,
    permission: "parking:manage",
    section: "manager",
  },
  {
    label: fr.nav.team,
    to: "/equipe",
    icon: Users,
    permission: "team:manage",
    section: "manager",
  },
  {
    label: fr.nav.contract,
    to: "/mon-contrat",
    icon: FileSignature,
    permission: "parking:manage",
    section: "manager",
  },
  // 26/10/2026 (R-A): the register of the travellers' signed contracts, managers only.
  {
    label: fr.nav.contracts,
    to: "/contrats",
    icon: FileCheck,
    permission: "parking:manage",
    section: "manager",
  },
  {
    label: fr.nav.account,
    to: "/mon-compte",
    icon: UserRound,
    section: "account",
  },
];

/**
 * Direction B, fusion "Flotte + Opérations" (05/10/2026): a black rail on the left with an icon and
 * a label per section (the current one in yellow), a thin top bar with the parking and the account;
 * on a phone the rail becomes a scrollable row under the top bar.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter(
    (i) => !i.permission || can(user?.role, i.permission),
  );
  // The super admin's own operator space links to the "Plateforme" space (hidden from operators,
  // and while viewing another operator's space: the banner leads back).
  const platformAdmin = !!user?.isPlatformAdmin && !user.viewAs;
  if (platformAdmin)
    items.push({
      label: fr.nav.platform,
      to: "/plateforme",
      icon: ShieldCheck,
      section: "account",
    });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
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
          <nav
            aria-label="Navigation principale"
            className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1 lg:flex-col lg:gap-0.5 lg:px-2 lg:pb-0"
          >
            {SECTIONS.map((section) => {
              const inSection = items.filter((i) => i.section === section);
              if (inSection.length === 0) return null;
              return (
                <div
                  key={section}
                  data-testid={`nav-section-${section}`}
                  className="contents lg:block"
                >
                  <p className="hidden px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground first:pt-1 lg:block">
                    {fr.nav.sections[section]}
                  </p>
                  {inSection.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "group flex min-h-11 shrink-0 items-center gap-2.5 rounded-xl px-1.5 text-[14px] font-semibold uppercase tracking-wide",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* The "Flotte" rail: a rounded tile per section, the current one yellow. */}
                          <span
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border",
                              isActive
                                ? "border-transparent bg-primary text-primary-foreground"
                                : "border-panel-line bg-panel text-muted-foreground group-hover:bg-panel-2",
                            )}
                          >
                            <item.icon
                              className="h-[18px] w-[18px]"
                              aria-hidden="true"
                            />
                          </span>
                          <span>{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              );
            })}
          </nav>
          <GettingStartedNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden h-12 items-center gap-4 border-b border-panel-line bg-panel-shell px-6 lg:flex">
            <span className="truncate text-sm uppercase tracking-wide text-muted-foreground">
              {user?.operatorName}
            </span>
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
          <ContractBanner />
          <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
