import { useQuery } from "@tanstack/react-query";
import { Bell, BusFront, ChevronDown, ChevronLeft, ChevronRight, MessageSquareWarning, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MovementPill } from "@/components/MovementPill";
import { Plate } from "@/components/Plate";
import { PlanningTabs } from "@/components/planning/PlanningTabs";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { bannerText, eventKey, liveFirst, miniMapPoints, positionAge, withLiveSignals, withShuttleTrips } from "@/lib/arrivals";
import { addDays, longDate, shortDay, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { ArrivalSignal, NightLoad, PlanningRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MOVEMENT_CARD, MOVEMENT_DOT, MOVEMENT_TEXT } from "@/lib/movement";
import { ValetPill } from "@/lib/valet-icon";
import { lateOf, nextOf, splitAtNow, untilLabel } from "@/lib/planning-now";

function NightCell({ night }: { night: NightLoad }) {
  const t = fr.planning;
  const almostFull = !night.overbooked && night.free <= Math.ceil(night.bookable * 0.05);
  return (
    <div
      className={cn(
        "flex min-w-[124px] shrink-0 flex-col gap-0.5 whitespace-nowrap px-3.5 py-3",
        night.overbooked ? "bg-primary text-primary-foreground" : "bg-card",
        almostFull && "shadow-[inset_0_-4px_0_hsl(var(--primary))]",
      )}
    >
      <span className="text-[15px] font-semibold uppercase">{shortDay(night.date)}</span>
      <span className="tabular font-mono text-2xl font-bold">
        {night.count}
        <span className="text-[15px] font-medium"> / {night.bookable}</span>
      </span>
      <span className="text-sm font-semibold">
        {night.overbooked ? t.overbookedBy(night.count - night.bookable).toUpperCase() : almostFull ? t.almostFull : t.free(night.free)}
      </span>
    </div>
  );
}

/** Polling of the live arrivals: Vercel has no websockets. */
const LIVE_POLL_MS = 12_000;

/** Traveller and meeting point on a dark box, joined by a dashed line (like the approved mockup). */
function MiniMap({ s }: { s: ArrivalSignal }) {
  if (!s.position || !s.meetingPoint) return null;
  const box = { width: 320, height: 110, padding: 22 };
  const { me, meeting } = miniMapPoints(s.position, s.meetingPoint, box);
  return (
    <svg
      role="img"
      aria-label={fr.planning.miniMap(s.customerName)}
      viewBox={`0 0 ${box.width} ${box.height}`}
      className="h-[110px] w-full border border-border bg-muted"
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1={me.x} y1={me.y} x2={meeting.x} y2={meeting.y} stroke="hsl(var(--primary))" strokeWidth="2" strokeDasharray="6 5" />
      <circle cx={me.x} cy={me.y} r="6" fill="hsl(var(--primary))" />
      <text x={meeting.x} y={meeting.y + 5} textAnchor="middle" className="fill-primary font-mono text-[14px] font-bold">
        {fr.planning.meetingPointMark}
      </text>
    </svg>
  );
}

/** "Karim Benali" -> "Karim": the badge stays short. */
const shortDriver = (name: string) => name.trim().split(/\s+/)[0] ?? name;

/** What the traveller told the parking, on the right of the row. */
function SignalLabel({ s }: { s: ArrivalSignal }) {
  const t = fr.planning;
  if (s.state === "announced") {
    return <span className="whitespace-nowrap text-sm text-muted-foreground">{t.announced(s.announcedMinutes ?? s.etaMinutes ?? 0)}</span>;
  }
  const text = s.state === "sharing" ? t.approaching(s.etaMinutes) : s.kind === "return" ? t.atMeetingPoint : t.atReception;
  return <span className="whitespace-nowrap text-xs font-bold uppercase text-lime-deep sm:text-sm">● {text}</span>;
}

function Row({
  r,
  kind,
  clock,
  dimmed = false,
}: {
  r: PlanningRow;
  kind: "arrival" | "return";
  clock: { fetchedAt: number; now: number };
  dimmed?: boolean;
}) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
  const onSite = r.status !== "upcoming";
  const s = r.arrivalSignal ?? null;
  const live = s?.state === "sharing";
  const age = s && live ? positionAge(s, clock.fetchedAt, clock.now) : null;
  const card = useQuickCard();
  return (
    <li
      id={`row-${r.id}`}
      className={cn("overflow-hidden rounded-lg", MOVEMENT_CARD[isArrival ? "arrival" : "departure"], live && "ring-2 ring-lime-deep", dimmed && "opacity-50")}
    >
      {/* C-A (06/10/2026): a row opens the operational card; the full page is one link further. */}
      <button
        type="button"
        data-testid={`planning-row-${r.id}`}
        onClick={() => card.open(r.id)}
        className={cn(
          // 28/10/2026: the card of its kind (green arrival, indigo departure), as in Plazo Pro's list of the day.
          "grid min-h-16 w-full grid-cols-[64px_1fr_auto] items-center gap-3 px-2.5 py-2 text-left hover:brightness-[.97] sm:grid-cols-[72px_1fr_auto] sm:gap-3.5",
        )}
      >
        <span className="flex flex-col items-start gap-1">
          <span className="tabular font-mono text-xl font-bold text-lime-deep">{timeOf(isArrival ? r.arrivalAt : r.returnAt)}</span>
          <MovementPill kind={isArrival ? "arrival" : "departure"} />
        </span>
        {/* On a phone the plate sits above the name; side by side from sm up. */}
        <span className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3.5">
          <Plate value={r.plate} />
          <span className="min-w-0 max-w-full">
            <span className="block truncate text-lg font-semibold">{r.customerName}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {t.pax(r.passengers)} · {isArrival ? (r.channelDetail ?? fr.channels[r.channel]) : fr.status[r.status]}
            </span>
            {r.handover === "valet" && <ValetPill label={fr.reservation.handovers.valet} className="mt-0.5" />}
          </span>
        </span>
        {!isArrival && r.shuttleTrip ? (
          <span className="flex items-center gap-1.5 whitespace-nowrap bg-primary px-2 py-1 text-xs font-bold uppercase text-primary-foreground sm:text-sm">
            <BusFront className="h-4 w-4" aria-hidden="true" />
            {t.shuttleOnTheWay(shortDriver(r.shuttleTrip.driverName))}
          </span>
        ) : s ? (
          <SignalLabel s={s} />
        ) : isArrival ? (
          <span
            className={cn(
              "whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-xs font-bold uppercase sm:text-sm",
              onSite ? "border border-ok text-ok-text" : "border border-border text-muted-foreground",
            )}
          >
            {fr.status[r.status]}
          </span>
        ) : r.returnFlight ? (
          <span className="tabular whitespace-nowrap rounded-full border border-info bg-white px-2.5 py-1 font-mono text-sm font-bold text-info-text sm:text-[15px]">{r.returnFlight}</span>
        ) : (
          <span />
        )}
      </button>
      {live && s && (
        <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
          <MiniMap s={s} />
          <span className="text-xs text-muted-foreground">
            {[age !== null ? t.positionUpdated(age) : null, s.distanceM !== null ? t.distance(s.distanceM) : null, s.etaAt ? t.etaAround(timeOf(s.etaAt)) : null]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}
    </li>
  );
}

function Column({
  title,
  count,
  items,
  kind,
  empty,
  clock,
  today = false,
}: {
  title: string;
  count: string;
  items: PlanningRow[];
  kind: "arrival" | "return";
  empty: string;
  clock: { fetchedAt: number; now: number };
  /** Direction A (30/10/2026): today, what is done is folded under « Déjà passés ». */
  today?: boolean;
}) {
  const t = fr.planning;
  const movement = kind === "arrival" ? "arrival" : "departure";
  const live = today && items.length > 0 ? splitAtNow(items, kind) : null;
  const [showPast, setShowPast] = useState(false);
  return (
    <section className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between px-1 pb-2">
        <h2 className={cn("flex items-center gap-2 text-2xl font-bold uppercase tracking-wider", MOVEMENT_TEXT[movement])}>
          <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", MOVEMENT_DOT[movement])} />
          {title}
        </h2>
        <span className="tabular font-mono text-muted-foreground">{count}</span>
      </div>
      <ul className="flex flex-col gap-2">
        {live && live.past.length > 0 && (
          <li>
            <button
              type="button"
              data-testid={`past-${kind}`}
              aria-expanded={showPast}
              onClick={() => setShowPast(v => !v)}
              className="flex w-full items-center justify-between px-1 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              {t.pastRows(live.past.length)}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showPast && "rotate-180")} aria-hidden="true" />
            </button>
          </li>
        )}
        {(live ? [...(showPast ? live.past : []), ...live.coming] : items).map(r => (
          <Row key={r.id} r={r} kind={kind} clock={clock} dimmed={!!live && live.past.includes(r)} />
        ))}
      </ul>
      {items.length === 0 && <p className="px-1 py-6 text-muted-foreground">{empty}</p>}
    </section>
  );
}

/** « Prochaine arrivée » / « Prochain départ » over its column (direction A of 30/10/2026); moves on once done. */
function NextCard({ items, kind, now }: { items: PlanningRow[]; kind: "arrival" | "return"; now: number }) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
  const card = useQuickCard();
  const row = nextOf(items, kind, now);
  const late = lateOf(items, kind, now);
  const atOf = (r: PlanningRow) => (isArrival ? r.arrivalAt : r.returnAt);
  const shownLate = late.slice(0, 3);
  return (
    <div data-testid={`next-${kind}`} className={cn("flex flex-col gap-2 rounded-lg border-2 bg-card px-4 py-3", isArrival ? "border-ok" : "border-info")}>
      <span className={cn("text-xs font-extrabold uppercase tracking-wider", MOVEMENT_TEXT[isArrival ? "arrival" : "departure"])}>
        {isArrival ? t.nextArrival : t.nextDeparture}
      </span>
      {row ? (
        <button
          type="button"
          data-testid={`next-${kind}-row`}
          onClick={() => card.open(row.id)}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 rounded-md text-left hover:bg-accent/40"
        >
          <span className="tabular font-mono text-3xl font-bold">{timeOf(atOf(row))}</span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold">{row.customerName}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {!isArrival && row.returnFlight ? `${row.returnFlight} · ` : ""}
              {t.pax(row.passengers)}
            </span>
          </span>
          <span className="tabular whitespace-nowrap font-mono text-sm font-bold text-lime-deep">{untilLabel(atOf(row), now).text}</span>
        </button>
      ) : (
        <span className="text-sm text-muted-foreground">{isArrival ? t.noNextArrival : t.noNextDeparture}</span>
      )}
      {late.length > 0 && (
        <div data-testid={`late-${kind}`} className="flex flex-col gap-1 rounded-md bg-warn-soft px-3 py-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-warn-text">{t.lateCount(late.length)}</span>
          {shownLate.map(r => (
            <button
              key={r.id}
              type="button"
              onClick={() => card.open(r.id)}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 text-left text-sm hover:underline"
            >
              <span className="tabular font-mono font-bold">{timeOf(atOf(r))}</span>
              <span className="truncate font-semibold">{r.customerName}</span>
              <span className="tabular whitespace-nowrap font-mono text-xs font-bold text-warn-text">{untilLabel(atOf(r), now).text}</span>
            </button>
          ))}
          {late.length > shownLate.length && <span className="text-xs text-warn-text">{t.lateMore(late.length - shownLate.length)}</span>}
        </div>
      )}
    </div>
  );
}

/** Yellow bar on top of the planning when a traveller signals their arrival. */
function ArrivalBanner({ signal, onClose }: { signal: ArrivalSignal; onClose: () => void }) {
  const t = fr.planning;
  const see = () => {
    document.getElementById(`row-${signal.reservationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    onClose();
  };
  return (
    <div role="status" className="flex items-center justify-between gap-3 bg-primary px-4 py-2.5 font-bold text-primary-foreground">
      <span className="flex min-w-0 items-center gap-2">
        <Bell className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="truncate">{bannerText(signal)}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <button onClick={see} className="px-2 py-1 font-bold hover:underline">
          {t.toastSee}
        </button>
        <button onClick={onClose} aria-label={t.toastClose} className="p-1">
          <X className="h-4 w-4" />
        </button>
      </span>
    </div>
  );
}

/** The operator's phone is not sending the SMS handed to it (gateway channel): a small warning, managers can fix it. */
function SmsWarning({ pending, manager }: { pending: number; manager: boolean }) {
  const t = fr.planning;
  return (
    <p role="status" data-testid="sms-warning" className="flex flex-wrap items-center gap-x-2 gap-y-1 border border-lime-deep px-3 py-2 text-sm">
      <MessageSquareWarning className="h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
      <span className="font-bold uppercase text-lime-deep">{t.smsWarning(pending)}</span>
      <span className="text-muted-foreground">{t.smsWarningHint}</span>
      {manager && (
        <Link to="/mon-compte" className="font-semibold underline-offset-4 hover:underline">
          {fr.sms.title} ›
        </Link>
      )}
    </p>
  );
}

export default function PlanningPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const date = params.get("date") ?? todayLocal();
  const { data, isLoading, error } = useQuery({ queryKey: ["planning", date], queryFn: () => adminApi.getPlanning(date), refetchInterval: 60_000 });
  const t = fr.planning;
  const go = (d: string) => setParams(d === todayLocal() ? {} : { date: d });
  const isToday = date === todayLocal();

  // Live arrivals of travellers, polled while the day shown is today.
  const live = useQuery({ queryKey: ["arrivals-live"], queryFn: adminApi.getLiveArrivals, refetchInterval: LIVE_POLL_MS, enabled: isToday });
  const signals = isToday ? live.data?.signals : undefined;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5000);
    return () => window.clearInterval(timer);
  }, []);
  const clock = { fetchedAt: live.dataUpdatedAt || now, now };

  // The newest event not seen yet goes to the banner.
  const seen = useRef<Set<string>>(new Set());
  const [banner, setBanner] = useState<ArrivalSignal | null>(null);
  useEffect(() => {
    if (!signals) return;
    const fresh = signals.filter(s => !seen.current.has(eventKey(s)));
    fresh.forEach(s => seen.current.add(eventKey(s)));
    if (fresh.length) setBanner(fresh[0]);
    else if (banner && !signals.some(s => s.id === banner.id)) setBanner(null);
  }, [signals, banner]);

  const arrivals = data ? liveFirst(withLiveSignals(data.arrivals, "outbound", signals)) : [];
  const returns = data ? liveFirst(withShuttleTrips(withLiveSignals(data.returns, "return", signals), isToday ? live.data?.shuttleTrips : undefined)) : [];

  return (
    <>
      {banner && <ArrivalBanner signal={banner} onClose={() => setBanner(null)} />}
      <PlanningTabs />
      {data?.smsWarning && <SmsWarning pending={data.smsWarning.pending} manager={can(user?.role, "parking:manage")} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button aria-label={t.previousDay} onClick={() => go(addDays(date, -1))} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold uppercase tracking-wide">{longDate(date)}</h1>
          <button aria-label={t.nextDay} onClick={() => go(addDays(date, 1))} className="flex h-11 w-11 items-center justify-center border border-border hover:bg-accent">
            <ChevronRight className="h-5 w-5" />
          </button>
          {date !== todayLocal() && (
            <button onClick={() => go(todayLocal())} className="h-11 border border-border px-3 font-semibold uppercase hover:bg-accent">
              {t.today}
            </button>
          )}
        </div>
        {can(user?.role, "reservations:manage") && (
          <div className="flex gap-2">
            <Link
              to={`/reservations/nouvelle${date !== todayLocal() ? `?date=${date}` : ""}`}
              className="flex h-11 items-center bg-primary px-5 text-base font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110"
            >
              {t.newReservation}
            </Link>
          </div>
        )}
      </div>

      {error && <p className="text-destructive">{describeError(error)}</p>}
      {isLoading && <Skeleton className="h-96 w-full" />}

      {data && (
        <>
          <section aria-label={t.nightsTitle} className="flex gap-1 overflow-x-auto">
            {data.nights.map(n => (
              <NightCell key={n.date} night={n} />
            ))}
          </section>
          {isToday && (
            <div data-testid="planning-next" className="grid gap-3 sm:grid-cols-2 lg:gap-8">
              <NextCard items={arrivals} kind="arrival" now={now} />
              <NextCard items={returns} kind="return" now={now} />
            </div>
          )}
          <div className="grid gap-8 lg:grid-cols-2">
            <Column
              title={t.arrivals}
              count={t.arrivalsCount(data.stats.arrivals, data.stats.arrived)}
              items={arrivals}
              kind="arrival"
              empty={t.noArrival}
              clock={clock}
              today={isToday}
            />
            <Column title={t.returns} count={String(data.stats.returns)} items={returns} kind="return" empty={t.noReturn} clock={clock} today={isToday} />
          </div>
        </>
      )}
    </>
  );
}
