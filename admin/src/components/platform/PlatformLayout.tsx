import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Send,
} from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { Logo } from "../Logo";
import { ViewAsBanner } from "./ViewAsBanner";
import { ParkingSwitcher } from "./ParkingSwitcher";
import { PLATFORM_GROUPS, PLATFORM_MORE_PATH, TABS } from "./platform-nav";

function tabOf(pathname: string): string {
  if (pathname === "/plateforme") return "overview";
  const tab = TABS.find(
    (t) =>
      t.key !== "overview" &&
      (pathname === t.to || pathname.startsWith(`${t.to}/`)),
  );
  return tab?.key ?? "more";
}

/**
 * On a phone the scrolling row of twelve links gives way to a bar at the bottom, like the operators' space:
 * Pilotage · Loueurs · Prospection · Plus. Hidden from 1 024 px, where the rail takes over.
 */
function PlatformTabBar({ pending }: { pending: number }) {
  const { pathname } = useLocation();
  const current = tabOf(pathname);
  const labels: Record<string, string> = {
    overview: fr.platform.nav.groups.steer,
    operators: fr.platform.tabs.operators,
    prospecting: fr.platform.tabs.prospecting,
  };
  const tabs = [
    ...TABS.map((t) => ({ ...t, label: labels[t.key], badge: 0 })),
    {
      key: "more",
      to: PLATFORM_MORE_PATH,
      icon: MoreHorizontal,
      label: fr.nav.more,
      badge: pending,
    },
  ];
  return (
    <nav
      aria-label={fr.platform.nav.tabBar}
      data-testid="platform-tab-bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-panel-line bg-panel pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {tabs.map(({ key, to, icon: TabIcon, label, badge }) => {
          const active = key === current;
          return (
            <Link
              key={key}
              to={to}
              data-testid={`platform-tab-${key}`}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[58px] flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                active ? "text-lime-deep" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-12 items-center justify-center rounded-full",
                  active && "bg-primary text-primary-foreground",
                )}
              >
                <TabIcon className="h-[19px] w-[19px]" aria-hidden="true" />
              </span>
              <span className="max-w-full truncate px-1">{label}</span>
              {badge > 0 && (
                <span
                  aria-label={fr.nav.toDo(badge)}
                  className="absolute left-1/2 top-1 ml-2 min-w-[18px] rounded-full bg-[#D97706] px-1 text-center font-mono text-[10px] font-semibold leading-4 text-white"
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * The super admin's "Plateforme" space, direction A of 11/11/2026 (« A avec la page loueur de C »): a rail on the left
 * in three groups (Pilotage · Croissance · Outils), the parking switcher at its head and the account at its foot, like
 * the operators' space; on a phone the rail becomes a scrolling row above the page. A capacity study keeps the whole
 * height beside the rail (map).
 */
export function PlatformLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const study = /^\/plateforme\/capacite\/[^/]+/.test(pathname);
  // 12/11/2026 (« ça doit prendre tout l'écran ») : the prospects table and its sending panel use the whole width.
  const wide = pathname.startsWith("/plateforme/prospection");
  // The cockpit's « À traiter » counts the listings waiting for review; the rail shows that number on Annonces.
  const overview = useQuery({
    queryKey: ["platform", "operators", "overview"],
    queryFn: adminApi.getPlatformOverview,
    staleTime: 60_000,
  });
  const pendingListings =
    overview.data?.todos.filter((t) => t.kind === "listing_review").length ?? 0;
  const firstName = user?.firstName ?? user?.name ?? "";

  return (
    <div
      className={cn(
        "flex flex-col",
        study ? "h-screen min-h-[600px] overflow-hidden" : "min-h-screen",
      )}
    >
      <ViewAsBanner />
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <nav
          aria-label={fr.platform.brand}
          className="shrink-0 border-b border-border bg-card lg:flex lg:w-[248px] lg:flex-col lg:border-b-0 lg:border-r"
        >
          <div className="flex items-center gap-3 px-4 py-3 lg:flex-col lg:items-stretch lg:gap-4 lg:px-3.5 lg:py-5">
            <Logo
              height={26}
              suffix={fr.platform.brand}
              className="min-w-0 shrink"
            />
            <ParkingSwitcher current="platform" className="ml-auto lg:ml-0" />
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:gap-5 lg:px-3.5 lg:pb-4">
            {PLATFORM_GROUPS.map((group) => (
              <div
                key={group.label}
                className="flex shrink-0 gap-1 lg:flex-col lg:gap-0.5"
              >
                <span className="hidden px-2.5 pb-1.5 text-[11px] uppercase tracking-[0.08em] text-muted-foreground lg:block">
                  {group.label}
                </span>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        "flex min-h-10 shrink-0 items-center justify-between gap-2 rounded-lg px-2.5 text-[15px]",
                        isActive
                          ? "bg-primary font-semibold text-primary-foreground"
                          : "text-foreground hover:bg-accent",
                      )
                    }
                  >
                    <span>{item.label}</span>
                    {item.badge === "listings" && pendingListings > 0 && (
                      <span className="rounded-full bg-[#B45309] px-2 text-xs font-semibold text-white">
                        {pendingListings}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
            <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0 lg:mt-auto lg:border-t lg:border-border lg:pt-3">
              <div className="hidden min-w-0 flex-1 flex-col lg:flex">
                <span className="truncate text-sm font-semibold">
                  {firstName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {fr.platform.nav.superAdmin}
                </span>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login", { replace: true });
                }}
                aria-label={fr.platform.logout}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </nav>
        {study ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-[calc(58px+env(safe-area-inset-bottom,0px))] lg:pb-0">
            <Outlet />
          </div>
        ) : (
          <main className="min-w-0 flex-1 pb-[calc(58px+env(safe-area-inset-bottom,0px))] lg:pb-0">
            <div
              className={cn(
                "mx-auto w-full space-y-4 px-4 py-4 sm:px-8 md:space-y-6 md:py-6",
                !wide && "max-w-7xl",
              )}
            >
              <Outlet />
            </div>
          </main>
        )}
      </div>
      <PlatformTabBar pending={pendingListings} />
    </div>
  );
}
