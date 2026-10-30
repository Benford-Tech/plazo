import { Camera, ChevronDown, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

/**
 * Direction A (30/10/2026): the account at the bottom of the rail (photo, name, role; on a phone, the photo alone at the
 * top). A click opens Mon compte, « Changer ma photo », the platform for its admin, and sign out.
 */
export function AccountMenu({
  platformAdmin,
  onLogout,
  compact = false,
}: {
  platformAdmin: boolean;
  onLogout: () => void;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.hash]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!user) return null;
  const entry =
    "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm hover:bg-panel-2";
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        data-testid="account-menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={compact ? fr.nav.accountMenu : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2.5 rounded-xl text-left hover:bg-panel-2",
          compact ? "h-11 w-11 justify-center" : "w-full border border-panel-line bg-panel p-2",
        )}
      >
        <Avatar staff={user} size={compact ? 32 : 36} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold leading-tight">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{fr.roles[user.role]}</span>
            </span>
            <ChevronDown
              className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "" : "rotate-180")}
              aria-hidden="true"
            />
          </>
        )}
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            "absolute z-40 w-56 rounded-xl border border-panel-line bg-panel p-1.5 shadow-lg",
            compact ? "right-0 top-12" : "bottom-full left-0 mb-2",
          )}
        >
          <Link role="menuitem" to="/mon-compte" className={entry}>
            <UserRound className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {fr.nav.account}
          </Link>
          <Link role="menuitem" to="/mon-compte#photo" className={entry}>
            <Camera className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {fr.nav.changePhoto}
          </Link>
          {platformAdmin && (
            <Link role="menuitem" to="/plateforme" className={entry}>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {fr.nav.platform}
            </Link>
          )}
          <div className="my-1 border-t border-panel-line" />
          <button role="menuitem" type="button" onClick={onLogout} className={entry}>
            <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {fr.nav.logout}
          </button>
        </div>
      )}
    </div>
  );
}
