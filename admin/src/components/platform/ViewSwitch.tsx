import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";

/**
 * "Vue : Toute la plateforme ▾" — the super admin goes from the platform space to their own
 * operator space and back. Shown to platform admins only.
 */
export function ViewSwitch({ current, className }: { current: "platform" | "own"; className?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const t = fr.platform;
  const own = t.viewOwn(user?.operatorName ?? "");
  const options = [
    { key: "platform", label: t.viewAll, to: "/plateforme" },
    { key: "own", label: own, to: "/" },
  ] as const;

  return (
    <div
      className={cn("relative", className)}
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.viewMenu}
        onClick={() => setOpen(!open)}
        className="flex min-h-11 items-center gap-1.5 border border-border px-3 text-base text-muted-foreground hover:bg-accent"
      >
        {t.view} <b className="max-w-[16rem] truncate font-bold text-lime-deep">{current === "platform" ? t.viewAll : own}</b>
        <ChevronDown className="h-4 w-4 text-lime-deep" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-full border border-border bg-background">
          {options.map(o => (
            <button
              key={o.key}
              type="button"
              role="menuitemradio"
              aria-checked={current === o.key}
              onClick={() => {
                setOpen(false);
                navigate(o.to);
              }}
              className={cn(
                "flex min-h-11 w-full items-center whitespace-nowrap px-3 text-left text-base hover:bg-accent",
                current === o.key ? "font-bold text-lime-deep" : "text-foreground",
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
