import { LogOut } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";
import { can, type Permission } from "@/lib/roles";
import { cn } from "@/lib/utils";

const NAV: { label: string; to: string; permission?: Permission }[] = [
  { label: fr.nav.planning, to: "/", permission: "reservations:view" },
  { label: fr.nav.reservations, to: "/reservations", permission: "reservations:view" },
  { label: fr.nav.parking, to: "/parking", permission: "parking:manage" },
  { label: fr.nav.team, to: "/equipe", permission: "team:manage" },
  { label: fr.nav.account, to: "/mon-compte" },
];

/** Direction B: a black top bar with the sections in capitals; the current one in yellow. */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV.filter(i => !i.permission || can(user?.role, i.permission));

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 pt-3 sm:px-6">
          <span className="text-xl font-bold uppercase tracking-wider text-primary">{PRODUCT.name}</span>
          <span className="hidden truncate text-sm uppercase tracking-wide text-muted-foreground sm:block">{user?.operatorName}</span>
          <span className="ml-auto hidden truncate text-sm text-muted-foreground md:block">
            {user?.name} · {user ? fr.roles[user.role] : ""}
          </span>
          <button
            onClick={handleLogout}
            aria-label={fr.nav.logout}
            className="ml-auto flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground md:ml-0"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <nav aria-label="Navigation principale" className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 pt-2 sm:px-6">
          {items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 shrink-0 items-center px-3.5 text-base font-semibold uppercase tracking-wide",
                  isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
