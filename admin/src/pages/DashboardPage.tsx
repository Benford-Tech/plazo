import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, BusFront, CreditCard, Eye, FileInput, KeyRound, MessageSquare, Plane } from "lucide-react";
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from "react";
import { Link } from "react-router-dom";
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

function Kpi({ label, value, sub, to, accent }: { label: string; value: ReactNode; sub: string; to: string; accent?: boolean }) {
  return (
    <Link to={to} className={cn("flex flex-col gap-1 border border-border px-4 py-3 hover:bg-accent", accent && "border-primary")}>
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("tabular font-mono text-3xl font-bold leading-none", accent && "text-primary")}>{value}</span>
      <span className="truncate text-sm text-muted-foreground">{sub || " "}</span>
    </Link>
  );
}

type Health = "on" | "warn" | "off";
function Service({ icon: IconC, label, state, detail }: { icon: Icon; label: string; state: Health; detail: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-2">
      <span
        aria-hidden="true"
        className={cn("h-2 w-2 shrink-0 rounded-full", state === "on" ? "bg-success" : state === "warn" ? "bg-primary" : "bg-muted-foreground/50")}
      />
      <IconC className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-semibold uppercase tracking-wide">{label}</span>
      <span className="truncate text-sm text-muted-foreground">{detail}</span>
    </div>
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
          : { state: "on", detail: s.smsOk };
  const stripe: { state: Health; detail: string } = services.stripe.payoutsEnabled
    ? { state: "on", detail: s.stripeOn }
    : services.stripe.connected
      ? { state: "warn", detail: s.stripePending }
      : { state: "off", detail: s.stripeOff };
  return (
    <div aria-label={s.title} className="grid grid-cols-1 divide-y divide-border border border-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-5 lg:divide-x">
      <Service icon={Plane} label={s.flights} state={services.flights.configured ? "on" : "off"} detail={services.flights.configured ? s.flightsOn(services.flights.provider) : s.flightsOff} />
      <Service icon={MessageSquare} label={s.sms} state={sms.state} detail={sms.detail} />
      <Service icon={Bell} label={s.push} state={services.push.configured ? "on" : "off"} detail={services.push.configured ? s.pushOn(services.push.devices) : s.pushOff} />
      <Service icon={CreditCard} label={s.stripe} state={stripe.state} detail={stripe.detail} />
      <Service icon={FileInput} label={s.importLabel} state={services.lastImportAt ? "on" : "off"} detail={services.lastImportAt ? s.importAt(timeAgo(services.lastImportAt)) : s.importNever} />
    </div>
  );
}

const SEVERITY_ICON: Record<AlertSeverity, Icon> = { urgent: AlertTriangle, watch: Eye, todo: KeyRound };

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const a = t.alerts;
  const IconC = SEVERITY_ICON[alert.severity];
  const body = (
    <>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center",
          alert.severity === "urgent" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
        )}
      >
        <IconC className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex flex-wrap items-center gap-x-2">
          <span className="font-semibold">{a.kind[alert.kind]}</span>
          <span className={cn("text-xs font-semibold uppercase tracking-wide", alert.severity === "urgent" ? "text-primary" : "text-muted-foreground")}>
            {a.severity[alert.severity]}
          </span>
        </span>
        <span className="truncate text-sm text-muted-foreground">
          {[alert.customerName, alert.detail].filter(Boolean).join(" · ")}
          {alert.minutes !== null && alert.kind !== "flight_delayed" ? ` · ${a.since(alert.minutes)}` : ""}
        </span>
      </span>
      {alert.plate && <Plate value={alert.plate} size="sm" />}
    </>
  );
  const className = "flex items-center gap-3 px-3 py-2.5";
  return alert.reservationId ? (
    <Link to={`/reservations/${alert.reservationId}`} className={cn(className, "hover:bg-accent")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function VehicleRow({ v }: { v: DashboardVehicle }) {
  const s = t.vehicles;
  return (
    <Link to={`/reservations/${v.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent">
      <Plate value={v.plate} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{v.customerName}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {v.tripDirection
            ? s.onTrip[v.tripDirection]
            : v.returnsToday
              ? `${s.returnToday(timeOf(v.returnAt))}${v.returnFlight ? ` · ${v.returnFlight}` : ""}`
              : s.returnLater(shortDay(v.returnAt.slice(0, 10)))}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {v.stayClass && s.stay[v.stayClass] && <span className="hidden border border-border px-1.5 py-0.5 text-xs text-muted-foreground sm:inline">{s.stay[v.stayClass]}</span>}
        <span className={cn("tabular font-mono text-sm font-bold", !v.spotCode && "text-primary")}>{v.spotCode ?? s.noSpot}</span>
        <span className={cn("hidden text-xs sm:inline", v.keyHook ? "text-muted-foreground" : "text-primary")}>{v.keyHook ? s.keys(v.keyHook) : s.noKeys}</span>
      </span>
    </Link>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="border border-border">
      <header className="flex items-center gap-3 border-b border-border px-3 py-2">
        <h2 className="text-sm font-bold uppercase tracking-wide">{title}</h2>
        <span className="ml-auto text-sm text-muted-foreground">{aside}</span>
      </header>
      {children}
    </section>
  );
}

function LivePanel({ live }: { live: LiveShuttles | undefined }) {
  const m = t.map;
  return (
    <Panel
      title={m.title}
      aside={
        <Link to="/planning" className="text-primary underline-offset-2 hover:underline">
          {m.open}
        </Link>
      }
    >
      <div className="h-[320px] lg:h-[420px]">
        {live ? (
          <Suspense fallback={<Skeleton className="h-full w-full" />}>
            <LiveShuttlesMap live={live} />
          </Suspense>
        ) : (
          <Skeleton className="h-full w-full" />
        )}
      </div>
      <ul className="divide-y divide-border border-t border-border">
        {live && live.trips.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{m.none}</li>}
        {live?.trips.map(trip => (
          <li key={trip.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <BusFront className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="font-semibold">{trip.driverName}</span>
            <span className="text-muted-foreground">{m.direction[trip.direction]}</span>
            <span className="ml-auto tabular font-mono text-muted-foreground">
              {trip.toStop && trip.stop ? m.toStop(trip.stop.name, trip.toStop.etaMinutes) : trip.toParking ? m.toParking(trip.toParking.etaMinutes) : m.noPosition}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** The home of the pro space: the day's figures, the services, what to treat first, the vehicles and the shuttles. */
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
      <div role="alert" className="border border-destructive px-4 py-3 text-destructive">
        {t.loadError} {describeError(dashboard.error)}
      </div>
    );
  }
  const d = dashboard.data;
  if (!d) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }
  const k = t.kpi;
  const urgent = d.alerts.filter(a => a.severity === "urgent").length;
  const vehicles = allVehicles ? d.vehicles : d.vehicles.slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-2xl font-bold uppercase tracking-wide">{t.hello(user?.name?.split(" ")[0] ?? "")}</h1>
        <span className="text-sm uppercase tracking-wide text-muted-foreground">{t.today(longDate(d.date))}</span>
        <span className="ml-auto text-sm text-muted-foreground">{t.refreshed(timeAgo(d.serverTime, now))}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label={k.onSite} value={d.counts.onSite} sub={k.onSiteSub(d.counts.freeSpots, d.parking.plannedSpots)} to="/parking/occupation" />
        <Kpi label={k.arrivals} value={d.counts.arrivalsToday} sub={k.arrivalsSub(d.counts.arrivedToday, d.counts.arrivalsToday)} to="/planning" />
        <Kpi label={k.returns} value={d.counts.returnsToday} sub={k.returnsSub(d.breakdown.returnsThisWeek)} to="/planning" />
        <Kpi label={k.shuttles} value={d.counts.shuttlesRunning} sub={k.shuttlesSub(d.counts.shuttlesRunning)} to="/planning" />
        <Kpi label={k.toTreat} value={d.counts.toTreat} sub={k.toTreatSub(urgent)} to="/" accent={urgent > 0} />
      </div>

      <ServicesStrip services={d.services} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-4">
          <Panel title={t.alerts.title} aside={d.alerts.length > 0 ? String(d.alerts.length) : undefined}>
            {d.alerts.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">{t.alerts.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {d.alerts.map((alert, i) => (
                  <li key={`${alert.kind}-${alert.reservationId ?? i}`}>
                    <AlertRow alert={alert} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel title={t.vehicles.title} aside={t.vehicles.count(d.vehicles.length)}>
            {d.vehicles.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">{t.vehicles.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {vehicles.map(v => (
                  <li key={v.id}>
                    <VehicleRow v={v} />
                  </li>
                ))}
              </ul>
            )}
            {d.vehicles.length > vehicles.length && (
              <button onClick={() => setAllVehicles(true)} className="w-full border-t border-border px-3 py-2 text-sm font-semibold text-primary hover:bg-accent">
                {t.vehicles.all}
              </button>
            )}
          </Panel>
        </div>
        <LivePanel live={live.data} />
      </div>
    </div>
  );
}
