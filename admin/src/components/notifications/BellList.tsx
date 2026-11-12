import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AtSign, Bell, MessageCircle, CalendarPlus, KeyRound, PlaneLanding, RefreshCcw, Sparkles, UserPlus, Users, Bus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import type { BellFilter, BellNotification, NotificationEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.bell;

const ICONS: Record<NotificationEvent, { icon: typeof Bell; tone: string }> = {
  booking_new: { icon: CalendarPlus, tone: "bg-ok-soft text-ok" },
  booking_change: { icon: RefreshCcw, tone: "bg-warn-soft text-warn" },
  inbox: { icon: AtSign, tone: "bg-warn-soft text-warn" },
  whatsapp: { icon: MessageCircle, tone: "bg-ok-soft text-ok-text" },
  extra: { icon: Sparkles, tone: "bg-lime/20 text-lime-deep" },
  arrival: { icon: UserPlus, tone: "bg-ok-soft text-ok" },
  return: { icon: PlaneLanding, tone: "bg-info-soft text-info" },
  shuttle: { icon: Bus, tone: "bg-panel-2 text-muted-foreground" },
  valet: { icon: KeyRound, tone: "bg-info-soft text-info" },
  team: { icon: Users, tone: "bg-lime/20 text-lime-deep" },
  platform: { icon: Bell, tone: "bg-panel-2 text-muted-foreground" },
};

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function dayLabel(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const key = (x: Date) => `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key(d) === key(now)) return t.today;
  if (key(d) === key(yesterday)) return t.yesterday;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export const BELL_KEY = ["bell"] as const;

/** The list of the bell (popover and page): filters, days, read / unread, a click opens the target. */
export function BellList({ onNavigate, pageSize = "popover" }: { onNavigate?: () => void; pageSize?: "popover" | "page" }) {
  const [filter, setFilter] = useState<BellFilter>("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: [...BELL_KEY, "list", filter],
    queryFn: ({ pageParam }) => adminApi.bell(filter, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.data[last.data.length - 1]?.createdAt : undefined),
  });
  const read = useMutation({
    mutationFn: (ids?: string[]) => adminApi.markBellRead(ids),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BELL_KEY }),
  });
  const items = query.data?.pages.flatMap((p) => p.data) ?? [];
  const unread = query.data?.pages[0]?.unread ?? 0;
  const shown = pageSize === "popover" ? items.slice(0, 8) : items;

  const open = (n: BellNotification) => {
    if (!n.readAt) read.mutate([n.id]);
    if (n.target) {
      navigate(n.target);
      onNavigate?.();
    }
  };

  let lastDay = "";
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 border-b border-panel-line px-4 py-3">
        <h2 className="text-base font-semibold">{t.title}</h2>
        {unread > 0 && <span className="rounded-full bg-bad-soft px-2 py-0.5 text-xs font-bold text-bad">{t.unread(unread)}</span>}
        <button
          type="button"
          onClick={() => read.mutate(undefined)}
          disabled={unread === 0}
          className="ml-auto text-[13px] font-semibold text-lime-deep hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {t.markAll}
        </button>
      </div>
      <div role="group" aria-label="Filtrer" className="flex flex-wrap gap-1.5 px-4 py-2.5">
        {(Object.keys(t.filters) as BellFilter[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-[13px]",
              filter === f ? "bg-lime-deep font-semibold text-white" : "border border-panel-line hover:bg-panel-2",
            )}
          >
            {t.filters[f]}
          </button>
        ))}
      </div>
      {query.isError && <p className="px-4 py-3 text-sm text-bad">{t.failed}</p>}
      {!query.isLoading && shown.length === 0 && !query.isError && <p className="px-4 py-6 text-sm text-muted-foreground">{t.empty}</p>}
      <ul data-testid="bell-list">
        {shown.map((n) => {
          const day = dayLabel(n.createdAt);
          const header = day !== lastDay ? day : null;
          lastDay = day;
          const { icon: Icon, tone } = ICONS[n.event] ?? ICONS.platform;
          return (
            <li key={n.id}>
              {header && <p className="px-4 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{header}</p>}
              <button
                type="button"
                onClick={() => open(n)}
                data-testid={`bell-item-${n.id}`}
                data-unread={n.readAt ? undefined : "true"}
                className={cn(
                  "flex w-full gap-3 border-l-[3px] px-4 py-3 text-left hover:bg-panel-2",
                  n.readAt ? "border-transparent" : "border-lime bg-lime/10",
                )}
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", tone)}>
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", n.readAt ? "" : "font-semibold")}>{n.title}</span>
                  <span className="block text-[13px] text-muted-foreground">{n.body}</span>
                </span>
                <span className="tabular shrink-0 font-mono text-xs text-muted-foreground">{time(n.createdAt)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {pageSize === "page" && query.hasNextPage && (
        <button type="button" onClick={() => query.fetchNextPage()} className="mx-4 my-3 min-h-11 rounded-full border border-panel-line text-sm font-semibold">
          {t.more}
        </button>
      )}
    </div>
  );
}
