import { useQuery } from "@tanstack/react-query";
import { Bell, BusFront, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MessageSquareWarning, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { StatusPill } from "@/components/StatusPill";
import { MovementPill } from "@/components/MovementPill";
import { Plate } from "@/components/Plate";
import { LiveReservationPanel } from "@/components/planning/LiveReservationPanel";
import { PlanningTabs } from "@/components/planning/PlanningTabs";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { bannerText, eventKey, shortName, liveFirst, miniMapPoints, positionAge, withLiveSignals, withShuttleTrips } from "@/lib/arrivals";
import { addDays, longDate, shortDay, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { ArrivalSignal, NightLoad, PlanningRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MOVEMENT_CARD, MOVEMENT_DOT, MOVEMENT_TEXT } from "@/lib/movement";
import { ValetPill } from "@/lib/valet-icon";
import { lateOf, nextOf, splitAtNow, travelOf, untilLabel } from "@/lib/planning-now";

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
  selected = false,
  onOpen,
}: {
  r: PlanningRow;
  kind: "arrival" | "return";
  clock: { fetchedAt: number; now: number };
  dimmed?: boolean;
  /** 12/11/2026: the row shown in the live panel stays outlined. */
  selected?: boolean;
  onOpen: (r: PlanningRow, kind: "arrival" | "return") => void;
}) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
  const s = r.arrivalSignal ?? null;
  const live = s?.state === "sharing";
  const age = s && live ? positionAge(s, clock.fetchedAt, clock.now) : null;
  return (
    <li
      id={`row-${r.id}`}
      data-selected={selected || undefined}
      className={cn(
        "overflow-hidden rounded-lg",
        MOVEMENT_CARD[isArrival ? "arrival" : "departure"],
        live && "ring-2 ring-lime-deep",
        selected && "outline outline-[3px] outline-offset-2 outline-lime-deep",
        dimmed && !selected && "opacity-50",
      )}
    >
      {/* C-A (06/10/2026): a row opens the operational card; the full page is one link further. */}
      <button
        type="button"
        data-testid={`planning-row-${r.id}`}
        aria-pressed={selected}
        onClick={() => onOpen(r, kind)}
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
              {t.pax(r.passengers)}{isArrival ? ` · ${r.channelDetail ?? fr.channels[r.channel]}` : ""}
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
        ) : isArrival || !r.returnFlight ? (
          <StatusPill status={r.status} />
        ) : (
          <span className="flex flex-col items-end gap-1">
            <StatusPill status={r.status} />
            <span className="tabular whitespace-nowrap rounded-full border border-info bg-white px-2.5 py-1 font-mono text-sm font-bold text-info-text sm:text-[15px]">{r.returnFlight}</span>
          </span>
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
  selectedId,
  onOpen,
}: {
  title: string;
  count: string;
  items: PlanningRow[];
  kind: "arrival" | "return";
  empty: string;
  clock: { fetchedAt: number; now: number };
  /** Direction A (30/10/2026): today, what is done is folded under « Déjà passés ». */
  today?: boolean;
  selectedId: string | null;
  onOpen: (r: PlanningRow, kind: "arrival" | "return") => void;
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
          <Row
            key={r.id}
            r={r}
            kind={kind}
            clock={clock}
            dimmed={!!live && live.past.includes(r)}
            selected={r.id === selectedId}
            onOpen={onOpen}
          />
        ))}
      </ul>
      {items.length === 0 && <p className="px-1 py-6 text-muted-foreground">{empty}</p>}
    </section>
  );
}

/** « Prochaine arrivée » / « Prochain départ » over its column (direction A of 30/10/2026); moves on once done. */
function NextCard({
  items,
  kind,
  now,
  onOpen,
}: {
  items: PlanningRow[];
  kind: "arrival" | "return";
  now: number;
  onOpen: (r: PlanningRow, kind: "arrival" | "return") => void;
}) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
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
          onClick={() => onOpen(row, kind)}
          className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 rounded-md text-left hover:bg-accent/40"
        >
          <span className="tabular font-mono text-3xl font-bold">{timeOf(atOf(row))}</span>
          <span className="min-w-0">
            <span className="block truncate text-lg font-semibold">{row.customerName}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {[t.pax(row.passengers), travelOf(row, kind).place].filter(Boolean).join(" · ")}
            </span>
            {travelOf(row, kind).flight && (
              <span data-testid={`next-${kind}-flight`} className="tabular block truncate font-mono text-xs font-bold text-info-text">
                {travelOf(row, kind).flight}
              </span>
            )}
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
              onClick={() => onOpen(r, kind)}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 text-left text-sm hover:underline"
            >
              <span className="tabular font-mono font-bold">{timeOf(atOf(r))}</span>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{r.customerName}</span>
                {(() => {
                  const travel = travelOf(r, kind);
                  const line = [travel.flight, travel.place].filter(Boolean).join(" · ");
                  return line ? <span className="block truncate text-xs text-muted-foreground">{line}</span> : null;
                })()}
              </span>
              <span className="tabular whitespace-nowrap font-mono text-xs font-bold text-warn-text">{untilLabel(atOf(r), now).text}</span>
            </button>
          ))}
          {late.length > shownLate.length && <span className="text-xs text-warn-text">{t.lateMore(late.length - shownLate.length)}</span>}
        </div>
      )}
    </div>
  );
}

/** 12/11/2026: the choice to fold the two next cards, kept on this browser. */
const NEXT_COLLAPSED_KEY = "plazo:planning-next-collapsed";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(NEXT_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    if (value) window.localStorage.setItem(NEXT_COLLAPSED_KEY, "1");
    else window.localStorage.removeItem(NEXT_COLLAPSED_KEY);
  } catch {
    // Private window or blocked storage: the choice lasts for this page only.
  }
}

/** « ↑ 11:15 S. Morel dans 25 min » in the folded line. */
function FoldedNext({
  items,
  kind,
  now,
  withUntil,
  onOpen,
}: {
  items: PlanningRow[];
  kind: "arrival" | "return";
  now: number;
  withUntil: boolean;
  onOpen: (r: PlanningRow, kind: "arrival" | "return") => void;
}) {
  const isArrival = kind === "arrival";
  const row = nextOf(items, kind, now);
  if (!row) return null;
  const at = isArrival ? row.arrivalAt : row.returnAt;
  return (
    <button
      type="button"
      data-testid={`folded-${kind}`}
      onClick={() => onOpen(row, kind)}
      className="flex min-w-0 items-center gap-2 rounded-md text-left hover:underline"
    >
      <span
        aria-label={`${fr.movement[isArrival ? "arrival" : "departure"]} ${timeOf(at)}`}
        className={cn("tabular shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[13px] font-bold text-white", isArrival ? "bg-ok" : "bg-info")}
      >
        {isArrival ? "↑" : "↓"} {timeOf(at)}
      </span>
      <span className="truncate font-semibold">{shortName(row.customerName, { firstName: row.customerFirstName, lastName: row.customerLastName })}</span>
      {withUntil && <span className="tabular whitespace-nowrap font-mono text-sm text-muted-foreground">{untilLabel(at, now).text}</span>}
    </button>
  );
}

/** The next arrival and departure (direction A of 30/10/2026), foldable into one line (12/11/2026). */
function NextCards({
  arrivals,
  returns,
  now,
  onOpen,
}: {
  arrivals: PlanningRow[];
  returns: PlanningRow[];
  now: number;
  onOpen: (r: PlanningRow, kind: "arrival" | "return") => void;
}) {
  const t = fr.planning;
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const toggle = () => {
    writeCollapsed(!collapsed);
    setCollapsed(!collapsed);
  };
  const chevron = (
    <button
      type="button"
      data-testid="planning-next-toggle"
      aria-label={collapsed ? t.unfold : t.fold}
      aria-expanded={!collapsed}
      onClick={toggle}
      className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      {collapsed ? <ChevronDown className="h-5 w-5" aria-hidden="true" /> : <ChevronUp className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
  if (collapsed) {
    const late = lateOf(arrivals, "arrival", now).length + lateOf(returns, "return", now).length;
    return (
      <div
        data-testid="planning-next"
        data-collapsed="true"
        className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-panel-line bg-card px-4 py-2"
      >
        <FoldedNext items={arrivals} kind="arrival" now={now} withUntil onOpen={onOpen} />
        <FoldedNext items={returns} kind="return" now={now} withUntil={false} onOpen={onOpen} />
        {late > 0 && (
          <span
            data-testid="folded-late"
            className="whitespace-nowrap rounded-full bg-warn-soft px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-warn-text"
          >
            {t.lateCount(late)}
          </span>
        )}
        {chevron}
      </div>
    );
  }
  return (
    <div data-testid="planning-next" className="flex flex-col gap-1">
      <div className="flex items-center px-1">
        <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">{t.now}</span>
        {chevron}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:gap-8">
        <NextCard items={arrivals} kind="arrival" now={now} onOpen={onOpen} />
        <NextCard items={returns} kind="return" now={now} onOpen={onOpen} />
      </div>
    </div>
  );
}

/** Wide screens (lg and up) open a booking next to the planning; smaller ones keep the drawer. */
const WIDE_QUERY = "(min-width: 1024px)";

function useWide(): boolean {
  const [wide, setWide] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(WIDE_QUERY).matches);
  useEffect(() => {
    const media = window.matchMedia?.(WIDE_QUERY);
    if (!media) return;
    const onChange = () => setWide(media.matches);
    onChange();
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);
  return wide;
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
        <Link to="/parking/reglages#sms" className="font-semibold underline-offset-4 hover:underline">
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

  // 12/11/2026: on a wide screen a row opens the booking next to the planning; on a phone, the drawer as before.
  const wide = useWide();
  const card = useQuickCard();
  const [selected, setSelected] = useState<{ id: string; kind: "arrival" | "return" } | null>(null);
  const onOpen = useCallback(
    (r: PlanningRow, kind: "arrival" | "return") => {
      if (wide) setSelected(current => (current?.id === r.id && current.kind === kind ? null : { id: r.id, kind }));
      else card.open(r.id);
    },
    [wide, card],
  );
  const closePanel = useCallback(() => setSelected(null), []);
  useEffect(() => setSelected(null), [date]);
  const selectedRow = wide && selected ? ((selected.kind === "arrival" ? arrivals : returns).find(r => r.id === selected.id) ?? null) : null;

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
        <div className={cn(selectedRow && "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]")}>
          <div className="min-w-0 space-y-6">
          <section aria-label={t.nightsTitle} className="flex gap-1 overflow-x-auto">
            {data.nights.map(n => (
              <NightCell key={n.date} night={n} />
            ))}
          </section>
          {isToday && <NextCards arrivals={arrivals} returns={returns} now={now} onOpen={onOpen} />}
          <div className={cn("grid gap-8", selectedRow ? "2xl:grid-cols-2" : "lg:grid-cols-2")}>
            <Column
              title={t.arrivals}
              count={t.arrivalsCount(data.stats.arrivals, data.stats.arrived)}
              items={arrivals}
              kind="arrival"
              empty={t.noArrival}
              clock={clock}
              today={isToday}
              selectedId={selected?.kind === "arrival" ? selected.id : null}
              onOpen={onOpen}
            />
            <Column
              title={t.returns}
              count={String(data.stats.returns)}
              items={returns}
              kind="return"
              empty={t.noReturn}
              clock={clock}
              today={isToday}
              selectedId={selected?.kind === "return" ? selected.id : null}
              onOpen={onOpen}
            />
          </div>
          </div>
          {selectedRow && selected && <LiveReservationPanel key={selectedRow.id} row={selectedRow} kind={selected.kind} onClose={closePanel} />}
        </div>
      )}
    </>
  );
}
