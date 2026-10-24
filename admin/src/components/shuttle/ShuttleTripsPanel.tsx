import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  BusFront,
  Check,
  CircleCheck,
  Circle,
  Info,
  MapPin,
  Navigation,
} from "lucide-react";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/components/ui/confirm-context";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { ChildSeatIcon } from "@/components/ChildSeatIcon";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { canBoardDropoff, departureRowOf } from "@/lib/boarding";
import {
  CHILD_SEAT_KINDS,
  type ChildSeats,
  childSeatBadge,
  childSeatsLoadLine,
  childSeatsTotal,
  hasChildSeats,
  sumChildSeats,
} from "@/lib/child-seats";
import { timeAgo, timeOf } from "@/lib/datetime";
import { describeError, errorMessage, fr, shuttleTripsFr as t } from "@/lib/fr";
import { can } from "@/lib/roles";
import { shuttleTone } from "@/lib/shuttle-icon";
import { ShuttleIcon } from "./ShuttleIcon";
import type {
  DepartureRow,
  LiveShuttles,
  LiveTrip,
  PickupRow,
  Reservation,
  ShuttleDirection,
  ShuttleVehicle,
  StaffTrip,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const LiveShuttlesMap = lazy(
  () => import("@/components/dashboard/LiveShuttlesMap"),
);

const LIVE_POLL_MS = 12_000;
const LIST_POLL_MS = 30_000;
/** The server accepts one position every 10 s. */
const POSITION_MIN_INTERVAL_MS = 10_000;

/** The vehicle chosen for the next trip: one of the operator's, or a free description. */
type VehicleChoice =
  | { kind: "known"; id: string }
  | { kind: "free"; model: string; colour: string; plate: string };

/**
 * B (22/10/2026): the rows by time slot of the planning (15 minutes, from the advised leave time), soonest first, the
 * ones without a time last; each slot keeps its earliest leave time.
 */
function slotsOf<R extends { leaveAt?: string }>(
  rows: R[],
): { key: string; leaveAt: string | null; rows: R[] }[] {
  const map = new Map<string, R[]>();
  for (const row of rows) {
    // Sorts after every date (plain comparison: a collation would put punctuation first).
    let key = "9999-no-time";
    if (row.leaveAt) {
      const d = new Date(row.leaveAt);
      d.setMinutes(d.getMinutes() - (d.getMinutes() % 15), 0, 0);
      key = d.toISOString();
    }
    map.set(key, [...(map.get(key) ?? []), row]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, list]) => ({
      key,
      leaveAt:
        list
          .map((r) => r.leaveAt)
          .filter((x): x is string => !!x)
          .sort()[0] ?? null,
      rows: list,
    }));
}

/**
 * The bookings pinned from « Embarquer », as read (undefined until then), and when each was last read or failed to be
 * (0 until then); each list stays the same while none of its values changes (react-query shares the combined result).
 */
const pinnedOf = (results: UseQueryResult<Reservation>[]) => ({
  bookings: results.map((q) => q.data),
  readAt: results.map((q) => Math.max(q.dataUpdatedAt, q.errorUpdatedAt)),
});

const vehicleLabel = (v: {
  model: string | null;
  colour: string | null;
  plate: string | null;
}) => [v.model, v.colour, v.plate].filter(Boolean).join(" · ");

/** "Atterri 10:02 · en chemin" and the like: the badge of a traveller to pick up. */
function pickupBadge(
  row: PickupRow,
  onTrip: boolean,
): { tone: BadgeTone; text: string } {
  const b = t.start.badge;
  if (onTrip || row.tripId) return { tone: "info", text: b.onTrip };
  if (row.atMeetingPointAt)
    return { tone: "ok", text: b.atPoint(timeOf(row.atMeetingPointAt)) };
  const f = row.flight;
  const expected = f.landedAt ?? f.estimatedAt ?? f.scheduledAt ?? row.returnAt;
  if (f.status === "landed")
    return { tone: "accent", text: b.landed(timeOf(expected)) };
  if (f.status === "cancelled" || f.status === "diverted")
    return { tone: "bad", text: b.cancelled };
  if (!f.number)
    return { tone: "line", text: b.returnAt(timeOf(row.returnAt)) };
  if (f.status === "delayed")
    return { tone: "warn", text: b.delayed(timeOf(expected)) };
  return { tone: "line", text: b.planned(timeOf(expected)) };
}

/** The team's running shuttles: the live map and one line per trip, with "Terminer" for whoever may close it. */
/** « Sièges auto » (24/10/2026): « dont 2 enfants » after the people count. */
function ChildrenCount({ seats }: { seats: ChildSeats | null | undefined }) {
  const n = childSeatsTotal(seats);
  return n > 0 ? <> · {t.start.children(n)}</> : null;
}

/** One green pill per kind of seat to install (« Siège bébé », « 2 réhausseurs »). */
function ChildSeatPills({ seats }: { seats: ChildSeats | null | undefined }) {
  if (!hasChildSeats(seats)) return null;
  return (
    <span data-testid="child-seat-pills" className="inline-flex flex-wrap gap-1">
      {CHILD_SEAT_KINDS.filter((k) => seats![k] > 0).map((k) => (
        <Badge key={k} tone="ok" className="gap-1">
          <ChildSeatIcon className="h-3 w-3" />
          {childSeatBadge(k, seats![k])}
        </Badge>
      ))}
    </span>
  );
}

function LiveTrips({
  live,
  now,
  canEnd,
  onEnd,
  ending,
}: {
  live: LiveShuttles | undefined;
  now: number;
  canEnd: (trip: LiveTrip) => boolean;
  onEnd: (trip: LiveTrip) => void;
  ending: boolean;
}) {
  const l = t.live;
  return (
    <section
      aria-label={l.title}
      data-testid="live-trips"
      className="overflow-hidden rounded-xl border border-panel-line bg-panel"
    >
      <div className="relative h-64 bg-[#E6E8E4]">
        {live ? (
          <Suspense
            fallback={<Skeleton className="h-full w-full rounded-none" />}
          >
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
        {live && live.trips.length === 0 && (
          <li className="px-3.5 py-3 text-[13px] text-muted-foreground">
            {l.none}
          </li>
        )}
        {live?.trips.map((trip, i) => (
          <li
            key={trip.id}
            data-testid="live-trip"
            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2.5 font-mono text-xs"
          >
            <ShuttleIcon
              tone={shuttleTone(trip.direction, !!trip.position)}
              size={18}
            />
            <b className="font-medium">{String(i + 1).padStart(2, "0")}</b>
            <span className="text-[13px] font-sans font-semibold">
              {trip.driverName}
            </span>
            <span className="text-muted-foreground">
              {t.start.direction[trip.direction]}
            </span>
            <span className="text-muted-foreground">
              · {l.passengers(trip.passengers)}
            </span>
            <span className="text-muted-foreground">
              · {l.since(timeOf(trip.startedAt))}
            </span>
            <span className="text-muted-foreground">
              ·{" "}
              {trip.toStop && trip.stop
                ? l.toStop(trip.stop.name, trip.toStop.etaMinutes)
                : trip.toParking
                  ? l.toParking(trip.toParking.etaMinutes)
                  : l.noPosition}
              {trip.positionAgeSeconds !== null &&
                ` (${timeAgo(new Date(now - trip.positionAgeSeconds * 1000).toISOString(), now)})`}
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
function useTripPosition(
  trip: StaffTrip | null,
  onProblem: (code: "denied" | "unavailable" | null) => void,
) {
  const lastSentAt = useRef(0);
  // R-B: a parking that turned the tracking off never asks the browser for its position.
  const tripId =
    trip?.status === "running" && trip.sharePosition !== false ? trip.id : null;
  useEffect(() => {
    if (!tripId) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onProblem("unavailable");
      return;
    }
    onProblem(null);
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const at = Date.now();
        if (at - lastSentAt.current < POSITION_MIN_INTERVAL_MS) return;
        lastSentAt.current = at;
        adminApi
          .sendTripPosition(tripId, {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: Number.isFinite(position.coords.accuracy)
              ? Math.round(position.coords.accuracy)
              : null,
            recordedAt: new Date(position.timestamp || at).toISOString(),
          })
          .catch(() => undefined);
      },
      (error) =>
        onProblem(
          error.code === error.PERMISSION_DENIED ? "denied" : "unavailable",
        ),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [tripId, onProblem]);
}

/** "En route vers l'aéroport · position partagée": the driver's own running trip. */
function RunningCard({
  trip,
  now,
  onEnd,
  ending,
  problem,
}: {
  trip: StaffTrip;
  now: number;
  onEnd: () => void;
  ending: boolean;
  problem: "denied" | "unavailable" | null;
}) {
  const r = t.running;
  const left = Math.max(
    0,
    Math.round((new Date(trip.expiresAt).getTime() - now) / 60000),
  );
  const vehicle = vehicleLabel(trip.vehicle);
  const dropoff = trip.direction === "dropoff";
  // « Embarquer en un geste » (14/10/2026): the cars of the travellers checked in at boarding wait for the valet.
  const checkedIn = dropoff
    ? trip.passengers.filter((p) => p.checkedInAtBoarding).length
    : 0;
  return (
    <section
      data-testid="trip-running"
      className="rounded-xl border-2 border-primary bg-panel p-3.5"
    >
      <p className="flex items-center gap-2 text-[15px] font-semibold text-lime-deep">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
        </span>
        {/* 22/10/2026: the real place (« En route vers Gare TGV »), not « le terminal ». */}
        {(trip.sharePosition === false ? r.toNoShare : r.to)(
          trip.stop && !trip.stop.builtIn ? trip.stop.name : t.start.theAirport,
        )}
      </p>
      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {r.leftAt(timeOf(trip.startedAt))} ·{" "}
        {vehicle && <>{r.vehicle(vehicle)} · </>}
        {(dropoff ? r.peopleGo : r.peopleBack)(
          trip.passengers.reduce((n, p) => n + p.passengers, 0),
        )}{" "}
        · {r.left(left)}
      </p>
      {problem === "denied" && (
        <p className="mt-2 rounded-lg border border-bad bg-bad-soft px-3 py-2 text-[13px] text-bad-text">
          {r.locationDenied}
        </p>
      )}
      {problem === "unavailable" && (
        <p className="mt-2 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-[13px] text-warn-text">
          {r.noGeolocation}
        </p>
      )}
      <ul className="mt-2.5 divide-y divide-panel-line">
        {trip.passengers.map((p) => (
          <li
            key={p.reservationId}
            className="flex items-center gap-3 py-1.5 text-[14px]"
          >
            <Link
              to={`/reservations/${p.reservationId}`}
              className="min-w-0 flex-1 truncate font-medium hover:underline"
            >
              {p.customerName}{" "}
              <span className="text-muted-foreground">
                · {t.start.pax(p.passengers)}
                <ChildrenCount seats={p.childSeats} />
              </span>
            </Link>
            <ChildSeatPills seats={p.childSeats} />
            {p.terminal && (
              <span className="font-mono text-xs text-muted-foreground">
                {p.terminal}
              </span>
            )}
            {dropoff && (
              <Badge tone="ok">
                {p.checkedInAtBoarding && p.arrivedAt
                  ? t.start.onSiteAt(timeOf(p.arrivedAt))
                  : t.start.onSite}
              </Badge>
            )}
            <Plate value={p.plate} size="sm" />
          </li>
        ))}
      </ul>
      {checkedIn > 0 && (
        <p
          data-testid="checked-in-note"
          className="mt-2 rounded-lg bg-warn-soft px-3 py-2 text-[13px] text-warn-text"
        >
          {t.start.checkedInNote(checkedIn)}
        </p>
      )}
      <button
        type="button"
        data-testid="end-trip"
        disabled={ending}
        onClick={onEnd}
        className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-full border border-lime-deep font-semibold text-lime-deep hover:bg-panel-2 disabled:opacity-50"
      >
        <Check className="h-4 w-4" aria-hidden="true" />
        {dropoff ? r.endGo : r.endBack}
      </button>
    </section>
  );
}

function VehiclePicker({
  vehicles,
  choice,
  onChange,
  passengers,
}: {
  vehicles: ShuttleVehicle[];
  choice: VehicleChoice | null;
  onChange: (c: VehicleChoice | null) => void;
  passengers: number;
}) {
  const s = t.start;
  const free = choice?.kind === "free" ? choice : null;
  const known =
    choice?.kind === "known"
      ? vehicles.find((v) => v.id === choice.id)
      : undefined;
  const tooMany =
    known?.seats !== null &&
    known?.seats !== undefined &&
    passengers > known.seats;
  return (
    <div
      data-testid="vehicle-picker"
      className="rounded-xl border border-panel-line bg-panel p-3"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {s.vehicle}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {vehicles.map((v) => {
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
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-panel-line bg-panel hover:bg-panel-2",
              )}
            >
              {v.model}
              {v.colour ? ` ${v.colour}` : ""}
              <span className="ml-1.5 font-mono text-[11px] font-normal opacity-80">
                {!v.inService
                  ? s.vehicleOut
                  : v.seats !== null
                    ? s.vehicleSeats(v.seats)
                    : ""}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={!!free}
          onClick={() =>
            onChange(free ?? { kind: "free", model: "", colour: "", plate: "" })
          }
          className={cn(
            "rounded-full border px-3 py-1.5 text-[13px] font-semibold",
            free
              ? "border-primary bg-primary text-primary-foreground"
              : "border-panel-line bg-panel hover:bg-panel-2",
          )}
        >
          {s.vehicleFree}
        </button>
      </div>
      {free && (
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <input
            aria-label={s.vehicleModel}
            placeholder={s.vehicleModel}
            value={free.model}
            onChange={(e) => onChange({ ...free, model: e.target.value })}
            className="h-10 rounded-lg border border-panel-line bg-background px-3 text-sm"
          />
          <input
            aria-label={s.vehicleColour}
            placeholder={s.vehicleColour}
            value={free.colour}
            onChange={(e) => onChange({ ...free, colour: e.target.value })}
            className="h-10 rounded-lg border border-panel-line bg-background px-3 text-sm"
          />
          <input
            aria-label={s.vehiclePlate}
            placeholder={s.vehiclePlate}
            value={free.plate}
            onChange={(e) => onChange({ ...free, plate: e.target.value })}
            className="h-10 rounded-lg border border-panel-line bg-background px-3 font-mono text-sm uppercase"
          />
        </div>
      )}
      {tooMany && known && (
        <p className="mt-2 text-[13px] text-bad-text">
          {s.tooMany(passengers, known.seats!)}
        </p>
      )}
      <p className="mt-2 text-xs text-muted-foreground">{s.vehicleHelp}</p>
    </div>
  );
}

/** The small "fiche" button on a tile (C-A): phone, flight, spot, next gesture. */
function CardLink({ id }: { id: string }) {
  const card = useQuickCard();
  return (
    <button
      type="button"
      aria-label={t.card}
      title={t.card}
      onClick={() => card.open(id)}
      className="rounded-full border border-panel-line p-1.5 text-lime-deep hover:bg-panel-2"
    >
      <Info className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function PickupTile({
  row,
  selected,
  onTrip,
  selectable,
  onToggle,
}: {
  row: PickupRow;
  selected: boolean;
  onTrip: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const s = t.start;
  const badge = pickupBadge(row, onTrip);
  const f = row.flight;
  const details = [
    // 22/10/2026: where this traveller waits (their booking's stop, the airport by default).
    s.atDest(row.stopName ?? s.theAirport),
    f.gate ? s.gate(f.gate) : null,
    f.number ? s.flight(f.number) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li
      data-testid="pickup-row"
      aria-selected={selected}
      className={cn(
        "flex items-center gap-1 rounded-xl border bg-panel pr-2",
        selected || onTrip ? "border-2 border-primary" : "border-panel-line",
      )}
    >
      <button
        type="button"
        disabled={!selectable}
        onClick={onToggle}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left disabled:cursor-default"
      >
        {selectable &&
          (selected ? (
            <CircleCheck
              className="h-5 w-5 text-lime-deep"
              aria-hidden="true"
            />
          ) : (
            <Circle className="h-5 w-5 text-panel-line" aria-hidden="true" />
          ))}
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
          {row.customerName}{" "}
          <span className="font-normal text-muted-foreground">
            · {s.pax(row.passengers)}
            <ChildrenCount seats={row.childSeats} />
          </span>
        </span>
        <Badge tone={badge.tone}>{badge.text}</Badge>
        <ChildSeatPills seats={row.childSeats} />
        {row.notice && (
          <Badge tone="warn">
            {row.notice.kind === "flight_delayed"
              ? s.badge.noticeFlightDelayed
              : row.notice.kind === "luggage"
                ? s.badge.noticeLuggage
                : s.badge.noticeOther(row.notice.text)}
          </Badge>
        )}
        {details && (
          <span className="font-mono text-xs text-muted-foreground">
            {details}
          </span>
        )}
        <Plate value={row.plate} size="sm" />
      </button>
      <CardLink id={row.reservationId} />
    </li>
  );
}

function DepartureTile({
  row,
  selected,
  onTrip,
  selectable,
  pinned,
  onToggle,
}: {
  row: DepartureRow;
  selected: boolean;
  onTrip: boolean;
  selectable: boolean;
  /** Added from a booking's « Embarquer »: the list does not hold this traveller (yet). */
  pinned: boolean;
  onToggle: () => void;
}) {
  const s = t.start;
  const details = [
    row.arrivedAt
      ? s.arrivedAt(timeOf(row.arrivedAt))
      : s.arrivalPlanned(timeOf(row.arrivalAt)),
    // 22/10/2026: where this traveller goes (their booking's stop, the airport by default).
    s.toDest(row.stopName ?? s.theAirport),
    row.spot ? s.spot(row.spot) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <li
      data-testid="departure-row"
      data-pinned={pinned || undefined}
      aria-selected={selected}
      className={cn(
        "flex items-center gap-1 rounded-xl border bg-panel pr-2",
        selected || onTrip ? "border-2 border-primary" : "border-panel-line",
      )}
    >
      <button
        type="button"
        disabled={!selectable}
        onClick={onToggle}
        className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-left disabled:cursor-default"
      >
        {selectable &&
          (selected ? (
            <CircleCheck
              className="h-5 w-5 text-lime-deep"
              aria-hidden="true"
            />
          ) : (
            <Circle className="h-5 w-5 text-panel-line" aria-hidden="true" />
          ))}
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
          {row.customerName}{" "}
          <span className="font-normal text-muted-foreground">
            · {s.pax(row.passengers)}
            <ChildrenCount seats={row.childSeats} />
          </span>
        </span>
        <ChildSeatPills seats={row.childSeats} />
        {onTrip || row.tripId ? (
          <Badge tone="info">{s.badge.onTrip}</Badge>
        ) : row.status === "upcoming" ? (
          // « Embarquer en un geste » (14/10/2026): still expected, tickable all the same (checked in at boarding).
          <Badge tone="warn">{s.expectedAt(timeOf(row.arrivalAt))}</Badge>
        ) : (
          <Badge tone="ok">{s.onSite}</Badge>
        )}
        <span className="font-mono text-xs text-muted-foreground">
          {details}
        </span>
        <Plate value={row.plate} size="sm" />
      </button>
      <CardLink id={row.reservationId} />
    </li>
  );
}

/** B: « 14:30 départ conseillé » and « Tout cocher » / « Tout décocher » for the slot. */
function SlotHeader({
  leaveAt,
  allSelected,
  enabled,
  onToggle,
}: {
  leaveAt: string | null;
  allSelected: boolean;
  enabled: boolean;
  onToggle: () => void;
}) {
  const s = t.start;
  return (
    <div className="mb-1.5 flex items-center gap-2 px-1">
      <h3 className="flex-1 font-mono text-[17px] font-semibold text-lime-deep">
        {leaveAt ? timeOf(leaveAt) : s.slotNoTime}
        {leaveAt && (
          <span className="ml-2 font-sans text-xs font-medium text-muted-foreground">
            {s.slotLeave}
          </span>
        )}
      </h3>
      {enabled && (
        <button
          type="button"
          onClick={onToggle}
          className="min-h-9 rounded-full px-2.5 text-[13px] font-semibold text-lime-deep hover:bg-panel-2"
        >
          {allSelected ? s.slotNone : s.slotAll}
        </button>
      )}
    </div>
  );
}

/**
 * The driver's screen on the web (06/10/2026), the same as the Navette tab of Plazo Pro. B (22/10/2026): « Aller » (the
 * travellers to take, by time slot of the planning), « Retour » (the ones to fetch) and « En route » (the team's shuttles,
 * my trip with its position shared by the browser); the destination is each booking's own stop, nothing to pick first.
 */
export default function ShuttleTripsPanel() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mayDrive = can(user?.role, "reservations:status");
  const mayManage = can(user?.role, "reservations:manage");
  const s0 = t.start;
  const [now, setNow] = useState(() => Date.now());
  // Opened from a booking's card (C-A): "?sens=dropoff&reservation=…" preselects the side and the traveller.
  const [params, setParams] = useSearchParams();
  const wantedSide = params.get("sens");
  const wanted = params.get("reservation");
  const [direction, setDirection] = useState<ShuttleDirection>(
    wantedSide === "dropoff" ? "dropoff" : "pickup",
  );
  const [selected, setSelected] = useState<string[]>([]);
  // Travellers added from a booking's « Embarquer » whom the drop-off list does not hold (an early or late one).
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  // A start just refused: the travellers added by hand who rode along (id → name), named if the lists read again since
  // drop them.
  const refusal = useRef<{ at: number; names: Map<string, string> } | null>(
    null,
  );
  // The vehicle of the day (V-A) is preselected: « Embarquer et partir » takes it.
  const dayVehicleId = user?.vehicle?.id ?? null;
  const [vehicle, setVehicle] = useState<VehicleChoice | null>(() =>
    dayVehicleId ? { kind: "known", id: dayVehicleId } : null,
  );
  const [endedNotice, setEndedNotice] = useState(false);
  // The list or « En route »; a trip starting opens « En route », its end goes back to the list.
  const [band, setBand] = useState<0 | 1>(0);
  const [problem, setProblem] = useState<"denied" | "unavailable" | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (dayVehicleId)
      setVehicle((v) => v ?? { kind: "known", id: dayVehicleId });
  }, [dayVehicleId]);

  const live = useQuery({
    queryKey: ["shuttle-live"],
    queryFn: adminApi.getLiveShuttles,
    refetchInterval: LIVE_POLL_MS,
  });
  const current = useQuery({
    queryKey: ["shuttle-current"],
    queryFn: adminApi.getCurrentTrip,
    enabled: mayDrive,
    refetchInterval: LIST_POLL_MS,
  });
  const pickups = useQuery({
    queryKey: ["shuttle-pickups"],
    queryFn: adminApi.getPickups,
    // B: both lists, for the counts of « Aller » and « Retour ».
    enabled: mayDrive,
    refetchInterval: LIST_POLL_MS,
  });
  const departures = useQuery({
    queryKey: ["shuttle-departures"],
    queryFn: adminApi.getDepartures,
    enabled: mayDrive,
    refetchInterval: LIST_POLL_MS,
  });
  const vehicles = useQuery({
    queryKey: ["shuttle-vehicles"],
    queryFn: adminApi.getVehicles,
    enabled: mayDrive,
  });

  const trip = current.data?.trip ?? null;
  const running = trip?.status === "running";
  // Coming back on the page while a trip runs: the "En route" band.
  const runningRef = useRef(false);
  useEffect(() => {
    if (running && !runningRef.current) setBand(1);
    runningRef.current = !!running;
  }, [running]);
  // The pinned travellers' bookings (the booking card's cache), read again as often as the list: one that can no longer
  // board (cancelled, gone, another day) leaves it.
  const { bookings: pinnedBookings, readAt: pinnedReadAt } = useQueries({
    queries: pinnedIds.map((id) => ({
      queryKey: ["reservation", id],
      queryFn: () => adminApi.getReservation(id),
      enabled: mayDrive && direction === "dropoff" && !running,
      refetchInterval: LIST_POLL_MS,
    })),
    combine: pinnedOf,
  });
  // The drop-off list, then the pinned travellers that it does not hold and who may still board.
  const { departureRows, pinnedRowIds } = useMemo(() => {
    const listed = departures.data?.rows ?? [];
    const ids = new Set(listed.map((r) => r.reservationId));
    const extra = pinnedBookings
      .filter(
        (b): b is Reservation =>
          !!b && !ids.has(b.id) && canBoardDropoff(b, now),
      )
      .map(departureRowOf);
    return {
      departureRows: [...listed, ...extra],
      pinnedRowIds: new Set(extra.map((r) => r.reservationId)),
    };
  }, [departures.data, pinnedBookings, now]);
  const rows: (PickupRow | DepartureRow)[] =
    direction === "pickup" ? (pickups.data?.rows ?? []) : departureRows;
  const listQuery = direction === "pickup" ? pickups : departures;
  const listLoaded = !!listQuery.data;
  // « Embarquer en un geste » (14/10/2026): the expected travellers board too (checked in when the trip starts).
  const rowTrips = rows
    .map((r) => `${r.reservationId}:${r.tripId ?? ""}`)
    .join(",");
  // The side asked for with the traveller ("?sens="), else the one shown.
  const wantedDirection: ShuttleDirection =
    wantedSide === "pickup" || wantedSide === "dropoff"
      ? wantedSide
      : direction;
  const wantedListed = !!wanted && rows.some((r) => r.reservationId === wanted);
  // When the request came in: a cached list (or booking) may predate the traveller, so only one read since may turn
  // them down.
  const wantedKey = wanted ? `${wantedDirection}:${wanted}` : null;
  const [wantedSeen, setWantedSeen] = useState<{
    key: string;
    at: number;
  } | null>(null);
  useEffect(() => {
    setWantedSeen(wantedKey ? { key: wantedKey, at: Date.now() } : null);
  }, [wantedKey]);
  const since = wantedSeen?.key === wantedKey ? wantedSeen.at : null;
  const listFresh = since !== null && listQuery.dataUpdatedAt >= since;
  // « Embarquer » from a booking the drop-off list does not hold: the booking itself stands in for the row.
  const wantedBooking = useQuery({
    queryKey: ["reservation", wanted],
    queryFn: () => adminApi.getReservation(wanted!),
    enabled:
      !!wanted &&
      mayDrive &&
      !running &&
      direction === "dropoff" &&
      wantedDirection === "dropoff" &&
      listFresh &&
      !wantedListed,
  });
  useEffect(() => {
    // The driver's own trip decides first: it is read before anything is ticked.
    if (!wanted || !mayDrive || current.isPending) return;
    const consume = () =>
      setParams(
        (p) => {
          p.delete("reservation");
          p.delete("sens");
          return p;
        },
        { replace: true },
      );
    if (running) {
      // A cached trip may have ended since (in Plazo Pro, by a manager): only a read since the request says it runs.
      if (since === null) return;
      if (current.dataUpdatedAt < since && current.errorUpdatedAt < since) {
        void current.refetch({ cancelRefetch: false });
        return;
      }
      // « Embarquer », « Déposer » or « Récupérer » while the driver's own trip runs: no second trip before it ends
      // (the server would refuse it), said on « En route » as in Plazo Pro.
      toast.error(errorMessage("trip_already_running"));
      setBand(1);
      consume();
      return;
    }
    // Opened on the other side (a booking's card on this very page): that side, the first band, a new selection.
    if (wantedDirection !== direction) {
      setDirection(wantedDirection);
      setSelected([]);
      setPinnedIds([]);
      setBand(0);
      return;
    }
    // Ticked in addition to those already ticked, on the first band.
    const pick = () => {
      setSelected((list) => (list.includes(wanted) ? list : [...list, wanted]));
      setBand(0);
    };
    const listed = rows.find((r) => r.reservationId === wanted);
    if (listed && !listed.tripId) {
      pick();
      consume();
      return;
    }
    // Turning the traveller down waits for the list read since the request.
    if (since === null) return;
    if (listQuery.errorUpdatedAt >= since) {
      // The list could not be read (its error shows): nothing to tick.
      consume();
      return;
    }
    if (listQuery.dataUpdatedAt < since) {
      void listQuery.refetch({ cancelRefetch: false });
      return;
    }
    if (listed) {
      toast.error(fr.errors.already_on_trip);
      consume();
      return;
    }
    if (direction === "pickup") {
      // A return the list does not hold (not back yet, or handed back): nothing to tick.
      consume();
      return;
    }
    if (wantedBooking.errorUpdatedAt >= since) {
      toast.error(describeError(wantedBooking.error));
      consume();
      return;
    }
    const booking = wantedBooking.data;
    if (!booking || wantedBooking.dataUpdatedAt < since) {
      void wantedBooking.refetch({ cancelRefetch: false });
      return;
    }
    if (canBoardDropoff(booking)) {
      setPinnedIds((list) =>
        list.includes(booking.id) ? list : [...list, booking.id],
      );
      pick();
    } else toast.error(t.start.cannotBoard);
    consume();
    // The listed rows (and their trips) and the booking, read since the request, are what decide; the params are
    // consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wanted,
    wantedDirection,
    running,
    current.isPending,
    current.dataUpdatedAt,
    current.errorUpdatedAt,
    mayDrive,
    direction,
    since,
    rowTrips,
    listQuery.dataUpdatedAt,
    listQuery.errorUpdatedAt,
    wantedBooking.data,
    wantedBooking.dataUpdatedAt,
    wantedBooking.errorUpdatedAt,
  ]);
  // The ticks follow the list: a traveller who left it (cancelled, gone), was taken by another trip or, pinned, may no
  // longer board loses their tick, else every start would be refused (a pinned one leaves with it).
  const tickable = [
    ...rows.filter((r) => !r.tripId).map((r) => r.reservationId),
    // A pinned booking not read yet stays.
    ...pinnedIds.filter((_, i) => !pinnedBookings[i]),
  ].join(",");
  useEffect(() => {
    if (wanted || running || !listLoaded) return;
    const ids = new Set(tickable.split(","));
    const keep = (list: string[]) =>
      list.every((id) => ids.has(id)) ? list : list.filter((id) => ids.has(id));
    // After a refused start, the travellers added by hand that leave the selection are named (as in Plazo Pro).
    const refused = refusal.current;
    const gone = refused
      ? pinnedIds.filter((id) => !ids.has(id) && refused.names.has(id))
      : [];
    if (refused && gone.length > 0) {
      toast.error(t.start.unpinned(gone.map((id) => refused.names.get(id)!)));
      for (const id of gone) refused.names.delete(id);
    }
    setSelected(keep);
    setPinnedIds(keep);
  }, [tickable, wanted, running, listLoaded, pinnedIds]);
  // The refusal is over once the lists and the added travellers' bookings were read again since (or none is left).
  useEffect(() => {
    const refused = refusal.current;
    if (!refused) return;
    const left = pinnedIds.flatMap((id, i) =>
      refused.names.has(id) ? [pinnedReadAt[i] ?? 0] : [],
    );
    const listRead =
      Math.max(listQuery.dataUpdatedAt, listQuery.errorUpdatedAt) >= refused.at;
    if (left.length === 0 || (listRead && left.every((at) => at >= refused.at)))
      refusal.current = null;
  }, [
    pinnedIds,
    pinnedReadAt,
    listQuery.dataUpdatedAt,
    listQuery.errorUpdatedAt,
  ]);
  useTripPosition(trip, setProblem);

  const refresh = (withCurrent = true) => {
    void queryClient.invalidateQueries({ queryKey: ["shuttle-live"] });
    if (withCurrent)
      void queryClient.invalidateQueries({ queryKey: ["shuttle-current"] });
    void queryClient.invalidateQueries({ queryKey: ["shuttle-pickups"] });
    void queryClient.invalidateQueries({ queryKey: ["shuttle-departures"] });
    void queryClient.invalidateQueries({ queryKey: ["shuttle-staying"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const start = useMutation({
    mutationFn: () =>
      adminApi.startTrip({
        reservationIds: selected,
        direction,
        // 22/10/2026: where the ticked travellers go (their bookings' stop), not a stop the driver picks.
        stopId: selectedStopId,
        vehicleId: vehicle?.kind === "known" ? vehicle.id : null,
        vehicle:
          vehicle?.kind === "free" && vehicle.model.trim()
            ? {
                model: vehicle.model.trim(),
                colour: vehicle.colour.trim() || null,
                plate: vehicle.plate.trim() || null,
              }
            : null,
      }),
    onMutate: () => {
      refusal.current = null;
    },
    onSuccess: ({ trip }) => {
      // The started trip is the answer itself: no refetch of "current" that could race it.
      queryClient.setQueryData(["shuttle-current"], { trip });
      setSelected([]);
      setPinnedIds([]);
      setEndedNotice(false);
      setBand(1);
      refresh(false);
      // Travellers checked in at boarding: their cars now wait for a spot or a file.
      void queryClient.invalidateQueries({ queryKey: ["occupation"] });
      void queryClient.invalidateQueries({ queryKey: ["files"] });
      void queryClient.invalidateQueries({ queryKey: ["planning"] });
    },
    onError: (error) => {
      toast.error(describeError(error));
      const names = new Map<string, string>();
      pinnedIds.forEach((id, i) => {
        const b = pinnedBookings[i];
        if (b && selected.includes(id)) names.set(id, b.customerName);
      });
      refusal.current = names.size > 0 ? { at: Date.now(), names } : null;
      // Refused (a traveller cancelled, gone or taken meanwhile): the lists and the pinned bookings are read again, and
      // the ticks follow them.
      refresh(false);
      for (const id of pinnedIds)
        void queryClient.invalidateQueries({ queryKey: ["reservation", id] });
    },
  });
  const end = useMutation({
    mutationFn: (tripId: string) => adminApi.endTrip(tripId),
    onSuccess: ({ trip: ended }) => {
      const mine = ended.driverId === user?.id;
      if (mine) {
        queryClient.setQueryData(["shuttle-current"], { trip: null });
        setEndedNotice(true);
        setBand(0);
      }
      refresh(!mine);
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const vehicleList = vehicles.data?.data ?? [];
  const selectedPassengers = rows
    .filter((r) => selected.includes(r.reservationId))
    .reduce((sum, r) => sum + r.passengers, 0);
  // The ticked travellers not checked in yet: « Sur place » when the drop-off starts.
  const notCheckedIn =
    direction === "dropoff"
      ? departureRows.filter(
          (r) => selected.includes(r.reservationId) && r.status === "upcoming",
        )
      : [];
  // Where the ticked travellers go: one stop for all, else none (the airport, or a mix).
  const selectedRows = rows.filter((r) => selected.includes(r.reservationId));
  const destinations = [...new Set(selectedRows.map((r) => r.stopId ?? ""))];
  const selectedStopId =
    destinations.length === 1 && destinations[0] ? destinations[0] : null;
  const selectedStopName =
    selectedRows.find((r) => r.stopId === selectedStopId)?.stopName ?? null;
  // « Sièges auto » (24/10/2026): what to install in the shuttle for the ticked travellers.
  const seatsToLoad = sumChildSeats(selectedRows.map((r) => r.childSeats));
  const slots = useMemo(() => slotsOf<PickupRow | DepartureRow>(rows), [rows]);
  const counts = {
    go: departures.data ? departureRows.length : null,
    back: pickups.data ? pickups.data.rows.length : null,
    route: running && trip ? trip.passengers.length : 0,
  };
  const tabs: {
    key: string;
    label: string;
    active: boolean;
    locked: boolean;
    open: () => void;
  }[] = [
    {
      key: "go",
      label: s0.tabGo(counts.go),
      active: band === 0 && direction === "dropoff",
      locked: !!running && trip?.direction !== "dropoff",
      open: () => openSide("dropoff"),
    },
    {
      key: "back",
      label: s0.tabBack(counts.back),
      active: band === 0 && direction === "pickup",
      locked: !!running && trip?.direction !== "pickup",
      open: () => openSide("pickup"),
    },
    {
      key: "route",
      label: s0.bandRoute(counts.route),
      active: band === 1,
      locked: false,
      open: () => setBand(1),
    },
  ];
  const listError = direction === "pickup" ? pickups.error : departures.error;
  const listLoading =
    direction === "pickup" ? pickups.isPending : departures.isPending;

  // « Aller » / « Retour »: that side, a new selection (a trip running keeps its side).
  function openSide(side: ShuttleDirection) {
    setBand(0);
    if (side === direction) return;
    setDirection(side);
    setSelected([]);
    setPinnedIds([]);
  }
  const toggleSlot = (ids: string[]) => {
    const free = ids.filter((id) =>
      rows.some((r) => r.reservationId === id && !r.tripId),
    );
    if (free.length === 0) return;
    const all = free.every((id) => selected.includes(id));
    setSelected((list) =>
      all
        ? list.filter((id) => !free.includes(id))
        : [...list, ...free.filter((id) => !list.includes(id))],
    );
  };
  const startLabel = () => {
    const people = selectedPassengers;
    if (destinations.length > 1)
      return direction === "dropoff"
        ? s0.startGoMany(people, destinations.length)
        : s0.startBackMany(people, destinations.length);
    const where = selectedStopName ?? s0.theAirport;
    return direction === "dropoff"
      ? s0.startGo(where, people)
      : s0.startBack(where, people);
  };
  const toggle = (id: string) => {
    // A traveller pinned from a booking leaves with their tick.
    if (selected.includes(id))
      setPinnedIds((list) => list.filter((x) => x !== id));
    setSelected((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  };
  const onEndLive = async (lt: LiveTrip) => {
    if (
      lt.driverId !== user?.id &&
      !(await confirm(t.live.endConfirm(lt.driverName)))
    )
      return;
    end.mutate(lt.id);
  };
  const s = t.start;
  const liveTrips = (
    <LiveTrips
      live={live.data}
      now={now}
      canEnd={(lt) => lt.driverId === user?.id || mayManage}
      onEnd={onEndLive}
      ending={end.isPending}
    />
  );
  const notices = (
    <>
      {endedNotice && (
        <p
          role="status"
          className="flex items-center gap-3 rounded-xl border border-panel-line bg-panel px-3.5 py-2.5 text-[13px]"
        >
          <span className="flex-1">{t.running.ended}</span>
          <button
            type="button"
            onClick={() => setEndedNotice(false)}
            className="text-xs font-semibold text-muted-foreground hover:underline"
          >
            OK
          </button>
        </p>
      )}
    </>
  );

  // Band 1, "À emmener" / "À récupérer": the travellers to take, grouped by stop with the advised leave time.
  const tourBand = (
    <>
      <h2 className="flex items-center gap-2 px-1 font-mono text-[19px] font-medium">
        <Navigation className="h-5 w-5 text-lime-deep" aria-hidden="true" />
        {s.title}
      </h2>
      {notices}
      <p className="px-1 text-[13px] text-muted-foreground">
        {direction === "dropoff" ? s.introGo : s.introBack}
      </p>

      {direction === "pickup" && (
        <p className="flex items-start gap-1.5 px-1 text-[13px]">
          <MapPin
            className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep"
            aria-hidden="true"
          />
          <span>
            {pickups.data?.meetingPoint?.label ? (
              <b>{s.meetingPoint(pickups.data.meetingPoint.label)}</b>
            ) : (
              <span className="text-muted-foreground">
                {s.meetingPointNone}
              </span>
            )}
          </span>
        </p>
      )}

      {listError ? (
        <p className="rounded-xl border border-bad bg-bad-soft p-3 text-sm text-bad-text">
          {describeError(listError) || s.loadError}
        </p>
      ) : listLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-panel-line bg-panel p-4 text-sm text-muted-foreground">
          {direction === "pickup" ? s.emptyPickup : s.emptyDropoff}
        </p>
      ) : (
        slots.map((slot) => {
          const ids = slot.rows.map((r) => r.reservationId);
          return (
            <div key={slot.key} data-testid="slot">
              <SlotHeader
                leaveAt={slot.leaveAt}
                allSelected={ids.every((id) => selected.includes(id))}
                enabled={!running}
                onToggle={() => toggleSlot(ids)}
              />
              <ul className="space-y-1.5">
                {slot.rows.map((row) => {
                  const onTrip =
                    !!running &&
                    !!trip?.passengers.some(
                      (p) => p.reservationId === row.reservationId,
                    );
                  return direction === "pickup" ? (
                    <PickupTile
                      key={row.reservationId}
                      row={row as PickupRow}
                      selected={selected.includes(row.reservationId)}
                      onTrip={onTrip}
                      selectable={!running && !row.tripId}
                      onToggle={() => toggle(row.reservationId)}
                    />
                  ) : (
                    <DepartureTile
                      key={row.reservationId}
                      row={row as DepartureRow}
                      selected={selected.includes(row.reservationId)}
                      onTrip={onTrip}
                      selectable={!running && !row.tripId}
                      pinned={pinnedRowIds.has(row.reservationId)}
                      onToggle={() => toggle(row.reservationId)}
                    />
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
      {!running && selected.length > 0 && (
        <>
          {notCheckedIn.length > 0 && (
            <p
              data-testid="not-checked-in"
              className="rounded-xl bg-primary/15 px-3 py-2 text-[13px]"
            >
              {s.notCheckedIn(notCheckedIn.map((r) => r.customerName))}
            </p>
          )}
          <VehiclePicker
            vehicles={vehicleList}
            choice={vehicle}
            onChange={setVehicle}
            passengers={selectedPassengers}
          />
          {hasChildSeats(seatsToLoad) && (
            <div
              data-testid="child-seats-to-load"
              className="flex items-start gap-2 rounded-xl border border-ok/30 bg-ok-soft px-3 py-2 text-[13px]"
            >
              <ChildSeatIcon className="mt-0.5 text-ok-text" />
              <p>
                <b className="text-ok-text">{s.loadTitle}</b>
                <br />
                {childSeatsLoadLine(seatsToLoad)}
              </p>
            </div>
          )}
          <button
            type="button"
            data-testid="start-trip-button"
            disabled={start.isPending}
            onClick={() => start.mutate()}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            <BusFront className="h-5 w-5" aria-hidden="true" />
            {start.isPending ? s.starting : startLabel()}
          </button>
        </>
      )}
      {!running && selected.length === 0 && rows.length > 0 && (
        <p className="px-1 text-center text-[13px] text-muted-foreground">
          {direction === "dropoff" ? s.noneGo : s.noneBack}
        </p>
      )}
      {running && (
        <button
          type="button"
          data-testid="go-route"
          onClick={() => setBand(1)}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-lime-deep font-semibold text-lime-deep hover:bg-panel-2"
        >
          <BusFront className="h-4 w-4" aria-hidden="true" />
          {s.bandRoute(counts.route)}
        </button>
      )}
    </>
  );

  // Band 2, "En route": the team's shuttles on the map, my trip with its passengers, "Clients déposés".
  const routeBand = (
    <>
      {liveTrips}
      {notices}
      {running && trip ? (
        <RunningCard
          trip={trip}
          now={now}
          onEnd={() => end.mutate(trip.id)}
          ending={end.isPending}
          problem={problem}
        />
      ) : (
        <p
          data-testid="route-none"
          className="rounded-xl border border-panel-line bg-panel p-4 text-center text-sm text-muted-foreground"
        >
          {s.routeNone}
        </p>
      )}
    </>
  );

  return (
    <div className="space-y-3">
      {!mayDrive ? (
        <>
          {liveTrips}
          <p className="rounded-xl border border-panel-line bg-panel p-3.5 text-[13px] text-muted-foreground">
            {s.needsStatus}
          </p>
        </>
      ) : (
        <section
          aria-label={s.tourTitle}
          data-testid="start-trip"
          className="space-y-3"
        >
          {/* B: « Aller · Retour · En route ». */}
          <div
            role="tablist"
            aria-label={s.tourTitle}
            className="grid grid-cols-3 gap-1.5 rounded-xl border border-panel-line bg-panel p-1.5"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                data-testid={`tab-${tab.key}`}
                aria-selected={tab.active}
                disabled={tab.locked}
                onClick={tab.open}
                className={cn(
                  "truncate rounded-full px-2 py-2 text-[13px] font-semibold disabled:opacity-40",
                  tab.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-panel-2",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {band === 0 ? tourBand : routeBand}
        </section>
      )}
    </div>
  );
}
