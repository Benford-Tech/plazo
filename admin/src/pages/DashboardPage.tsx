import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BusFront,
  CreditCard,
  FileInput,
  KeyRound,
  MessageSquare,
  Plane,
  SquareParking,
  TriangleAlert,
} from "lucide-react";
import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Badge,
  StatusPill,
  type BadgeTone,
} from "@/components/dashboard/Badge";
import { Plate } from "@/components/Plate";
import { RevenueTile } from "@/components/dashboard/RevenueTile";
import { VehiclesTable } from "@/components/dashboard/VehiclesTable";
import { QuickPrice } from "@/components/reservations/QuickPrice";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import {
  dateTimeShort,
  longDate,
  shortDay,
  timeAgo,
  timeOf,
} from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import type {
  AlertKind,
  AlertSeverity,
  Dashboard,
  DashboardAlert,
  DashboardVehicle,
  LiveShuttles,
  ShuttleDirection,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const LiveShuttlesMap = lazy(
  () => import("@/components/dashboard/LiveShuttlesMap"),
);

/** Polling: Vercel has no websockets; the shuttles move, the rest barely. */
const DASHBOARD_POLL_MS = 30_000;
const LIVE_POLL_MS = 12_000;
const t = fr.dashboard;

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** The "Flotte" tile: mono label, a round disc with the icon, the figure in mono; amber border when it needs an eye. */
function Kpi({
  label,
  value,
  sub,
  to,
  icon: IconC,
  alert,
  testId,
}: {
  label: string;
  value: number;
  sub: string;
  to: string;
  icon: Icon;
  alert?: boolean;
  testId: string;
}) {
  return (
    <Link
      to={to}
      data-testid={testId}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2",
        alert ? "border-warn" : "border-panel-line",
      )}
    >
      <span className="font-mono text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2",
            alert ? "text-warn" : "text-lime-deep",
          )}
        >
          <IconC className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="tabular font-mono text-3xl font-medium leading-none tracking-tight">
          {value}
        </span>
      </span>
      <span className="truncate font-mono text-xs text-muted-foreground">
        {sub || " "}
      </span>
    </Link>
  );
}

type Health = "ok" | "warn" | "off";
function Service({
  icon: IconC,
  label,
  state,
  detail,
}: {
  icon: Icon;
  label: string;
  state: Health;
  detail: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-[13px]">
      <IconC
        className="h-4 w-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
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
  // Payments are centralised (Plazo takes every payment): the tile only says whether online payment is on.
  const online = services.stripe.online ?? services.stripe.connected;
  const stripe: { state: Health; detail: string } = online
    ? { state: "ok", detail: s.stripeOn }
    : { state: "off", detail: s.stripeOff };
  return (
    <div
      aria-label={s.title}
      className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-panel-line bg-panel px-4 py-2.5"
    >
      <Service
        icon={Plane}
        label={s.flights}
        state={services.flights.configured ? "ok" : "off"}
        detail={
          services.flights.configured
            ? s.flightsOn(services.flights.provider)
            : s.flightsOff
        }
      />
      <Service
        icon={MessageSquare}
        label={s.sms}
        state={sms.state}
        detail={sms.detail}
      />
      <Service
        icon={Bell}
        label={s.push}
        state={services.push.configured ? "ok" : "off"}
        detail={
          services.push.configured ? s.pushOn(services.push.devices) : s.pushOff
        }
      />
      <Service
        icon={CreditCard}
        label={s.stripe}
        state={stripe.state}
        detail={stripe.detail}
      />
      {/* 16/10/2026: « À voir » while Claude cannot read the mails that need it (credit, key, load…). */}
      <Service
        icon={FileInput}
        label={s.importLabel}
        state={
          services.reading?.outage
            ? "warn"
            : services.lastImportAt
              ? "ok"
              : "off"
        }
        detail={
          services.reading?.outage
            ? s.importReadingOutage(services.reading.outage.cause)
            : services.lastImportAt
              ? s.importAt(timeAgo(services.lastImportAt))
              : s.importNever
        }
      />
    </div>
  );
}

/** An "Opérations" row: what, who, since when, the severity as a badge; opens the booking. */
/** 26/10/2026 (« ça prend trop de place »): one dense line per alert, severity as a coloured dot. */
const SEVERITY_DOT: Record<AlertSeverity, string> = {
  urgent: "bg-bad",
  watch: "bg-warn",
  todo: "bg-info",
};

function alertDetail(alert: DashboardAlert): string {
  const a = t.alerts;
  if (alert.kind === "wave_overflow" && alert.since && alert.minutes !== null)
    return a.waveDetail(
      alert.detail as ShuttleDirection,
      timeOf(alert.since),
      alert.minutes,
    );
  if (alert.kind === "join_request" && /^\d+$/.test(alert.detail ?? ""))
    return a.joinDetail(Number(alert.detail), alert.customerName);
  if (alert.kind === "price_missing")
    return fr.noPrice.alertDetail(Number(alert.detail) || 0);
  if (alert.kind === "extras_due")
    return a.extrasDetail(
      alert.customerName,
      alert.detail,
      alert.since ? timeOf(alert.since) : null,
    );
  return [alert.customerName, alert.detail].filter(Boolean).join(" · ");
}

function AlertRow({ alert }: { alert: DashboardAlert }) {
  const a = t.alerts;
  const detail = alertDetail(alert);
  const showMinutes =
    alert.minutes !== null &&
    ![
      "flight_delayed",
      "departure_delayed",
      "wave_overflow",
      "join_request",
    ].includes(alert.kind);
  const body = (
    <>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          SEVERITY_DOT[alert.severity],
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate text-[13px]">
        <span className="font-semibold">{a.kind[alert.kind]}</span>
        {detail && <span className="text-muted-foreground"> · {detail}</span>}
      </span>
      {showMinutes && (
        <span className="hidden shrink-0 font-mono text-[11px] text-muted-foreground sm:inline">
          {a.since(alert.minutes!)}
        </span>
      )}
      {/* A request may wait up to 7 days: « il y a 2 j », not « depuis 2880 min ». */}
      {alert.kind === "join_request" && alert.since && (
        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
          {timeAgo(alert.since)}
        </span>
      )}
      {alert.plate && (
        <Plate
          value={alert.plate}
          size="sm"
          className="hidden shrink-0 sm:inline-flex"
        />
      )}
      <span
        className={cn(
          "shrink-0 text-[11px] font-semibold",
          alert.severity === "urgent"
            ? "text-bad-text"
            : alert.severity === "watch"
              ? "text-warn-text"
              : "text-muted-foreground",
        )}
      >
        {a.severity[alert.severity]}
      </span>
    </>
  );
  const className =
    "flex items-center gap-2 border-t border-panel-line px-1 py-1.5 first:border-t-0";
  if (alert.kind === "wave_overflow")
    return (
      <Link to="/navettes" className={cn(className, "hover:bg-panel-2")}>
        {body}
      </Link>
    );
  // 13/10/2026: someone typed the code of the day; the manager answers in Équipe.
  if (alert.kind === "join_request")
    return (
      <Link to="/equipe" className={cn(className, "hover:bg-panel-2")}>
        {body}
      </Link>
    );
  // 21/10/2026 (choice C): opens the list on its « Sans prix » filter.
  if (alert.kind === "price_missing")
    return (
      <Link
        to="/reservations?sansprix=1"
        className={cn(className, "hover:bg-panel-2")}
      >
        {body}
      </Link>
    );
  if (alert.kind === "inbound_to_check")
    return (
      <Link
        to="/reservations/a-verifier"
        className={cn(className, "hover:bg-panel-2")}
      >
        {body}
      </Link>
    );
  return alert.reservationId ? (
    <CardButton
      id={alert.reservationId}
      className={cn(className, "w-full text-left hover:bg-panel-2")}
    >
      {body}
    </CardButton>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * 26/10/2026 (« mets plutôt un nombre à traiter catégorisé par type ») : one counting pill per kind of alert, in the
 * order of the server (urgent first); a pill unfolds its rows, and only its rows.
 */
const SEVERITY_PILL: Record<AlertSeverity, string> = {
  urgent: "border-bad text-bad-text",
  watch: "border-warn text-warn-text",
  todo: "border-panel-line text-foreground",
};

function AlertList({ alerts }: { alerts: DashboardAlert[] }) {
  const [openKind, setOpenKind] = useState<AlertKind | null>(null);
  const groups: {
    kind: AlertKind;
    severity: AlertSeverity;
    items: DashboardAlert[];
  }[] = [];
  for (const alert of alerts) {
    const group = groups.find((g) => g.kind === alert.kind);
    if (group) group.items.push(alert);
    else
      groups.push({
        kind: alert.kind,
        severity: alert.severity,
        items: [alert],
      });
  }
  const open = groups.find((g) => g.kind === openKind);
  return (
    <>
      <div className="flex flex-wrap gap-1.5" data-testid="alert-kinds">
        {groups.map((g) => (
          <button
            key={g.kind}
            type="button"
            aria-pressed={openKind === g.kind}
            onClick={() => setOpenKind((k) => (k === g.kind ? null : g.kind))}
            className={cn(
              "inline-flex min-h-8 items-center gap-1.5 rounded-full border bg-white px-2.5 text-[13px] font-medium hover:bg-panel-2",
              SEVERITY_PILL[g.severity],
              openKind === g.kind && "bg-panel-2 ring-1 ring-lime-deep",
            )}
          >
            <span className="font-mono text-[14px] font-bold">
              {g.items.length}
            </span>
            {t.alerts.kind[g.kind]}
          </button>
        ))}
      </div>
      {open && (
        <ul className="mt-2 border-t border-panel-line">
          {open.items.map((alert, i) => (
            <li key={`${alert.kind}-${alert.reservationId ?? i}`}>
              <AlertRow alert={alert} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** 21/10/2026 (B): in the prospects' demo, what to try first in this role. */
function DemoTryCard({ role }: { role: string }) {
  const body = fr.demo.tryBody[role] ?? fr.demo.tryBody.manager;
  const link = fr.demo.tryLink[role] ?? fr.demo.tryLink.manager;
  return (
    <div
      data-testid="demo-try"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-lime-ink px-4 py-3 text-white"
    >
      <div className="min-w-0 flex-1">
        <strong className="block text-sm">{fr.demo.tryTitle}</strong>
        <span className="block text-[13px] text-[#D6E9D9]">{body}</span>
      </div>
      <Link
        to={link.to}
        className="flex min-h-11 items-center rounded-lg bg-lime px-3 text-sm font-semibold text-lime-ink"
      >
        {link.label}
      </Link>
    </div>
  );
}

/**
 * « Les compléter » (21/10/2026, choice C): the bookings without a price nearest to today, their amount typed here; the
 * others in the list's « Sans prix » filter.
 */
function NoPricePanel({
  noPrice,
}: {
  noPrice: NonNullable<Dashboard["noPrice"]>;
}) {
  const n = fr.noPrice;
  return (
    <Panel
      title={n.cardTitle(noPrice.count)}
      aside={<Badge tone="warn">{fr.dashboard.alerts.severity.todo}</Badge>}
    >
      <ul data-testid="no-price-card">
        {noPrice.next.map((b) => (
          <li
            key={b.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-panel-line py-2.5 first:border-t-0"
          >
            <CardButton
              id={b.id}
              className="min-w-0 flex-[1_1_12rem] text-left hover:underline"
            >
              <span className="block truncate text-[15px] font-semibold">
                {b.customerName}
              </span>
              <span className="block truncate font-mono text-xs text-muted-foreground">
                {b.reference} · {b.detail ?? fr.channels[b.channel]} ·{" "}
                {dateTimeShort(b.arrivalAt)}
              </span>
            </CardButton>
            <QuickPrice id={b.id} reference={b.reference} />
          </li>
        ))}
      </ul>
      <Link
        to="/reservations?sansprix=1"
        className="mt-2 inline-block text-sm font-semibold text-lime-deep hover:underline"
      >
        {n.cardAll(noPrice.count)}
      </Link>
    </Panel>
  );
}

/** C-A (06/10/2026): a booking anywhere on the home opens its operational card. */
function CardButton({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const card = useQuickCard();
  return (
    <button type="button" onClick={() => card.open(id)} className={className}>
      {children}
    </button>
  );
}

function Panel({
  title,
  sub,
  aside,
  children,
  className,
}: {
  title: string;
  sub?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-panel-line bg-panel p-3.5",
        className,
      )}
    >
      <header className="mb-3 flex items-start gap-3">
        <span className="min-w-0">
          <h2 className="font-mono text-[19px] font-medium leading-tight">
            {title}
          </h2>
          {sub && (
            <span className="block font-mono text-xs text-muted-foreground">
              {sub}
            </span>
          )}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-2">
          {aside}
        </span>
      </header>
      {children}
    </section>
  );
}

function LivePanel({
  live,
  parkingName,
}: {
  live: LiveShuttles | undefined;
  parkingName: string;
}) {
  const m = t.map;
  return (
    <section
      aria-label={m.title}
      className="relative min-h-[420px] overflow-hidden rounded-xl border border-panel-line bg-[#E6E8E4] lg:h-full"
    >
      <div className="absolute inset-0">
        {live ? (
          <Suspense
            fallback={<Skeleton className="h-full w-full rounded-none" />}
          >
            <LiveShuttlesMap live={live} />
          </Suspense>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
        {m.title} · {parkingName}
      </span>
      <Link
        to="/planning"
        className="absolute right-3 top-3 rounded-full border border-panel-line bg-panel px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-panel-2"
      >
        {m.open}
      </Link>
      <ul className="absolute bottom-3 left-3 right-3 flex flex-col gap-1.5">
        {live && live.trips.length === 0 && (
          <li className="w-fit rounded-full border border-panel-line bg-panel px-3 py-1.5 font-mono text-xs text-foreground">
            {m.none}
          </li>
        )}
        {live?.trips.map((trip, i) => (
          <li
            key={trip.id}
            className="flex w-fit max-w-full items-center gap-2 rounded-full border border-panel-line bg-panel px-3 py-1.5 font-mono text-xs"
          >
            <BusFront
              className="h-3.5 w-3.5 shrink-0 text-lime-deep"
              aria-hidden="true"
            />
            <b className="font-medium">{String(i + 1).padStart(2, "0")}</b>
            <span>{trip.driverName}</span>
            <span className="text-muted-foreground">
              {m.direction[trip.direction]}
            </span>
            <span className="truncate text-muted-foreground">
              ·{" "}
              {trip.toStop && trip.stop
                ? m.toStop(trip.stop.name, trip.toStop.etaMinutes)
                : trip.toParking
                  ? m.toParking(trip.toParking.etaMinutes)
                  : m.noPosition}
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
  const dashboard = useQuery({
    queryKey: ["dashboard"],
    queryFn: adminApi.getDashboard,
    refetchInterval: DASHBOARD_POLL_MS,
  });
  const live = useQuery({
    queryKey: ["shuttle-live"],
    queryFn: adminApi.getLiveShuttles,
    refetchInterval: LIVE_POLL_MS,
  });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  if (dashboard.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-bad bg-bad-soft px-4 py-3 text-bad-text"
      >
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
  const urgent = d.alerts.filter((a) => a.severity === "urgent").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 font-mono text-[13px] text-muted-foreground">
        <h1 className="font-sans text-2xl font-bold uppercase tracking-wide text-foreground">
          {t.hello(user?.firstName || (user?.name?.split(" ")[0] ?? ""))}
        </h1>
        <span>/</span>
        <span>{d.parking.name}</span>
        <span>/</span>
        <b className="font-medium text-foreground">{longDate(d.date)}</b>
        <span className="ml-auto rounded-full border border-panel-line bg-panel px-3 py-1.5 text-xs">
          {t.refreshed(timeAgo(d.serverTime, now))}
        </span>
      </div>

      {user?.demo && <DemoTryCard role={user.effectivePost ?? user.role} />}

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-5">
        <Kpi
          testId="kpi-on-site"
          label={k.onSite}
          value={d.counts.onSite}
          sub={
            d.parking.storedInFiles && d.breakdown.movesToday !== undefined
              ? k.movesSub(d.breakdown.movesToday)
              : k.onSiteSub(d.counts.freeSpots, d.parking.plannedSpots)
          }
          to="/parking/occupation"
          icon={SquareParking}
        />
        <Kpi
          testId="kpi-arrivals"
          label={k.arrivals}
          value={d.counts.arrivalsToday}
          sub={k.arrivalsSub(d.counts.arrivedToday, d.counts.arrivalsToday)}
          to="/planning"
          icon={ArrowDownToLine}
        />
        <Kpi
          testId="kpi-returns"
          label={k.returns}
          value={d.counts.returnsToday}
          sub={k.returnsSub(d.breakdown.returnsThisWeek)}
          to="/planning"
          icon={ArrowUpFromLine}
        />
        <Kpi
          testId="kpi-shuttles"
          label={k.shuttles}
          value={d.counts.shuttlesRunning}
          sub={
            d.nextWave
              ? k.nextWave(
                  timeOf(d.nextWave.leaveAt),
                  d.nextWave.passengers,
                  d.nextWave.vehiclesNeeded,
                )
              : k.shuttlesSub(d.counts.shuttlesRunning)
          }
          to="/navettes"
          icon={BusFront}
          alert={(d.nextWave?.vehiclesNeeded ?? 1) > 1}
        />
        <Kpi
          testId="kpi-to-treat"
          label={k.toTreat}
          value={d.counts.toTreat}
          sub={
            d.noPrice?.count
              ? fr.noPrice.toTreatSub(k.toTreatSub(urgent), d.noPrice.count)
              : k.toTreatSub(urgent)
          }
          to="/"
          icon={TriangleAlert}
          alert={urgent > 0}
        />
        <RevenueTile />
      </div>

      <ServicesStrip services={d.services} />

      <div className="grid gap-3 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-3">
          <Panel
            title={t.alerts.title}
            aside={
              urgent > 0 ? (
                <Badge tone="bad">{t.alerts.urgentCount(urgent)}</Badge>
              ) : d.alerts.length > 0 ? (
                <Badge tone="line">{d.alerts.length}</Badge>
              ) : null
            }
          >
            {d.alerts.length === 0 ? (
              <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
                <StatusPill tone="ok">{t.services.ok}</StatusPill>
                {t.alerts.empty}
              </p>
            ) : (
              <AlertList alerts={d.alerts} />
            )}
          </Panel>
          {d.noPrice && d.noPrice.count > 0 && (
            <NoPricePanel noPrice={d.noPrice} />
          )}
          <Panel
            title={t.vehicles.title}
            sub={t.refreshed(timeAgo(d.serverTime, now))}
            aside={
              <Badge tone="line">{t.vehicles.count(d.vehicles.length)}</Badge>
            }
          >
            {d.vehicles.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                {t.vehicles.empty}
              </p>
            ) : (
              <VehiclesTable vehicles={d.vehicles} />
            )}
          </Panel>
        </div>
        <LivePanel live={live.data} parkingName={d.parking.name} />
      </div>
    </div>
  );
}
