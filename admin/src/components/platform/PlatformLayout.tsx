import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { Logo } from "../Logo";
import { ViewAsBanner } from "./ViewAsBanner";
import { ParkingSwitcher } from "./ParkingSwitcher";

type Item = { to: string; label: string; end?: boolean; badge?: "listings" };

const GROUPS: { label: string; items: Item[] }[] = [
  {
    label: fr.platform.nav.groups.steer,
    items: [
      { to: "/plateforme", label: fr.platform.nav.overview, end: true },
      { to: "/plateforme/loueurs", label: fr.platform.tabs.operators },
      {
        to: "/plateforme/annonces",
        label: fr.platform.tabs.listings,
        badge: "listings",
      },
      { to: "/plateforme/reservations", label: fr.platform.tabs.reservations },
      { to: "/plateforme/paiements", label: fr.platform.tabs.payments },
    ],
  },
  {
    label: fr.platform.nav.groups.grow,
    items: [
      { to: "/plateforme/prospection", label: fr.platform.tabs.prospecting },
      { to: "/plateforme/referencement", label: fr.platform.tabs.seo },
      {
        to: "/plateforme/notifications",
        label: fr.platform.tabs.notifications,
      },
    ],
  },
  {
    label: fr.platform.nav.groups.tools,
    items: [{ to: "/plateforme/capacite", label: fr.platform.tabs.capacity }],
  },
];

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
          <div className="flex gap-1 overflow-x-auto px-3 pb-2 lg:flex-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-3.5 lg:pb-4">
            {GROUPS.map((group) => (
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
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
        ) : (
          <main className="min-w-0 flex-1">
            <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8">
              <Outlet />
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
