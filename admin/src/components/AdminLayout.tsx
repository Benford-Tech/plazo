import { useQuery } from "@tanstack/react-query";
import {
  BusFront,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Euro,
  FileCheck,
  FileSignature,
  Globe,
  LayoutDashboard,
  SquareParking,
  Users,
} from "lucide-react";
import { useState, type ComponentType, type SVGProps } from "react";
import { NavLink, Outlet, matchPath, useLocation, useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { AccountMenu } from "./AccountMenu";
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
import { RevenueMaskToggle } from "./platform/RevenueMaskToggle";
import { ViewSwitch } from "./platform/ViewSwitch";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Direction A (30/10/2026, « réorganise le menu sur le web »): four groups by daily use, each page of the pro space
 * reachable from the rail; an entry with pages of its own unfolds on them (open while one of them is shown), with a
 * counter where something waits. The account (photo, name, role) sits at the bottom of the rail.
 */
type NavSection = "today" | "reservations" | "parking" | "manager";
const SECTIONS: NavSection[] = ["today", "reservations", "parking", "manager"];
type Counter = "inbox" | "extras";
type NavChild = {
  label: string;
  to: string;
  permission?: Permission;
  /** Active on this exact path only (the group's first page shares its prefix with the others). */
  end?: boolean;
  counter?: Counter;
};
type NavItem = {
  label: string;
  to: string;
  icon: Icon;
  permission?: Permission;
  section: NavSection;
  /** The paths that belong to the entry (its children's, and the detail pages under it). */
  match?: string;
  children?: NavChild[];
};
const sub = fr.nav.sub;
const NAV: NavItem[] = [
  { label: fr.nav.dashboard, to: "/", icon: LayoutDashboard, permission: "reservations:view", section: "today" },
  {
    label: fr.nav.planning,
    to: "/planning",
    icon: CalendarDays,
    permission: "reservations:view",
    section: "today",
    match: "/planning/*",
    children: [
      { label: sub.planningDay, to: "/planning", end: true },
      { label: sub.forecast, to: "/planning/previsionnel" },
    ],
  },
  { label: fr.nav.shuttles, to: "/navettes", icon: BusFront, permission: "reservations:view", section: "today" },
  {
    label: fr.nav.reservations,
    to: "/reservations",
    icon: ClipboardList,
    permission: "reservations:view",
    section: "reservations",
    match: "/reservations/*",
    children: [
      { label: sub.allReservations, to: "/reservations", end: true },
      { label: sub.inbox, to: "/reservations/a-verifier", permission: "reservations:manage", counter: "inbox" },
      { label: sub.extras, to: "/reservations/services", permission: "reservations:manage", counter: "extras" },
      { label: sub.reminders, to: "/reservations/sms-veille", permission: "reservations:manage" },
      { label: sub.importFile, to: "/reservations/importer", permission: "parking:manage" },
    ],
  },
  {
    label: fr.nav.parking,
    to: "/parking",
    icon: SquareParking,
    permission: "reservations:view",
    section: "parking",
    match: "/parking/*",
    children: [
      { label: sub.occupation, to: "/parking/occupation" },
      { label: sub.plan, to: "/parking/plan", permission: "parking:manage" },
      { label: sub.spotPlanning, to: "/parking/planning" },
      { label: sub.settings, to: "/parking/reglages", permission: "parking:manage" },
    ],
  },
  // CA-B (09/10/2026): managers only.
  { label: fr.nav.revenue, to: "/chiffre-affaires", icon: Euro, permission: "revenue:view", section: "manager" },
  {
    label: fr.nav.plazo,
    to: "/plazo",
    icon: Globe,
    permission: "parking:manage",
    section: "manager",
    match: "/plazo/*",
    children: [
      { label: sub.listing, to: "/plazo/fiche" },
      { label: sub.pricing, to: "/plazo/tarifs" },
    ],
  },
  { label: fr.nav.team, to: "/equipe", icon: Users, permission: "team:manage", section: "manager" },
  // 26/10/2026 (R-A): the register of the travellers' signed contracts, managers only.
  { label: sub.signedContracts, to: "/contrats", icon: FileCheck, permission: "parking:manage", section: "manager" },
  { label: sub.plazoContract, to: "/mon-contrat", icon: FileSignature, permission: "parking:manage", section: "manager" },
];

const COUNTERS_KEY = ["nav-counts"];

function CountBadge({ n, className }: { n: number | null | undefined; className?: string }) {
  if (!n) return null;
  return (
    <span
      aria-label={fr.nav.toDo(n)}
      className={cn(
        "ml-auto min-w-[22px] rounded-full bg-[#FEF3C7] px-1.5 text-center font-mono text-[11px] font-semibold leading-5 text-[#B45309]",
        className,
      )}
    >
      {n}
    </span>
  );
}

/**
 * The pro space's shell (C-B colours): the rail on the left with its four groups and the account at the bottom, a thin
 * top bar with the parking; on a phone, the groups in a scrollable row, the current group's pages in a second row.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const allowed = (permission?: Permission) => !permission || can(user?.role, permission);
  const items = NAV.filter((i) => allowed(i.permission)).map((i) => ({
    ...i,
    children: i.children?.filter((c) => allowed(c.permission)),
  }));
  // The super admin's own operator space links to the "Plateforme" space (hidden from operators,
  // and while viewing another operator's space: the banner leads back).
  const platformAdmin = !!user?.isPlatformAdmin && !user.viewAs;
  const { data: counts } = useQuery({
    queryKey: COUNTERS_KEY,
    queryFn: () => adminApi.navCounts(),
    enabled: can(user?.role, "reservations:view"),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const countOf = (c?: Counter) => (c && counts ? (counts[c] ?? 0) : 0);
  const isIn = (item: NavItem) =>
    item.to === "/" ? pathname === "/" : !!matchPath({ path: item.match ?? item.to, end: !item.match }, pathname) || pathname === item.to;
  // Groups unfolded by hand (a group is always open while one of its pages is shown).
  const [unfolded, setUnfolded] = useState<Record<string, boolean>>({});
  const current = items.find((i) => i.children?.length && isIn(i));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const childLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex min-h-9 items-center gap-2 rounded-lg px-2 text-[13.5px]",
      isActive ? "bg-panel-2 font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="flex min-h-screen flex-col">
      <DemoBanner />
      <ViewAsBanner />
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="sticky top-0 z-20 flex shrink-0 flex-col border-b border-panel-line bg-panel-shell lg:h-screen lg:w-[236px] lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-4 pt-3 lg:px-4 lg:pb-3 lg:pt-5">
            <Logo height={28} suffix="Pro" className="shrink-0" />
            <div className="ml-auto lg:hidden">
              <AccountMenu platformAdmin={platformAdmin} onLogout={handleLogout} compact />
            </div>
          </div>
          <nav
            aria-label="Navigation principale"
            className="flex gap-1 overflow-x-auto px-3 pb-2 pt-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:px-2 lg:pb-3"
          >
            {SECTIONS.map((section) => {
              const inSection = items.filter((i) => i.section === section);
              if (inSection.length === 0) return null;
              return (
                <div key={section} data-testid={`nav-section-${section}`} className="contents lg:block">
                  <p className="hidden px-2 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground first:pt-1 lg:block">
                    {fr.nav.sections[section]}
                  </p>
                  {inSection.map((item) => {
                    const active = isIn(item);
                    const kids = item.children ?? [];
                    const hasKids = kids.length > 1;
                    const open = hasKids && (active || !!unfolded[item.to]);
                    const total = kids.reduce((n, c) => n + countOf(c.counter), 0);
                    return (
                      <div key={item.to} className="contents lg:block" data-testid={`nav-item-${item.to}`}>
                        <div className="flex shrink-0 items-center">
                          <NavLink
                            to={hasKids ? kids[0].to : item.to}
                            end={item.to === "/"}
                            className={cn(
                              "group flex min-h-11 flex-1 shrink-0 items-center gap-2.5 rounded-xl px-1.5 text-[14px] font-semibold uppercase tracking-wide",
                              active ? "text-foreground lg:bg-lime/15" : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border",
                                active
                                  ? "border-transparent bg-primary text-primary-foreground"
                                  : "border-panel-line bg-panel text-muted-foreground group-hover:bg-panel-2",
                              )}
                            >
                              <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                            </span>
                            <span className="whitespace-nowrap">{item.label}</span>
                            {!open && <CountBadge n={total} />}
                          </NavLink>
                          {hasKids && (
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-label={open ? fr.nav.collapse(item.label) : fr.nav.expand(item.label)}
                              disabled={active}
                              onClick={() => setUnfolded((u) => ({ ...u, [item.to]: !u[item.to] }))}
                              className="hidden h-9 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 lg:flex"
                            >
                              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                        {open && (
                          <div
                            data-testid={`nav-children-${item.to}`}
                            className="mb-1 ml-[22px] hidden flex-col border-l border-panel-line pl-3 lg:flex"
                          >
                            {kids.map((child) => (
                              <NavLink key={child.to} to={child.to} end={child.end} className={childLink}>
                                <span className="min-w-0 flex-1 truncate">{child.label}</span>
                                <CountBadge n={countOf(child.counter)} />
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </nav>
          {/* On a phone: the current group's pages in a second row. */}
          {current && (current.children?.length ?? 0) > 1 && (
            <div data-testid="nav-subrow" className="flex gap-1 overflow-x-auto border-t border-panel-line px-3 py-1.5 lg:hidden">
              {current.children!.map((child) => (
                <NavLink key={child.to} to={child.to} end={child.end} className={(s) => cn(childLink(s), "shrink-0 whitespace-nowrap")}>
                  {child.label}
                  <CountBadge n={countOf(child.counter)} className="ml-1" />
                </NavLink>
              ))}
            </div>
          )}
          <GettingStartedNav />
          <div className="hidden px-2 pb-3 pt-2 lg:block">
            <AccountMenu platformAdmin={platformAdmin} onLogout={handleLogout} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden h-12 items-center gap-4 border-b border-panel-line bg-panel-shell px-6 lg:flex">
            <span className="truncate text-sm uppercase tracking-wide text-muted-foreground">
              {user?.operatorName}
            </span>
            {platformAdmin && <ViewSwitch current="own" className="ml-auto" />}
            <span className={cn(platformAdmin ? "" : "ml-auto")}>
              <RevenueMaskToggle />
            </span>
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
