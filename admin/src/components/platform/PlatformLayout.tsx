import { LogOut } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { Logo } from "../Logo";
import { ViewAsBanner } from "./ViewAsBanner";
import { ViewSwitch } from "./ViewSwitch";

const TABS = [
  { to: "/plateforme/loueurs", label: fr.platform.tabs.operators },
  { to: "/plateforme/annonces", label: fr.platform.tabs.listings },
  { to: "/plateforme/reservations", label: fr.platform.tabs.reservations },
  { to: "/plateforme/paiements", label: fr.platform.tabs.payments },
  { to: "/plateforme/notifications", label: fr.platform.tabs.notifications },
  { to: "/plateforme/capacite", label: fr.platform.tabs.capacity },
];

/**
 * The super admin's "Plateforme" space (design S-1, direction B): its own top bar with the view
 * switch, then the tabs. A capacity study uses the whole height below the bar (map).
 */
export function PlatformLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const study = /^\/plateforme\/capacite\/[^/]+/.test(pathname);

  return (
    <div className={cn("flex flex-col", study ? "h-screen min-h-[600px] overflow-hidden" : "min-h-screen")}>
      <ViewAsBanner />
      <header className="shrink-0 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Logo height={28} suffix={`Pro · ${fr.platform.brand}`} className="min-w-0 shrink" />
          <ViewSwitch current="platform" className="ml-auto" />
          <button
            onClick={async () => {
              await logout();
              navigate("/login", { replace: true });
            }}
            aria-label={fr.platform.logout}
            className="flex h-11 w-11 shrink-0 items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label={fr.platform.brand} className="border-t border-border">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 sm:px-6">
            {TABS.map(tab => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  cn(
                    "flex min-h-11 shrink-0 items-center px-3.5 text-lg",
                    isActive ? "bg-primary font-bold text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>
      {study ? (
        <Outlet />
      ) : (
        <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      )}
    </div>
  );
}
