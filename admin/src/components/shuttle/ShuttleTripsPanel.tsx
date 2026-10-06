import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, BusFront, Check, CircleCheck, Circle, Info, MapPin, Navigation, TrainFront, Plane } from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { timeAgo, timeOf } from "@/lib/datetime";
import { describeError, shuttleTripsFr as t } from "@/lib/fr";
import { can } from "@/lib/roles";
import type { DepartureRow, LiveShuttles, LiveTrip, PickupRow, ShuttleDirection, ShuttleStop, ShuttleVehicle, StaffTrip } from "@/lib/types";
import { cn } from "@/lib/utils";

const LiveShuttlesMap = lazy(() => import("@/components/dashboard/LiveShuttlesMap"));

const LIVE_POLL_MS = 12_000;
const LIST_POLL_MS = 30_000;
/** The server accepts one position every 10 s. */
const POSITION_MIN_INTERVAL_MS = 10_000;

/** The vehicle chosen for the next trip: one of the operator's, or a free description. */
type VehicleChoice = { kind: "known"; id: string } | { kind: "free"; model: string; colour: string; plate: string };

const vehicleLabel = (v: { model: string | null; colour: string | null; plate: string | null }) => [v.model, v.colour, v.plate].filter(Boolean).join(" · ");

function StopIcon({ stop, className }: { stop: ShuttleStop; className?: string }) {
  const IconC = stop.kind === "airport" ? Plane : stop.kind === "station" ? TrainFront : MapPin;
  return <IconC className={className} aria-hidden="true" />;
}

/** "Atterri 10:02 · en chemin" and the like: the badge of a traveller to pick up. */
function pickupBadge(row: PickupRow, onTrip: boolean): { tone: BadgeTone; text: string } {
  const b = t.start.badge;
  if (onTrip || row.tripId) return { tone: "info", text: b.onTrip };
  if (row.atMeetingPointAt) return { tone: "ok", text: b.atPoint(timeOf(row.atMeetingPointAt)) };
  const f = row.flight;
  const expected = f.landedAt ?? f.estimatedAt ?? f.scheduledAt ?? row.returnAt;
  if (f.status === "landed") return { tone: "accent", text: b.landed(timeOf(expected)) };
  if (f.status === "cancelled" || f.status === "diverted") return { tone: "bad", text: b.cancelled };
  if (!f.number) return { tone: "line", text: b.returnAt(timeOf(row.returnAt)) };
  if (f.status === "delayed") return { tone: "warn", text: b.delayed(timeOf(expected)) };
  return { tone: "line", text: b.planned(timeOf(expected)) };
}

/** The team's running shuttles: the live map and one line per trip, with "Terminer" for whoever may close it. */
function LiveTrips({ live, now, canEnd, onEnd, ending }: { live: LiveShuttles | undefined; now: number; canEnd: (trip: LiveTrip) => boolean; onEnd: (trip: LiveTrip) => void; ending: boolean }) {
  const l = t.live;
  return (
    <section aria-label={l.title} data-testid="live-trips" className="overflow-hidden rounded-xl border border-panel-line bg-panel">
      <div className="relative h-64 bg-[#E6E8E4]">
        {live ? (
          <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
            <LiveShuttlesMap live={live} />
          </Suspense>
        ) : (
          <Skeleton className="h-full w-full rounded-none" />
        )}
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-primary px-3 py-1.5 text-[13px] font-semibold text-primary-foreground">
          {l.title}
          {live ? ` · ${live.trips.length}` : ""}
        </span>
      </div>
      <ul className="divide-y divide-panel-line">
        {live && live.trips.length === 0 && <li className="px-3.5 py-3 text-[13px] text-muted-foreground">{l.none}</li>}
        {live?.trips.map((trip, i) => (
          <li key={trip.id} data-testid="live-trip" className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 font-mono text-xs">
            <BusFront className="h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
            <b className="font-medium">{String(i + 1).padStart(2, "0")}</b>
            <span className="text-[13px] font-sans font-semibold">{trip.driverName}</span>
            <span className="text-muted-foreground">{t.start.direction[trip.direction]}</span>
            <span className="text-muted-foreground">· {l.passengers(trip.passengers)}</span>
            <span className="text-muted-foreground">· {l.since(timeOf(trip.startedAt))}</span>
            <span className="text-muted-foreground">
              · {trip.toStop && trip.stop ? l.toStop(trip.stop.name, trip.toStop.etaMinutes) : trip.toParking ? l.toParking(trip.toParking.etaMinutes) : l.noPosition}
              {trip.positionAgeSeconds !== null && ` (${timeAgo(new Date(now - trip.positionAgeSeconds * 1000).toISOString(), now)})`}
            </span>
            {canEnd(trip) && (
              <button
                type="button"
                disabled={ending}
                onClick={() => onEnd(trip)}
                className="ml-auto rounded-full border border-panel-line px-3 py-1 font-sans text-xs font-semibold text-lime-deep hover:bg-panel-2 disabled:opacity-50"
              >
                {l.end}
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Shares the browser's position with the server while the trip runs (one fix every 10 s at most). */
function useTripPosition(trip: StaffTrip | null, onProblem: (code: "denied" | "unavailable" | null) => void) {
  const lastSentAt = useRef(0);
  const tripId = trip?.status === "running" ? trip.id : null;
  useEffect(() => {
    if (!tripId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onProblem("unavailable");
      return;
    }
    onProblem(null);
    const watch = navigator.geolocation.watchPosition(
      position => {
        const at = Date.now();
        if (at - lastSentAt.current < POSITION_MIN_INTERVAL_MS) return;
        lastSentAt.current = at;
        adminApi
          .sendTripPosition(tripId, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Number.isFinite(position.coords.accuracy) ? Math.round(position.coords.accuracy) : null,
            recordedAt: new Date(position.timestamp || at).toISOString(),
          })
          .catch(() => undefined);
      },
      error => onProblem(error.code === error.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [tripId, onProblem]);
}

/** "En route vers l'aéroport · position partagée": the driver's own running trip. */
function RunningCard({ trip, now, onEnd, ending, problem }: { trip: StaffTrip; now: number; onEnd: () => void; ending: boolean; problem: "denied" | "unavailable" | null }) {
  const r = t.running;
  const left = Math.max(0, Math.round((new Date(trip.expiresAt).getTime() - now) / 60000));
  const vehicle = vehicleLabel(trip.vehicle);
  return (
    <section data-testid="trip-running" className="rounded-xl border-2 border-primary bg-panel p-3.5">
      <p className="flex items-center gap-2 text-[15px] font-semibold text-lime-deep">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        {trip.direction === "dropoff" ? r.dropoff : r.pickup}
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {trip.stop && !trip.stop.builtIn && <>{r.stop(trip.stop.name)} · </>}
        {vehicle && <>{r.vehicle(vehicle)} · </>}
        {r.passengers(trip.passengers.length)} · {r.left(left)}
      </p>
      {problem === "denied" && <p className="mt-2 rounded-lg border border-bad bg-bad-soft px-3 py-2 text-[13px] text-bad-text">{r.locationDenied}</p>}
      {problem === "unavailable" && <p className="mt-2 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-[13px] text-warn-text">{r.noGeolocation}</p>}
      <ul className="mt-2.5 divide-y divide-panel-line">
        {trip.passengers.map(p => (
          <li key={p.reservationId} className="flex items-center gap-3 py-1.5 text-[14px]">
            <Link to={`/reservations/${p.reservationId}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
              {p.customerName} <span className="text-muted-foreground">· {t.start.pax(p.passengers)}</span>
            </Link>
            {p.terminal && <span className="font-mono text-xs text-muted-foreground">{p.terminal}</span>}
            <Plate value={p.plate} size="sm" />
          </li>
        ))}
      </ul>
      <button
        type="button"
        data-testid="end-trip"
        disabled={ending}
        onClick={onEnd}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-lime-deep font-semibold text-lime-deep hover:bg-panel-2 disabled:opacity-50"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {trip.direction === "dropoff" ? r.endDropoff : r.endPickup}
      </button>
    </section>
  );
}

function VehiclePicker({ vehicles, choice, onChange, passengers }: { vehicles: ShuttleVehicle[]; choice: VehicleChoice | null; onChange: (c: VehicleChoice | null) => void; passengers: number }) {
  const s = t.start;
  const free = choice?.kind === "free" ? choice : null;
  const known = choice?.kind === "known" ? vehicles.find(v => v.id === choice.id) : undefined;
  const tooMany = known?.seats !== null && known?.seats !== undefined && passengers > known.seats;
  return (
    <div data-testid="vehicle-picker" className="rounded-xl border border-panel-line bg-panel p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.vehicle}</p>
      <div className="flex flex-wrap gap-1.5">
        {vehicles.map(v => {
          const selected = choice?.kind === "known" && choice.id === v.id;
          return (
            <button
              key={v.id}
              type="button"
              disabled={!v.inService}
              aria-pressed={selected}
              onClick={() => onChange({ kind: "known", id: v.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] font-semibold disabled:opacity-40",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel hover:bg-panel-2",
              )}
            >
              {v.model}
              {v.colour ? ` ${v.colour}` : ""}
              <span className="ml-1.5 font-mono text-[11px] font-normal opacity-80">{!v.inService ? s.vehicleOut : v.seats !== null ? s.vehicleSeats(v.seats) : ""}</span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={!!free}
          onClick={() => onChange(free ?? { kind: "free", model: "", colour: "", plate: "" })}
          className={cn("rounded-full border px-3 py-1.5 text-[13px] font-semibold", free ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel hover:bg-panel-2")}
        >
          {s.vehicleFree}
        </button>
      </div>
      {free && (
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input aria-label={s.vehicleModel} placeholder={s.vehicleModel} value={free.model} onChange={e => onChange({ ...free, model: e.target.value })} className="h-10 rounded-lg border border-panel-line bg-background px-3 text-sm" />
          <input aria-label={s.vehicleColour} placeholder={s.vehicleColour} value={free.colour} onChange={e => onChange({ ...free, colour: e.target.value })} className="h-10 rounded-lg border border-panel-line bg-background px-3 text-sm" />
          <input aria-label={s.vehiclePlate} placeholder={s.vehiclePlate} value={free.plate} onChange={e => onChange({ ...free, plate: e.target.value })} className="h-10 rounded-lg border border-panel-line bg-background px-3 font-mono text-sm uppercase" />
        </div>
      )}
      {tooMany && known && <p className="mt-2 text-[13px] text-bad-text">{s.tooMany(passengers, known.seats!)}</p>}
      <p className="mt-2 text-xs text-muted-foreground">{s.vehicleHelp}</p>
    </div>
  );
}

/** The small "fiche" button on a tile (C-A): phone, flight, spot, next gesture. */
function CardLink({ id }: { id: string }) {
  const card = useQuickCard();
  return (
    <button type="button" aria-label={t.card} title={t.card} onClick={() => card.open(id)} className="rounded-full border border-panel-line p-1.5 text-lime-deep hover:bg-panel-2">
      <Info className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function PickupTile({ row, selected, onTrip, selectable, onToggle }: { row: PickupRow; selected: boolean; onTrip: boolean; selectable: boolean; onToggle: () => void }) {
  const s = t.start;
  const badge = pickupBadge(row, onTrip);
  const f = row.flight;
  const details = [f.gate ? s.gate(f.gate) : null, f.number ? s.flight(f.number) : null].filter(Boolean).join(" · ");
  return (
    <li
      data-testid="pickup-row"
      aria-selected={selected}
      className={cn("flex items-center gap-1 rounded-xl border bg-panel pr-2", selected || onTrip ? "border-2 border-primary" : "border-panel-line")}
    >
      <button type="button" disabled={!selectable} onClick={onToggle} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left disabled:cursor-default">
        {selectable && (selected ? <CircleCheck className="h-5 w-5 text-lime-deep" aria-hidden="true" /> : <Circle className="h-5 w-5 text-panel-line" aria-hidden="true" />)}
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
          {row.customerName} <span className="font-normal text-muted-foreground">· {s.pax(row.passengers)}</span>
        </span>
        <Badge tone={badge.tone}>{badge.text}</Badge>
        {details && <span className="font-mono text-xs text-muted-foreground">{details}</span>}
        <Plate value={row.plate} size="sm" />
      </button>
      <CardLink id={row.reservationId} />
    </li>
  );
}

function DepartureTile({ row, selected, onTrip, selectable, onToggle }: { row: DepartureRow; selected: boolean; onTrip: boolean; selectable: boolean; onToggle: () => void }) {
  const s = t.start;
  const details = [row.arrivedAt ? s.arrivedAt(timeOf(row.arrivedAt)) : s.arrivalPlanned(timeOf(row.arrivalAt)), row.spot ? s.spot(row.spot) : null].filter(Boolean).join(" · ");
  return (
    <li data-testid="departure-row" aria-selected={selected} className={cn("flex items-center gap-1 rounded-xl border bg-panel pr-2", selected || onTrip ? "border-2 border-primary" : "border-panel-line")}>
      <button type="button" disabled={!selectable} onClick={onToggle} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left disabled:cursor-default">
        {selectable && (selected ? <CircleCheck className="h-5 w-5 text-lime-deep" aria-hidden="true" /> : <Circle className="h-5 w-5 text-panel-line" aria-hidden="true" />)}
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
          {row.customerName} <span className="font-normal text-muted-foreground">· {s.pax(row.passengers)}</span>
        </span>
        {(onTrip || row.tripId) && <Badge tone="info">{s.badge.onTrip}</Badge>}
        <span className="font-mono text-xs text-muted-foreground">{details}</span>
        <Plate value={row.plate} size="sm" />
      </button>
      <CardLink id={row.reservationId} />
    </li>
  );
}

/**
 * The driver's screen on the web (06/10/2026), the same as the Navette tab of Plazo Pro: the team's
 * shuttles on the road, my trip in progress (position shared by the browser), and "Démarrer un
 * trajet" for the returns to fetch at the airport or the arrived travellers to drop at the terminal.
 */
export default function ShuttleTripsPanel() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mayDrive = can(user?.role, "reservations:status");
  const mayManage = can(user?.role, "reservations:manage");
  const [now, setNow] = useState(() => Date.now());
  // Opened from a booking's card (C-A): "?sens=dropoff&reservation=…" preselects the side and the traveller.
  const [params, setParams] = useSearchParams();
  const wantedSide = params.get("sens");
  const wanted = params.get("reservation");
  const [direction, setDirection] = useState<ShuttleDirection>(wantedSide === "dropoff" ? "dropoff" : "pickup");
  const [stopId, setStopId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<VehicleChoice | null>(() => (user?.vehicle ? { kind: "known", id: user.vehicle.id } : null));
  const [endedNotice, setEndedNotice] = useState(false);
  const [problem, setProblem] = useState<"denied" | "unavailable" | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const live = useQuery({ queryKey: ["shuttle-live"], queryFn: adminApi.getLiveShuttles, refetchInterval: LIVE_POLL_MS });
  const current = useQuery({ queryKey: ["shuttle-current"], queryFn: adminApi.getCurrentTrip, enabled: mayDrive, refetchInterval: LIST_POLL_MS });
  const pickups = useQuery({ queryKey: ["shuttle-pickups"], queryFn: adminApi.getPickups, enabled: mayDrive && direction === "pickup", refetchInterval: LIST_POLL_MS });
  const departures = useQuery({ queryKey: ["shuttle-departures"], queryFn: adminApi.getDepartures, enabled: mayDrive && direction === "dropoff", refetchInterval: LIST_POLL_MS });
  const vehicles = useQuery({ queryKey: ["shuttle-vehicles"], queryFn: adminApi.getVehicles, enabled: mayDrive });
  const stops = useQuery({ queryKey: ["shuttle-stops"], queryFn: adminApi.getStops, enabled: mayDrive });

  const trip = current.data?.trip ?? null;
  const running = trip?.status === "running";
  const offeredIds = (direction === "pickup" ? (pickups.data?.rows ?? []) : (departures.data?.rows ?? [])).filter(r => !r.tripId).map(r => r.reservationId);
  useEffect(() => {
    if (!wanted || running || !offeredIds.includes(wanted)) return;
    setSelected(list => (list.includes(wanted) ? list : [...list, wanted]));
    setParams(p => {
      p.delete("reservation");
      p.delete("sens");
      return p;
    }, { replace: true });
    // The offered list is what decides; the params are consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wanted, running, offeredIds.join(",")]);
  useTripPosition(trip, setProblem);

  const refresh = (withCurrent = true) => {
    void queryClient.invalidateQueries({ queryKey: ["shuttle-live"] });
    if (withCurrent) void queryClient.invalidateQueries({ queryKey: ["shuttle-current"] });
    void queryClient.invalidateQueries({ queryKey: ["shuttle-pickups"] });
    void queryClient.invalidateQueries({ queryKey: ["shuttle-departures"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const start = useMutation({
    mutationFn: () =>
      adminApi.startTrip({
        reservationIds: selected,
        direction,
        stopId,
        vehicleId: vehicle?.kind === "known" ? vehicle.id : null,
        vehicle: vehicle?.kind === "free" && vehicle.model.trim() ? { model: vehicle.model.trim(), colour: vehicle.colour.trim() || null, plate: vehicle.plate.trim() || null } : null,
      }),
    onSuccess: ({ trip }) => {
      // The started trip is the answer itself: no refetch of "current" that could race it.
      queryClient.setQueryData(["shuttle-current"], { trip });
      setSelected([]);
      setEndedNotice(false);
      refresh(false);
    },
    onError: error => toast.error(describeError(error)),
  });
  const end = useMutation({
    mutationFn: (tripId: string) => adminApi.endTrip(tripId),
    onSuccess: ({ trip: ended }) => {
      const mine = ended.driverId === user?.id;
      if (mine) {
        queryClient.setQueryData(["shuttle-current"], { trip: null });
        setEndedNotice(true);
      }
      refresh(!mine);
    },
    onError: error => toast.error(describeError(error)),
  });

  const stopList = stops.data?.data ?? [];
  const chosenStop = stopList.find(s => s.id === stopId) ?? null;
  const vehicleList = vehicles.data?.data ?? [];
  const rows: (PickupRow | DepartureRow)[] = direction === "pickup" ? (pickups.data?.rows ?? []) : (departures.data?.rows ?? []);
  const selectedPassengers = rows.filter(r => selected.includes(r.reservationId)).reduce((sum, r) => sum + r.passengers, 0);
  const groups = useMemo(() => {
    if (direction !== "pickup") return [];
    const map = new Map<string, PickupRow[]>();
    for (const row of pickups.data?.rows ?? []) {
      const key = row.terminal ?? t.start.noTerminal;
      map.set(key, [...(map.get(key) ?? []), row]);
    }
    return [...map.entries()];
  }, [direction, pickups.data]);
  const listError = direction === "pickup" ? pickups.error : departures.error;
  const listLoading = direction === "pickup" ? pickups.isPending : departures.isPending;

  const toggle = (id: string) => setSelected(list => (list.includes(id) ? list.filter(x => x !== id) : [...list, id]));
  const onEndLive = (lt: LiveTrip) => {
    if (lt.driverId !== user?.id && !window.confirm(t.live.endConfirm(lt.driverName))) return;
    end.mutate(lt.id);
  };
  const s = t.start;

  return (
    <div className="space-y-3">
      <LiveTrips live={live.data} now={now} canEnd={lt => lt.driverId === user?.id || mayManage} onEnd={onEndLive} ending={end.isPending} />

      {!mayDrive ? (
        <p className="rounded-xl border border-panel-line bg-panel p-3.5 text-[13px] text-muted-foreground">{s.needsStatus}</p>
      ) : (
        <section aria-label={s.title} data-testid="start-trip" className="space-y-3">
          {running && trip ? (
            <RunningCard trip={trip} now={now} onEnd={() => end.mutate(trip.id)} ending={end.isPending} problem={problem} />
          ) : (
            <h2 className="flex items-center gap-2 px-1 font-mono text-[19px] font-medium">
              <Navigation className="h-5 w-5 text-lime-deep" aria-hidden="true" />
              {s.title}
            </h2>
          )}
          {endedNotice && (
            <p role="status" className="flex items-center gap-3 rounded-xl border border-panel-line bg-panel px-3.5 py-2.5 text-[13px]">
              <span className="flex-1">{t.running.ended}</span>
              <button type="button" onClick={() => setEndedNotice(false)} className="text-xs font-semibold text-muted-foreground hover:underline">
                OK
              </button>
            </p>
          )}
          {!running && <p className="px-1 text-[13px] text-muted-foreground">{direction === "dropoff" ? s.introDropoff : s.introPickup}</p>}

          <div className="flex flex-wrap items-center gap-2 px-1" role="tablist">
            {(["pickup", "dropoff"] as const).map(d => {
              const IconC = d === "pickup" ? ArrowDownToLine : ArrowUpFromLine;
              return (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={direction === d}
                  disabled={running}
                  onClick={() => {
                    setDirection(d);
                    setSelected([]);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold disabled:opacity-60",
                    direction === d ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel text-muted-foreground hover:bg-panel-2",
                  )}
                >
                  <IconC className="h-4 w-4" aria-hidden="true" />
                  {s.direction[d]}
                </button>
              );
            })}
            {stopList.length > 1 && (
              <span className="ml-auto flex flex-wrap items-center gap-1.5" data-testid="stop-choice">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.stop}</span>
                {stopList.map(stop => {
                  const selectedStop = stop.id === stopId;
                  return (
                    <button
                      key={stop.id ?? "airport"}
                      type="button"
                      aria-pressed={selectedStop}
                      disabled={running}
                      onClick={() => setStopId(stop.id)}
                      className={cn(
                        "flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-xs font-semibold disabled:opacity-60",
                        selectedStop ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel hover:bg-panel-2",
                      )}
                    >
                      <StopIcon stop={stop} className="h-3.5 w-3.5" />
                      {stop.builtIn ? s.airport : stop.name}
                    </button>
                  );
                })}
              </span>
            )}
          </div>

          {direction === "pickup" && (
            <p className="flex items-start gap-1.5 px-1 text-[13px]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
              <span>
                {chosenStop && !chosenStop.builtIn ? (
                  <>
                    <b>{t.running.stop(chosenStop.name)}</b>
                    {chosenStop.instructions && <span className="block text-muted-foreground">{chosenStop.instructions}</span>}
                  </>
                ) : pickups.data?.meetingPoint?.label ? (
                  <b>{s.meetingPoint(pickups.data.meetingPoint.label)}</b>
                ) : (
                  <span className="text-muted-foreground">{s.meetingPointNone}</span>
                )}
              </span>
            </p>
          )}

          {listError ? (
            <p className="rounded-xl border border-bad bg-bad-soft p-3 text-sm text-bad-text">{describeError(listError) || s.loadError}</p>
          ) : listLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : direction === "pickup" ? (
            groups.length === 0 ? (
              <p className="rounded-xl border border-panel-line bg-panel p-4 text-sm text-muted-foreground">{s.emptyPickup}</p>
            ) : (
              groups.map(([terminal, list]) => (
                <div key={terminal}>
                  <h3 className="mb-1.5 px-1 font-mono text-[15px] font-medium">{s.toPickUp(terminal)}</h3>
                  <ul className="space-y-1.5">
                    {list.map(row => (
                      <PickupTile
                        key={row.reservationId}
                        row={row}
                        selected={selected.includes(row.reservationId)}
                        onTrip={!!running && !!trip?.passengers.some(p => p.reservationId === row.reservationId)}
                        selectable={!running && !row.tripId}
                        onToggle={() => toggle(row.reservationId)}
                      />
                    ))}
                  </ul>
                </div>
              ))
            )
          ) : rows.length === 0 ? (
            <p className="rounded-xl border border-panel-line bg-panel p-4 text-sm text-muted-foreground">{s.emptyDropoff}</p>
          ) : (
            <div>
              <h3 className="mb-1.5 px-1 font-mono text-[15px] font-medium">{s.toDropOff}</h3>
              <ul className="space-y-1.5">
                {(rows as DepartureRow[]).map(row => (
                  <DepartureTile
                    key={row.reservationId}
                    row={row}
                    selected={selected.includes(row.reservationId)}
                    onTrip={!!running && !!trip?.passengers.some(p => p.reservationId === row.reservationId)}
                    selectable={!running && !row.tripId}
                    onToggle={() => toggle(row.reservationId)}
                  />
                ))}
              </ul>
            </div>
          )}

          {!running && selected.length > 0 && (
            <>
              <VehiclePicker vehicles={vehicleList} choice={vehicle} onChange={setVehicle} passengers={selectedPassengers} />
              <button
                type="button"
                data-testid="start-trip-button"
                disabled={start.isPending}
                onClick={() => start.mutate()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                <BusFront className="h-5 w-5" aria-hidden="true" />
                {start.isPending ? s.starting : direction === "dropoff" ? s.dropoff(selected.length) : s.pickup(selected.length)}
              </button>
            </>
          )}
          {!running && selected.length === 0 && rows.length > 0 && <p className="px-1 text-center text-[13px] text-muted-foreground">{s.none}</p>}
        </section>
      )}
    </div>
  );
}
