import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { PRODUCT } from "@/lib/product";

/** The platform owner's internal tool: its own top bar ("PLAZO · OUTIL INTERNE"), full height. */
export function InternalToolLayout() {
  const { user } = useAuth();
  return (
    <div className="flex h-screen min-h-[600px] flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-[18px] border-b border-border px-6 py-2.5">
        <Link to="/" className="text-xl font-bold uppercase tracking-[1px] text-primary" title={fr.capacity.backToPro}>
          {PRODUCT.name}
        </Link>
        <span className="border border-border px-2 py-0.5 text-[13px] uppercase tracking-[1px] text-muted-foreground">{fr.capacity.brandTag}</span>
        <nav aria-label={fr.capacity.brandTag} className="ml-3 flex gap-1">
          <NavLink
            to="/outil/capacite"
            className="flex min-h-11 items-center bg-primary px-3.5 text-base font-bold uppercase text-primary-foreground"
          >
            {fr.capacity.tab}
          </NavLink>
        </nav>
        <Link to="/" className="ml-auto text-sm text-muted-foreground hover:text-foreground">
          ← {fr.capacity.backToPro}
        </Link>
        <span className="text-sm text-muted-foreground">{user?.name}</span>
      </header>
      <Outlet />
    </div>
  );
}
