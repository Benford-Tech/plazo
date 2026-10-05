import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Bell, BusFront, CreditCard, FileInput, MessageSquare, Plane, SquareParking, TriangleAlert } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Link } from "react-router-dom";
import { Badge, StatusPill, type BadgeTone } from "@/components/dashboard/Badge";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { longDate, shortDay, timeAgo, timeOf } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type { AlertSeverity, Dashboard, DashboardAlert, DashboardVehicle, LiveShuttles } from "@/lib/types";
import { cn } from "@/lib/utils";

const LiveShuttlesMap = lazy(() => import("@/components/dashboard/LiveShuttlesMap"));

/** Polling: Vercel has no websockets; the shuttles move, the rest barely. */
const DASHBOARD_POLL_MS = 30_000;
const LIVE_POLL_MS = 12_000;
const t = fr.dashboard;

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** The "Flotte" tile: mono label, a round disc with the icon, the figure in mono; amber border when it needs an eye. */
function Kpi({ label, value, sub, to, icon: IconC, alert, testId }: { label: string; value: number; sub: string; to: string; icon: Icon; alert?: boolean; testId: string }) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className={cn("flex flex-col gap-3 rounded-xl border bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2", alert ? "border-warn" : "border-panel-line")}
    >
      <span className="font-mono text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-3">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2", alert ? "text-warn" : "text-primary")}>
          <IconC className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="tabular font-mono text-3xl font-medium leading-none tracking-tight">{value}</span>
      </span>
      <span className="truncate font-mono text-xs text-muted-foreground">{sub || " "}</span>
    </Link>
  );
}

type Health = "ok" | "warn" | "off";
function Service({ icon: IconC, label, state, detail }: { icon: Icon; label: string; state: Health; detail: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-[13px]">
      <IconC className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <b className="font-bold">{label}</b>
      <StatusPill tone={state}>{t.services[state]}</StatusPill>
      <span className="truncate text-muted-foreground">{detail}</span>
    </span>
  );
}

function ServicesStrip({ services }: { services: Dashboard["services"] }) {
  const s = t.services;
  const sms: { state: Health; detail: string } =
    services.sms.mode === "none"
      ? { state: "off", detail: s.smsOff }
      : services.sms.stale
        ? { state: "warn", detail: s.smsStale }
        : services.sms.pending > 0
          ? { state: "warn", detail: s.smsPending(services.sms.pending) }
          : { state: "ok", detail: s.smsOk };
  const stripe: { state: Health; detail: string } = services.stripe.payoutsEnabled
    ? { state: "ok", detail: s.stripeOn }
    : services.stripe.connected
      ? { state: "warn", detail: s.stripePending }
      : { state: "off", detail: s.stripeOff };
  return (
    <div aria-label={s.title} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-panel-line bg-panel px-4 py-2.5">
      <Service icon={Plane} label={s.flights} state={services.flights.configured ? "ok" : "off"} detail={services.flights.configured ? s.flightsOn(services.flights.provider) : s.flightsOff} />
      <Service icon={MessageSquare} label={s.sms} state={sms.state} detail={sms.detail} />
      <Service icon={Bell} label={s.push} state={services.push.configured ? "ok" : "off"} detail={services.push.configured ? s.pushOn(services.push.devices) : s.pushOff} />
      <Service icon={CreditCard} label={s.stripe} state={stripe.state} detail={stripe.detail} />
      <Service icon={FileInput} label={s.importLabel} state={services.lastImportAt ? "ok" : "off"} detail={services.lastImportAt ? s.importAt(timeAgo(services.lastImportAt)) : s.importNever} />
    </div>
  );
}

const SEVERITY_TONE: Record<AlertSeverity, BadgeTone> = { urgent: "bad", watch: "warn", todo: "line" };

/** An "Opérations" row: what, who, since when, the severity as a badge; opens the booking. */
function AlertRow({ alert }: { alert: DashboardAlert }) {
  const a = t.alerts;
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[15px] font-semibold">{a.kind[alert.kind]}</span>
        <span className="truncate text-[13px] text-muted-foreground">{[alert.customerName, alert.detail].filter(Boolean).join(" · ")}</span>
      </span>
      {alert.minutes !== null && alert.kind !== "flight_delayed" && <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{a.since(alert.minutes)}</span>}
      {alert.plate && <Plate value={alert.plate} size="sm" className="hidden sm:inline-flex" />}
      <Badge tone={SEVERITY_TONE[alert.severity]}>{a.severity[alert.severity]}</Badge>
    </>
  );
  const className = "flex items-center gap-3 border-t border-panel-line px-1 py-2.5 first:border-t-0";
  return alert.reservationId ? (
    <Link to={`/reservations/${alert.reservationId}`} className={cn(className, "hover:bg-panel-2")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/** The badges of the "Flotte" list: the return of the day, the flight, the spot, the trip. */
function vehicleBadges(v: DashboardVehicle): { tone: BadgeTone; text: string }[] {
  const b = t.vehicles.badge;
  const out: { tone: BadgeTone; text: string }[] = [];
  if (v.returnsToday) out.push({ tone: "info", text: b.returnToday });
  if (v.flightStatus === "landed") out.push({ tone: "ok", text: b.landed });
  else if (v.flightStatus === "cancelled" || v.flightStatus === "diverted") out.push({ tone: "bad", text: b.cancelled });
  else if (v.flightStatus === "delayed" || (v.flightScheduledAt && v.flightEstimatedAt && v.flightEstimatedAt > v.flightScheduledAt)) {
    const late = v.flightScheduledAt && v.flightEstimatedAt ? Math.round((new Date(v.flightEstimatedAt).getTime() - new Date(v.flightScheduledAt).getTime()) / 60000) : 0;
    out.push({ tone: "warn", text: late > 0 ? b.delayed(late) : fr.dashboard.alerts.kind.flight_delayed });
  }
  if (v.tripDirection) out.push({ tone: "accent", text: b.onTrip });
  else if (v.status === "return_requested") out.push({ tone: "warn", text: b.waiting });
  else if (v.status === "shuttled_out") out.push({ tone: "line", text: b.shuttled });
  if (!v.spotCode) out.push({ tone: "bad", text: b.noSpot });
  else if (out.length === 0) out.push({ tone: "ok", text: b.onSite });
  return out;
}

function VehicleRow({ v }: { v: DashboardVehicle }) {
  const s = t.vehicles;
  const meta = [
    v.keyHook ? s.keysHook(v.keyHook) : s.badge.noKeys,
    v.returnFlight ? s.flight(v.returnFlight, timeOf(v.flightEstimatedAt ?? v.returnAt)) : null,
    v.returnsToday ? s.returnToday(timeOf(v.returnAt)) : s.returnLater(shortDay(v.returnAt.slice(0, 10))),
  ].filter(Boolean) as string[];
  const place = v.spotCode ? [v.spotCode, v.stayClass ? s.stay[v.stayClass] : null].filter(Boolean).join(" · ") : s.noSpot;
  return (
    <Link to={`/reservations/${v.id}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-panel-line bg-panel-2 p-3 hover:border-muted-foreground/40">
      <Plate value={v.plate} size="sm" />
      <span className="min-w-0">
        <span className={cn("block font-mono text-xs font-medium", v.spotCode ? "text-muted-foreground" : "text-bad-text")}>{place}</span>
        <span className="block truncate font-mono text-[15px] font-medium">
          {v.customerName} · {s.pax(v.passengers)}
        </span>
        <span className="mt-1.5 flex flex-wrap gap-1.5">
          {meta.map(m => (
            <span key={m} className={cn("rounded-full border border-panel-line px-2 py-0.5 font-mono text-[11px] text-muted-foreground", m === s.badge.noKeys && "border-warn text-warn-text")}>
              {m}
            </span>
          ))}
        </span>
      </span>
      <span className="flex flex-col items-end gap-1.5">
        {vehicleBadges(v).map(b => (
          <Badge key={b.text} tone={b.tone}>
            {b.text}
          </Badge>
        ))}
      </span>
    </Link>
  );
}

function Panel({ title, sub, aside, children, className }: { title: string; sub?: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border border-panel-line bg-panel p-3.5", className)}>
      <header className="mb-3 flex items-start gap-3">
        <span className="min-w-0">
          <h2 className="font-mono text-[19px] font-medium leading-tight">{title}</h2>
          {sub && <span className="block font-mono text-xs text-muted-foreground">{sub}</span>}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">{aside}</span>
      </header>
      {children}
    </section>
  );
}

function LivePanel({ live, parkingName }: { live: LiveShuttles | undefined; parkingName: string }) {
  const m = t.map;
  return (
    <section aria-label={m.title} className="relative min-h-[420px] overflow-hidden rounded-xl border border-panel-line bg-[#1B1C22] lg:h-full">
      <div className="absolute inset-0">
        {live ? (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
            <LiveShuttlesMap live={live} />
          </Suspense>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
        {m.title} · {parkingName}
      </span>
      <Link to="/planning" className="absolute right-3 top-3 rounded-full border border-panel-line bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-2">
        {m.open}
      </Link>
      <ul className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
        {live && live.trips.length === 0 && (
          <li className="w-fit rounded-full border border-panel-line bg-panel px-3 py-1.5 font-mono text-xs text-foreground">{m.none}</li>
        )}
        {live?.trips.map((trip, i) => (
          <li key={trip.id} className="flex w-fit max-w-full items-center gap-2 rounded-full border border-panel-line bg-panel px-3 py-1.5 font-mono text-xs">
            <BusFront className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <b className="font-medium">{String(i + 1).padStart(2, "0")}</b>
            <span>{trip.driverName}</span>
            <span className="text-muted-foreground">{m.direction[trip.direction]}</span>
            <span className="truncate text-muted-foreground">
              · {trip.toStop && trip.stop ? m.toStop(trip.stop.name, trip.toStop.etaMinutes) : trip.toParking ? m.toParking(trip.toParking.etaMinutes) : m.noPosition}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The home of the pro space (fusion "Flotte + Opérations", 05/10/2026). */
export default function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: adminApi.getDashboard, refetchInterval: DASHBOARD_POLL_MS });
  const live = useQuery({ queryKey: ["shuttle-live"], queryFn: adminApi.getLiveShuttles, refetchInterval: LIVE_POLL_MS });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  const [allVehicles, setAllVehicles] = useState(false);

  if (dashboard.isError) {
    return (
      <div role="alert" className="rounded-xl border border-bad bg-bad-soft px-4 py-3 text-bad-text">
        {t.loadError} {describeError(dashboard.error)}
      </div>
    );
  }
  const d = dashboard.data;
  if (!d) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-80 rounded-full" />
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }
  const k = t.kpi;
  const urgent = d.alerts.filter(a => a.severity === "urgent").length;
  const vehicles = allVehicles ? d.vehicles : d.vehicles.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-mono text-[13px] text-muted-foreground">
        <h1 className="font-sans text-2xl font-bold uppercase tracking-wide text-foreground">{t.hello(user?.name?.split(" ")[0] ?? "")}</h1>
        <span>/</span>
        <span>{d.parking.name}</span>
        <span>/</span>
        <b className="font-medium text-foreground">{longDate(d.date)}</b>
        <span className="ml-auto rounded-full border border-panel-line bg-panel px-3 py-1.5 text-xs">{t.refreshed(timeAgo(d.serverTime, now))}</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
        <Kpi testId="kpi-on-site" label={k.onSite} value={d.counts.onSite} sub={k.onSiteSub(d.counts.freeSpots, d.parking.plannedSpots)} to="/parking/occupation" icon={SquareParking} />
        <Kpi testId="kpi-arrivals" label={k.arrivals} value={d.counts.arrivalsToday} sub={k.arrivalsSub(d.counts.arrivedToday, d.counts.arrivalsToday)} to="/planning" icon={ArrowDownToLine} />
        <Kpi testId="kpi-returns" label={k.returns} value={d.counts.returnsToday} sub={k.returnsSub(d.breakdown.returnsThisWeek)} to="/planning" icon={ArrowUpFromLine} />
        <Kpi testId="kpi-shuttles" label={k.shuttles} value={d.counts.shuttlesRunning} sub={k.shuttlesSub(d.counts.shuttlesRunning)} to="/planning" icon={BusFront} />
        <Kpi testId="kpi-to-treat" label={k.toTreat} value={d.counts.toTreat} sub={k.toTreatSub(urgent)} to="/" icon={TriangleAlert} alert={urgent > 0} />
      </div>

      <ServicesStrip services={d.services} />

      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-3">
          <Panel title={t.alerts.title} aside={urgent > 0 ? <Badge tone="bad">{t.alerts.urgentCount(urgent)}</Badge> : d.alerts.length > 0 ? <Badge tone="line">{d.alerts.length}</Badge> : null}>
            {d.alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <StatusPill tone="ok">{t.services.ok}</StatusPill>
                {t.alerts.empty}
              </p>
            ) : (
              <ul>
                {d.alerts.map((alert, i) => (
                  <li key={`${alert.kind}-${alert.reservationId ?? i}`}>
                    <AlertRow alert={alert} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={t.vehicles.title} sub={t.refreshed(timeAgo(d.serverTime, now))} aside={<Badge tone="line">{t.vehicles.count(d.vehicles.length)}</Badge>}>
            {d.vehicles.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">{t.vehicles.empty}</p>
            ) : (
              <ul className="grid gap-2">
                {vehicles.map(v => (
                  <li key={v.id}>
                    <VehicleRow v={v} />
                  </li>
                ))}
              </ul>
            )}
            {d.vehicles.length > vehicles.length && (
              <button onClick={() => setAllVehicles(true)} className="mt-3 w-full rounded-full border border-panel-line py-2 text-sm font-semibold text-primary hover:bg-panel-2">
                {t.vehicles.all}
              </button>
            )}
          </Panel>
        </div>
        <LivePanel live={live.data} parkingName={d.parking.name} />
      </div>
    </div>
  );
}
