import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { NAV, SECTIONS, isInItem, type Counter, type NavItem } from "./nav-items";
import { MobilePagePills, MobileTabBar } from "./MobileTabBar";
import { CountBadge } from "./CountBadge";
import { useLiveSync } from "@/lib/live-sync";
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
import { ParkingLogo } from "./ParkingLogo";
import { DemoBanner } from "./DemoBanner";
import { ViewAsBanner } from "./platform/ViewAsBanner";
import { RevenueMaskToggle } from "./platform/RevenueMaskToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { ParkingSwitcher } from "./platform/ParkingSwitcher";

const COUNTERS_KEY = ["nav-counts"];

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
  useLiveSync(can(user?.role, "reservations:view"));
  const countOf = (c?: Counter) => (c && counts ? (counts[c] ?? 0) : 0);
  const isIn = (item: NavItem) => isInItem(item, pathname);
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
          <div className="flex items-center gap-3 px-4 py-2 lg:px-4 lg:pb-3 lg:pt-5">
            <Logo height={28} suffix="Pro" className="shrink-0" />
            {/* 02/11/2026 (direction B): the parking's logo next to the sign, after a thin line. */}
            {user?.operatorLogoUpdatedAt && (
              <>
                <span aria-hidden="true" className="h-7 w-px shrink-0 bg-panel-line" />
                <ParkingLogo version={user.operatorLogoUpdatedAt} name={user.operatorName} size={28} />
              </>
            )}
            {user?.isPlatformAdmin && <ParkingSwitcher current="operator" compact className="lg:hidden" />}
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <NotificationBell />
              <AccountMenu platformAdmin={platformAdmin} onLogout={handleLogout} compact />
            </div>
          </div>
          <nav
            aria-label="Navigation principale"
            className="hidden lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:gap-0.5 lg:overflow-y-auto lg:px-2 lg:pb-3"
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
                    const total = kids.reduce((n, c) => n + countOf(c.counter), countOf(item.counter));
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
          {/* 10/11/2026 (direction A, « tab bar »): on a phone, the current tab's pages in pills under the top bar. */}
          <MobilePagePills items={items} counts={counts} />
          <GettingStartedNav />
          <div className="hidden px-2 pb-3 pt-2 lg:block">
            <AccountMenu platformAdmin={platformAdmin} onLogout={handleLogout} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="hidden h-12 items-center gap-4 border-b border-panel-line bg-panel-shell px-6 lg:flex">
            <ParkingLogo version={user?.operatorLogoUpdatedAt} name={user?.operatorName} size={22} className="-mr-2" />
            {/* 10/11/2026 (direction A): for the super admin, the parking's name opens the parking switcher. */}
            {user?.isPlatformAdmin ? (
              <ParkingSwitcher current="operator" />
            ) : (
              <span className="truncate text-sm uppercase tracking-wide text-muted-foreground">
                {user?.operatorName}
              </span>
            )}
            <span className="ml-auto">
              <RevenueMaskToggle />
            </span>
            {/* 13/11/2026 (« plus en évidence sur le web »): the clients' messages one click away, with what is unread. */}
            {can(user?.role, "reservations:status") && (
              <Link
                to="/reservations/whatsapp"
                data-testid="header-messages"
                aria-label={countOf("whatsapp") ? fr.nav.unreadMessages(countOf("whatsapp")) : fr.nav.messages}
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold",
                  countOf("whatsapp")
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "border-panel-line bg-panel text-muted-foreground hover:text-foreground",
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {fr.nav.messages}
                {countOf("whatsapp") > 0 && (
                  <span className="min-w-[18px] rounded-full bg-[#D97706] px-1 text-center font-mono text-[10px] leading-4 text-white">
                    {countOf("whatsapp")}
                  </span>
                )}
              </Link>
            )}
            <NotificationBell />
          </header>
          <EmailVerificationBanner />
          <ContractBanner />
          <main key={user?.operatorId} className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pb-28 pt-6 sm:px-6 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileTabBar items={items} counts={counts} />
    </div>
  );
}
