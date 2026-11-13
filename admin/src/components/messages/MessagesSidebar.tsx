import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, MessageCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { whatsappInboxFr as t } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { WhatsappConversation } from "@/lib/types";
import {
  COLLAPSED_KEY,
  MAX_OPEN,
  MAX_TABS,
  fold,
  initialsOf,
  nameOf,
  readCollapsed,
  sortForBar,
  wroteRecently,
} from "@/lib/messages-bar";
import { cn } from "@/lib/utils";
import { Thread } from "@/pages/WhatsappInboxPage";

const TINTS = ["bg-[#DCFCE7] text-[#15803D]", "bg-[#E0E7FF] text-[#4F46E5]", "bg-[#FEF3C7] text-[#B45309]"];
const tintOf = (id: string) => TINTS[[...id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % TINTS.length];

function Head({ c, size = 30 }: { c: WhatsappConversation; size?: number }) {
  return (
    <span
      className={cn("relative grid shrink-0 place-items-center rounded-full text-[11px] font-bold", tintOf(c.id))}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {initialsOf(nameOf(c))}
      {wroteRecently(c) && (
        <i className="absolute -bottom-px -right-px h-2.5 w-2.5 rounded-full border-2 border-white bg-[#25D366]" />
      )}
    </span>
  );
}

/**
 * Barre des messages (13/11/2026, choix A, « sur le web mets un bar latéral de message comme Facebook », maquettes
 * https://claude.ai/artifact/LiooeN3fnHrkGLSfHPCMpo): on a wide screen, the conversations to deal with on the right of every
 * page (unread first, a green dot when the client wrote within 24 hours); a click opens a small window at the bottom, two at
 * most, the others reduced to tabs. Folds into a column of heads. Not on the Messages page itself, not on a phone.
 */
export function MessagesSidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const allowed = can(user?.role, "reservations:status");
  const onInbox = pathname.startsWith("/reservations/whatsapp");
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [search, setSearch] = useState("");
  // Open windows, the latest first, then the reduced tabs.
  const [open, setOpen] = useState<string[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);

  const list = useQuery({
    queryKey: ["whatsapp-inbox", "all"],
    queryFn: () => adminApi.whatsappInbox("all"),
    enabled: allowed && !onInbox,
    refetchInterval: 15_000,
  });
  const rows = useMemo(() => sortForBar(list.data?.data ?? []), [list.data]);
  const byId = useMemo(() => new Map(rows.map((c) => [c.id, c])), [rows]);
  const shown = useMemo(() => {
    const q = fold(search.trim());
    if (!q) return rows;
    return rows.filter((c) =>
      fold([nameOf(c), c.phone, c.reservation?.reference ?? "", c.reservation?.externalReference ?? ""].join(" ")).includes(q),
    );
  }, [rows, search]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? "1" : "0");
    } catch {
      /* private window */
    }
  }, [collapsed]);

  if (!allowed || onInbox) return null;

  const openWindow = (id: string) => {
    setTabs((ts) => {
      const without = ts.filter((x) => x !== id);
      const kept = open.filter((x) => x !== id);
      const pushed = kept.slice(MAX_OPEN - 1);
      return [...pushed, ...without].slice(0, MAX_TABS);
    });
    setOpen((os) => [id, ...os.filter((x) => x !== id)].slice(0, MAX_OPEN));
  };
  const minimize = (id: string) => {
    setOpen((os) => os.filter((x) => x !== id));
    setTabs((ts) => [id, ...ts.filter((x) => x !== id)].slice(0, MAX_TABS));
  };
  const close = (id: string) => {
    setOpen((os) => os.filter((x) => x !== id));
    setTabs((ts) => ts.filter((x) => x !== id));
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["whatsapp-inbox"] });
    queryClient.invalidateQueries({ queryKey: ["nav-counts"] });
  };
  const unread = list.data?.counts.unread ?? 0;
  const barWidth = collapsed ? 58 : 240;

  return (
    <>
      <aside
        aria-label={t.bar.label}
        data-testid="messages-bar"
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-l border-panel-line bg-panel-shell xl:flex"
        style={{ width: barWidth }}
      >
        <div className={cn("flex items-center gap-2 pb-2 pt-3", collapsed ? "flex-col px-1" : "px-3")}>
          {collapsed ? (
            <MessageCircle className="h-4 w-4 text-lime-deep" aria-hidden="true" />
          ) : (
            <Link to="/reservations/whatsapp" className="flex items-center gap-2 text-sm font-bold">
              {t.bar.title}
              {unread > 0 && (
                <span className="rounded-full bg-[#B45309] px-1.5 font-mono text-[10px] leading-4 text-white">{unread}</span>
              )}
            </Link>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? t.bar.expand : t.bar.collapse}
            title={collapsed ? t.bar.expand : t.bar.collapse}
            data-testid="messages-bar-toggle"
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent",
              !collapsed && "ml-auto",
            )}
          >
            {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
        {!collapsed && (
          <label className="mx-3 mb-2 flex items-center gap-1.5 rounded-full border border-panel-line bg-white px-2.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.bar.search}
              aria-label={t.bar.search}
              className="min-w-0 flex-1 bg-transparent py-1.5 text-xs outline-none"
            />
          </label>
        )}
        <div className={cn("min-h-0 flex-1 overflow-y-auto", collapsed && "flex flex-col items-center gap-2.5 pt-1")}>
          {list.data && shown.length === 0 && !collapsed && (
            <p className="px-3 py-2 text-xs text-muted-foreground">{search ? t.bar.noMatch : t.bar.empty}</p>
          )}
          {shown.map((c) =>
            collapsed ? (
              <button
                key={c.id}
                type="button"
                onClick={() => openWindow(c.id)}
                title={nameOf(c)}
                aria-label={t.dock.open(nameOf(c))}
                data-testid={`bar-conv-${c.id}`}
                className="relative rounded-full"
              >
                <Head c={c} size={36} />
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full border-2 border-white bg-[#B45309] px-1 font-mono text-[9px] font-bold leading-3 text-white">
                    {c.unread}
                  </span>
                )}
              </button>
            ) : (
              <button
                key={c.id}
                type="button"
                onClick={() => openWindow(c.id)}
                aria-label={t.dock.open(nameOf(c))}
                data-testid={`bar-conv-${c.id}`}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-panel-2",
                  open.includes(c.id) && "bg-lime/15",
                )}
              >
                <Head c={c} />
                <span className="min-w-0 flex-1">
                  <b className={cn("block truncate text-xs", c.unread > 0 ? "font-bold text-foreground" : "font-semibold")}>
                    {nameOf(c)}
                  </b>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {c.preview ? `${c.preview.direction === "out" ? `${t.you} : ` : ""}${c.preview.text}` : c.phone}
                  </span>
                </span>
                {c.unread > 0 && (
                  <span className="rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold leading-4 text-primary-foreground">
                    {c.unread}
                  </span>
                )}
              </button>
            ),
          )}
        </div>
        {!collapsed && (
          <Link
            to="/reservations/whatsapp"
            className="border-t border-panel-line px-3 py-2 text-xs font-semibold text-lime-deep"
          >
            {t.bar.seeAll}
          </Link>
        )}
      </aside>
      {(open.length > 0 || tabs.length > 0) && (
        <div
          className="pointer-events-none fixed bottom-0 z-30 hidden items-end gap-2 xl:flex"
          style={{ right: barWidth + 12 }}
          data-testid="messages-dock"
        >
          {tabs
            .filter((id) => !open.includes(id))
            .map((id) => {
              const c = byId.get(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => openWindow(id)}
                  data-testid={`dock-tab-${id}`}
                  className="pointer-events-auto flex w-44 items-center gap-2 rounded-t-xl border border-b-0 border-panel-line bg-white px-2.5 py-2 text-left text-xs shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
                >
                  {c && <Head c={c} size={22} />}
                  <b className="min-w-0 flex-1 truncate">{c ? nameOf(c) : t.bar.title}</b>
                  {c && c.unread > 0 && (
                    <span className="rounded-full bg-primary px-1.5 font-mono text-[10px] font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </button>
              );
            })}
          {[...open].reverse().map((id) => (
            <div
              key={id}
              data-testid={`dock-window-${id}`}
              className="pointer-events-auto flex h-[440px] w-[320px] flex-col overflow-hidden rounded-t-xl border border-b-0 border-panel-line bg-white shadow-[0_-6px_18px_rgba(0,0,0,0.12)]"
            >
              <Thread
                id={id}
                onBack={() => close(id)}
                onChanged={refresh}
                docked={{ onMinimize: () => minimize(id), onClose: () => close(id) }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
