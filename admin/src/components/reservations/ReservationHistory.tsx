import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Plane, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { adminApi } from "@/lib/api";
import { longDate, PARKING_TZ, timeOf, todayLocal, addDays } from "@/lib/datetime";
import { fr, historyFr as t } from "@/lib/fr";
import type { HistoryEvent, ReservationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "status" | "change" | "message";
const FILTERS: Filter[] = ["all", "status", "change", "message"];
/** Shown before « Voir les N plus anciennes ». */
const FIRST = 15;

const localDay = (iso: string, timeZone = PARKING_TZ) =>
  new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(new Date(iso));

function dayTitle(day: string): string {
  const today = todayLocal();
  if (day === today) return t.today;
  if (day === addDays(today, -1)) return t.yesterday;
  return longDate(day);
}

const statusLabel = (s: unknown) => (typeof s === "string" ? (fr.status[s as ReservationStatus] ?? s) : "");

/** Who did it, as the line names them. */
function authorName(e: HistoryEvent): string {
  if (e.author.kind === "system") return e.author.viewAs ? t.author.viewAs : t.author.system;
  if (e.author.kind === "traveller") return e.author.name || t.author.traveller;
  return e.author.name ?? t.author.system;
}

/** The sentence after the author: « a changé l'état », with what the action says beyond the changed fields. */
function sentence(e: HistoryEvent): string {
  const base = t.actions[e.action] ?? t.other;
  const { info } = e;
  if (e.action === "reservation.keys") {
    if (typeof info.keyHook === "string" && info.keyHook) return `${base} · ${t.hook(info.keyHook)}`;
    return `${base} · ${info.left === false ? t.keysBack : t.keysLeft}`;
  }
  if (e.action.startsWith("inspection.") && typeof info.kind === "string" && t.inspectionKind[info.kind])
    return `${base} ${t.inspectionKind[info.kind]}`;
  return base;
}

function AuthorMark({ e }: { e: HistoryEvent }) {
  if (e.author.kind === "staff" && e.author.staffId)
    return (
      <Avatar
        staff={{ id: e.author.staffId, name: e.author.name ?? "?", photoUpdatedAt: e.author.photoUpdatedAt }}
        size={28}
      />
    );
  const Icon = e.author.kind === "traveller" ? UserRound : e.author.kind === "comparator" ? Plane : Building2;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
        e.author.kind === "system" ? "bg-primary text-primary-foreground" : "bg-panel-2 text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

function EventRow({ e }: { e: HistoryEvent }) {
  const isStatus = e.action === "reservation.status_changed" && e.info.to;
  return (
    <li data-testid="history-event" data-action={e.action} className="flex gap-3 py-2.5">
      <AuthorMark e={e} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{authorName(e)}</span>
          {e.author.kind === "traveller" && <span className="text-muted-foreground"> · {t.roleTraveller}</span>}
          {e.author.kind === "comparator" && <span className="text-muted-foreground"> · {t.roleComparator}</span>}{" "}
          {sentence(e)}
          <span className="tabular ml-2 font-mono text-xs text-muted-foreground">{timeOf(e.at)}</span>
        </p>
        {isStatus && (
          <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px]" data-testid="history-status">
            {e.info.from && <span className="rounded-full bg-panel-2 px-2 py-0.5">{statusLabel(e.info.from)}</span>}
            {e.info.from && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="devient" />}
            <span className="rounded-full bg-ok-soft px-2 py-0.5 font-semibold text-ok-text">{statusLabel(e.info.to)}</span>
          </p>
        )}
        {e.changes.length > 0 && (
          <ul className="mt-1 flex flex-col gap-0.5 text-[13px]" data-testid="history-changes">
            {e.changes.map((c) => (
              <li key={c.field} className="flex flex-wrap items-baseline gap-x-1.5">
                <span className="text-muted-foreground">{t.fields[c.field] ?? c.field} :</span>
                <span className="text-muted-foreground line-through decoration-1">{c.from}</span>
                <ArrowRight className="h-3 w-3 self-center text-muted-foreground" aria-label="devient" />
                <span className="font-semibold">{c.to}</span>
              </li>
            ))}
          </ul>
        )}
        {typeof e.info.note === "string" && e.info.note && (
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t.note} : « {e.info.note} »
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * « Historique » of a booking (30/10/2026, « avoir un historique des actions et de l'auteur sur les réservations »,
 * direction A): every action on it, newest first and grouped by day, with who did it (a member with their photo, the
 * traveller, a comparator, Plazo) and before → after for each changed field. Filters Tout · États · Modifications ·
 * Messages. Shown to the whole team.
 */
export function ReservationHistory({ reservationId }: { reservationId: string }) {
  const query = useQuery({
    queryKey: ["reservation-history", reservationId],
    queryFn: () => adminApi.getReservationHistory(reservationId),
  });
  const [filter, setFilter] = useState<Filter>("all");
  const [all, setAll] = useState(false);
  const events = useMemo(() => query.data?.data ?? [], [query.data]);
  const shown = useMemo(
    () => (filter === "all" ? events : events.filter((e) => e.group === filter)),
    [events, filter],
  );
  if (events.length === 0) return null;
  const visible = all ? shown : shown.slice(0, FIRST);
  const days: { day: string; events: HistoryEvent[] }[] = [];
  for (const e of visible) {
    const day = localDay(e.at);
    const last = days[days.length - 1];
    if (last?.day === day) last.events.push(e);
    else days.push({ day, events: [e] });
  }
  return (
    <section
      data-testid="reservation-history"
      aria-labelledby="reservation-history-title"
      className="rounded-xl border border-panel-line bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="reservation-history-title" className="text-base font-semibold">
          {t.title} <span className="font-normal text-muted-foreground">· {t.count(events.length)}</span>
        </h2>
        <div role="group" aria-label={t.title} className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              data-testid={`history-filter-${f}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "min-h-8 rounded-full px-3 text-[13px] font-medium",
                filter === f ? "bg-primary text-primary-foreground" : "border border-panel-line hover:bg-panel-2",
              )}
            >
              {t.filters[f]}
            </button>
          ))}
        </div>
      </div>
      {days.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        days.map(({ day, events: list }) => (
          <div key={day} className="mt-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{dayTitle(day)}</h3>
            <ul className="divide-y divide-panel-line">
              {list.map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
            </ul>
          </div>
        ))
      )}
      {!all && shown.length > FIRST && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-2 text-sm font-semibold text-lime-deep underline-offset-4 hover:underline"
        >
          {t.more(shown.length - FIRST)}
        </button>
      )}
    </section>
  );
}
