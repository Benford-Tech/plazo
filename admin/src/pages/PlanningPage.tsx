import { useQuery } from "@tanstack/react-query";
import { Bell, BusFront, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { bannerText, eventKey, liveFirst, miniMapPoints, positionAge, withLiveSignals, withShuttleTrips } from "@/lib/arrivals";
import { addDays, longDate, shortDay, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { ArrivalSignal, NightLoad, PlanningRow } from "@/lib/types";
import { cn } from "@/lib/utils";

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
      className="h-[110px] w-full border border-border bg-[#1b1c1a]"
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
  return <span className="whitespace-nowrap text-xs font-bold uppercase text-primary sm:text-sm">● {text}</span>;
}

function Row({ r, kind, index, clock }: { r: PlanningRow; kind: "arrival" | "return"; index: number; clock: { fetchedAt: number; now: number } }) {
  const t = fr.planning;
  const isArrival = kind === "arrival";
  const onSite = r.status !== "upcoming";
  const s = r.arrivalSignal ?? null;
  const live = s?.state === "sharing";
  const age = s && live ? positionAge(s, clock.fetchedAt, clock.now) : null;
  return (
    <li id={`row-${r.id}`} className={cn(live && "my-1 border-2 border-primary")}>
      <Link
        to={`/reservations/${r.id}`}
        className={cn(
          "grid min-h-16 grid-cols-[56px_1fr_auto] items-center gap-3 border-b border-[#262625] px-1 py-2 hover:bg-accent sm:grid-cols-[64px_1fr_auto] sm:gap-3.5",
          live ? "border-b-0 bg-background px-2.5" : index % 2 ? "bg-[#111112]" : "bg-background",
        )}
      >
        <span className="tabular font-mono text-xl font-bold text-primary">{timeOf(isArrival ? r.arrivalAt : r.returnAt)}</span>
        {/* On a phone the plate sits above the name; side by side from sm up. */}
        <span className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3.5">
          <Plate value={r.plate} />
          <span className="min-w-0 max-w-full">
            <span className="block truncate text-lg font-semibold">{r.customerName}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {t.pax(r.passengers)} · {isArrival ? (r.channelDetail ?? fr.channels[r.channel]) : fr.status[r.status]}
            </span>
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
              "whitespace-nowrap px-2 py-1 text-xs font-bold uppercase sm:text-sm",
              onSite ? "bg-foreground text-background" : "border border-border text-muted-foreground",
            )}
          >
            {fr.status[r.status]}
          </span>
        ) : r.returnFlight ? (
          <span className="tabular whitespace-nowrap border border-primary px-2 py-1 font-mono text-sm font-bold text-primary sm:text-[15px]">{r.returnFlight}</span>
        ) : (
          <span />
        )}
      </Link>
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
}: {
  title: string;
  count: string;
  items: PlanningRow[];
  kind: "arrival" | "return";
  empty: string;
  clock: { fetchedAt: number; now: number };
}) {
  return (
    <section className="flex min-w-0 flex-col">
      <div className="flex items-baseline justify-between border-b-2 border-primary px-1 pb-2">
        <h2 className="text-2xl font-bold uppercase tracking-wider">{title}</h2>
        <span className="tabular font-mono text-muted-foreground">{count}</span>
      </div>
      <ul>
        {items.map((r, i) => (
          <Row key={r.id} r={r} kind={kind} index={i} clock={clock} />
        ))}
      </ul>
      {items.length === 0 && <p className="px-1 py-6 text-muted-foreground">{empty}</p>}
    </section>
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
            <Link to="/reservations/import" className="flex h-11 items-center border border-border px-4 text-base font-semibold uppercase tracking-wide hover:bg-accent">
              {fr.importEmail.action}
            </Link>
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
          <div className="grid gap-8 lg:grid-cols-2">
            <Column
              title={t.arrivals}
              count={t.arrivalsCount(data.stats.arrivals, data.stats.arrived)}
              items={arrivals}
              kind="arrival"
              empty={t.noArrival}
              clock={clock}
            />
            <Column title={t.returns} count={String(data.stats.returns)} items={returns} kind="return" empty={t.noReturn} clock={clock} />
          </div>
        </>
      )}
    </>
  );
}
