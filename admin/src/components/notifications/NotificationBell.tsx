import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import { BELL_KEY, BellList } from "./BellList";

const t = fr.bell;

/** 02/11/2026: the bell of the top bar, its count read every 30 s, its list in a panel. */
export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const count = useQuery({ queryKey: [...BELL_KEY, "count"], queryFn: adminApi.bellCount, refetchInterval: 30_000 });
  const unread = count.data?.unread ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={t.open(unread)}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        data-testid="bell"
        className="relative flex size-10 items-center justify-center rounded-full bg-lime/20 text-lime-deep hover:bg-lime/30"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unread > 0 && (
          <span
            data-testid="bell-count"
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-bad px-1 text-[11px] font-bold text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={t.title}
          className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-[14px] border border-panel-line bg-white shadow-xl"
        >
          <BellList onNavigate={() => setOpen(false)} />
          <div className="flex justify-between border-t border-panel-line px-4 py-3 text-[13px] font-semibold text-lime-deep">
            <Link to="/notifications" onClick={() => setOpen(false)} className="hover:underline">
              {t.seeAll}
            </Link>
            <Link to="/mon-compte#notifications" onClick={() => setOpen(false)} className="hover:underline">
              {t.settings}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
