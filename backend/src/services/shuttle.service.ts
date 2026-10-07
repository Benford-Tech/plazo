import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Prisma, ReservationStatus, ShuttleStop, ShuttleStopKind, ShuttleTracking, ShuttleTrip, ShuttleVehicle, Staff } from '@/database';
import { ArrivalEstimator, haversineMeters, straightLineEstimate } from '@/domain/arrival';
import { shuttleArrivedPush, shuttleLeavingPush, ShuttleTripFacts, tripEndedPush, tripStartedPush } from '@/domain/shuttle-messages';
import { sharesPosition, travellersSeePosition } from '@/domain/shuttle-tracking';
import { dayBounds as localDayBounds, localDate } from '@/domain/time';
import { dropoffTimes, pickupTimes, WaveTimes } from '@/domain/shuttle-waves';
import {
  canBoard,
  DROPOFF_LIST_HOURS_AFTER,
  DROPOFF_LIST_HOURS_BEFORE,
  DROPOFF_STATUSES,
  firstName,
  PICKUP_LIST_HOURS_AFTER,
  PICKUP_LIST_HOURS_BEFORE,
  PICKUP_STATUSES,
  ShuttleDirection,
  stayPhase,
  TRIP_MAX_MINUTES,
  TRIP_POSITION_MAX_AGE_SECONDS,
  POSITION_INTERVAL_TOLERANCE_MS,
  TRIP_POSITION_MIN_INTERVAL_SECONDS,
} from '@/domain/shuttle';
import { can } from '@/domain/roles';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { ArrivalService, MeetingPoint } from './arrival.service';
import { AuditService } from './audit.service';
import { FlightTrackingService } from './flight-tracking.service';
import { ReturnNotice, returnNoticeView } from '@/domain/return-messages';
import { ParkingLocationService } from './parking-location.service';
import { ParkingService } from './parking.service';
import { PushService } from './push.service';
import { TravellerMessagesService } from './traveller-messages.service';
import { holdsVehicleToday } from './staff.service';

/** Fields of the position: all cleared together, whenever a trip ends. */
/** The shuttle is "there" within this distance of the stop (N-A: "Votre navette est là"). */
export const STOP_REACHED_METERS = 150;
/** A stop's instructions to the traveller, like the meeting point's. */
export const STOP_INSTRUCTIONS_MAX = 500;

const ERASED_POSITION = { lat: null, lng: null, accuracyM: null, positionRecordedAt: null };
const dayBounds = (now: Date, tz: string) => {
  const day = localDate(now, tz);
  return { day, start: new Date(now.getTime() - PICKUP_LIST_HOURS_BEFORE * 3600000), end: new Date(now.getTime() + 18 * 3600000) };
};
const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

export interface FlightView {
  number: string | null;
  status: string | null;
  scheduledAt: string | null;
  estimatedAt: string | null;
  landedAt: string | null;
  landedSource: string | null;
  terminal: string | null;
  gate: string | null;
  checkedAt: string | null;
}

/** A return to pick up, as the driver sees it. */
/** A place the shuttle serves (D-A): the airport (built in, id null) or one of the parking's stops. */
export interface ShuttleStopView {
  id: string | null;
  kind: ShuttleStopKind;
  name: string;
  lat: number;
  lng: number;
  instructions: string | null;
  builtIn: boolean;
}

export interface StopInput {
  kind?: ShuttleStopKind;
  name?: string;
  lat?: number;
  lng?: number;
  instructions?: string | null;
  sortOrder?: number;
}

/** A running trip as the staff's live map shows it (P-A). */
export interface LiveTrip {
  id: string;
  direction: ShuttleDirection;
  driverId: string;
  driverName: string;
  vehicle: TripVehicle;
  stop: ShuttleStopView | null;
  passengers: number;
  startedAt: string;
  expiresAt: string;
  position: { lat: number; lng: number } | null;
  positionAgeSeconds: number | null;
  /** Straight-line distance and time to the stop, and to the parking. */
  toStop: { distanceM: number; etaMinutes: number } | null;
  toParking: { distanceM: number; etaMinutes: number } | null;
}

export interface LiveShuttles {
  serverTime: string;
  parking: { id: string; name: string; lat: number | null; lng: number | null };
  stops: ShuttleStopView[];
  trips: LiveTrip[];
}

export interface PickupRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  returnAt: string;
  flight: FlightView;
  /** "Terminal 1" when the flight says so, else the meeting point's label. */
  terminal: string | null;
  /** The stop serving this traveller (D-A); null: the airport. */
  stopId: string | null;
  stopName: string | null;
  /** The traveller said (or was seen) at the meeting point. */
  atMeetingPointAt: string | null;
  /** Id of the running trip this traveller is on, if any. */
  tripId: string | null;
  /** E (06/10/2026): what the traveller signalled today ("mon vol a du retard", "bagage perdu"). */
  notice: ReturnNotice | null;
  /** F-A: when the shuttle should leave the parking to be at the meeting point in time. */
  leaveAt: string;
}

export interface TripVehicle {
  model: string | null;
  colour: string | null;
  plate: string | null;
}

/** The vehicle sheet (V-A): what the pro space and the pro app list and edit. */
export interface ShuttleVehicleView {
  id: string;
  model: string;
  colour: string | null;
  plate: string | null;
  seats: number | null;
  inService: boolean;
  driverId: string | null;
  driverName: string | null;
  /** Who took it today (V-A), null when free. */
  holderId: string | null;
  holderName: string | null;
}

export interface VehicleInput {
  model?: string;
  colour?: string | null;
  plate?: string | null;
  seats?: number | null;
  inService?: boolean;
  driverId?: string | null;
}

/** An arrived traveller waiting at the parking for the shuttle to the terminal (drop-off). */
export interface DepartureRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  arrivalAt: string;
  arrivedAt: string | null;
  /** Spot code, when the vehicle was placed. */
  spot: string | null;
  stopId: string | null;
  stopName: string | null;
  tripId: string | null;
  /** F-A: when the shuttle should leave for the terminal (before the take-off, else when the traveller came). */
  leaveAt: string;
  /** F-A: still expected (status upcoming): shown greyed, not selectable. */
  expected: boolean;
}

/** F-A: a traveller dropped at the terminal (or fetched back), kept on the list until their return. */
export interface StayingRow {
  reservationId: string;
  reference: string;
  customerName: string;
  passengers: number;
  plate: string;
  status: ReservationStatus;
  returnAt: string;
  returnFlight: string | null;
  flight: FlightView;
  spot: string | null;
  stopName: string | null;
  returnedAt: string | null;
}

export interface Staying {
  serverTime: string;
  /** Away travellers by local return day, soonest first. */
  days: { date: string; rows: StayingRow[] }[];
  /** Back at the parking or handed back today (the return side's "Rendus"). */
  returnedToday: StayingRow[];
}

/** Where a traveller's shuttle is measured to. */
export interface ShuttleDestination {
  kind: 'parking' | 'meeting_point';
  lat: number;
  lng: number;
  label: string | null;
}

export interface StaffTrip {
  id: string;
  status: string;
  direction: ShuttleDirection;
  driverId: string;
  driverName: string;
  vehicle: TripVehicle;
  startedAt: string;
  expiresAt: string;
  endedAt: string | null;
  endReason: string | null;
  secondsLeft: number;
  passengers: { reservationId: string; reference: string; customerName: string; passengers: number; plate: string; terminal: string | null }[];
  positionUpdatedAt: string | null;
  meetingPoint: MeetingPoint | null;
  /** Where the trip goes (D-A): the chosen stop, else the airport's meeting point. */
  stop: ShuttleStopView | null;
  /** R-B: the driver's phone (or browser) shares its position during the trip; false when the parking turned it off. */
  sharePosition: boolean;
}

/** What a traveller sees of the shuttle coming for them: the vehicle and its position, never the other passengers. */
export interface TravellerShuttle {
  tripId: string;
  direction: ShuttleDirection;
  /** This booking is on the trip. */
  mine: boolean;
  startedAt: string;
  vehicle: TripVehicle;
  driverFirstName: string;
  position: { lat: number; lng: number } | null;
  positionAgeSeconds: number | null;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  meetingPoint: MeetingPoint | null;
  destination: ShuttleDestination | null;
}

/** "Navette" block of a booking during the stay (S-A): the parking's running shuttles. */
export interface StayShuttles {
  /** null: outside the arrival day → return day window (the block is hidden). */
  phase: 'arrival' | 'stay' | 'return' | null;
  serverTime: string;
  shuttles: TravellerShuttle[];
}

export const flightView = (r: {
  returnFlight: string | null;
  flightStatus: string | null;
  flightScheduledAt: Date | null;
  flightEstimatedAt: Date | null;
  flightLandedAt: Date | null;
  flightLandedSource: string | null;
  flightTerminal: string | null;
  flightGate: string | null;
  flightCheckedAt: Date | null;
}): FlightView => ({
  number: r.returnFlight,
  status: r.flightStatus,
  scheduledAt: iso(r.flightScheduledAt),
  estimatedAt: iso(r.flightEstimatedAt),
  landedAt: iso(r.flightLandedAt),
  landedSource: r.flightLandedSource,
  terminal: r.flightTerminal,
  gate: r.flightGate,
  checkedAt: iso(r.flightCheckedAt),
});

const notRunning = () => new HttpException(httpStatus.CONFLICT, 'No trip is running', 'trip_not_running');
type VehicleRow = ShuttleVehicle & { driver: { name: string } | null; holders?: Staff[] };
const vehicleView = (v: VehicleRow, timezone: string): ShuttleVehicleView => {
  const holder = (v.holders ?? []).find(h => h.isActive && holdsVehicleToday(h, timezone)) ?? null;
  return {
    id: v.id,
    model: v.model,
    colour: v.colour,
    plate: v.plate,
    seats: v.seats,
    inService: v.inService,
    driverId: v.driverId,
    driverName: v.driver?.name ?? null,
    holderId: holder?.id ?? null,
    holderName: holder?.name ?? null,
  };
};
const WITH_DRIVER_AND_HOLDERS = { driver: { select: { name: true, firstName: true } }, holders: true } as const;

const stopView = (stop: ShuttleStop): ShuttleStopView => ({
  id: stop.id,
  kind: stop.kind,
  name: stop.name,
  lat: stop.lat,
  lng: stop.lng,
  instructions: stop.instructions,
  builtIn: false,
});
/** The airport as a stop: the operator's return meeting point, else the listing's airport. */
const airportStop = (meeting: MeetingPoint | null): ShuttleStopView | null =>
  meeting && meeting.source !== 'parking'
    ? {
        id: null,
        kind: 'airport',
        name: meeting.label ?? 'Aéroport',
        lat: meeting.lat,
        lng: meeting.lng,
        instructions: meeting.instructions ?? null,
        builtIn: true,
      }
    : null;
/** "Vito blanc" for the pushes. */
const vehicleShort = (v: TripVehicle): string | null => [v.model, v.colour].filter(Boolean).join(' ') || null;

/**
 * Driver mode: a trip to the airport with its passengers (bookings) and the driver's latest
 * position, shared with those passengers only while the trip runs. RGPD: one position per trip,
 * never a history; erased when the trip ends (driver, or 90 minutes), lazily when read and by the
 * nightly cron. The audit log holds the events (passenger count, vehicle), never coordinates.
 */
@Service()
export class ShuttleService {
  public arrivals = Container.get(ArrivalService);
  public audit = Container.get(AuditService);
  public flights = Container.get(FlightTrackingService);
  public parkings = Container.get(ParkingService);
  public locations = Container.get(ParkingLocationService);
  public push = Container.get(PushService);
  public messages = Container.get(TravellerMessagesService);
  public estimator: ArrivalEstimator = straightLineEstimate;

  // ---------------------------------------------------------------- vehicles

  public async vehicles(actor: AuthenticatedStaff): Promise<ShuttleVehicleView[]> {
    const rows = await prisma.shuttleVehicle.findMany({
      where: { operatorId: actor.operatorId },
      include: WITH_DRIVER_AND_HOLDERS,
      orderBy: { createdAt: 'asc' },
    });
    const timezone = await this.timezone(actor);
    return rows.map(v => vehicleView(v, timezone));
  }

  private async timezone(actor: AuthenticatedStaff): Promise<string> {
    const parking = await prisma.parking.findFirst({
      where: { operatorId: actor.operatorId },
      orderBy: { createdAt: 'asc' },
      select: { timezone: true },
    });
    return parking?.timezone ?? 'Europe/Paris';
  }

  public async addVehicle(actor: AuthenticatedStaff, data: VehicleInput & { model: string }): Promise<ShuttleVehicleView> {
    const fields = await this.vehicleFields(actor, data);
    const vehicle = await prisma.shuttleVehicle.create({
      data: { operatorId: actor.operatorId, ...fields, model: fields.model! },
      include: WITH_DRIVER_AND_HOLDERS,
    });
    await this.audit.record(actor, {
      action: 'shuttle.vehicle_added',
      entityType: 'shuttle_vehicle',
      entityId: vehicle.id,
      details: { model: vehicle.model },
    });
    return vehicleView(vehicle, await this.timezone(actor));
  }

  /** Edits the sheet: fields left out keep their value, `null` clears one. */
  public async updateVehicle(actor: AuthenticatedStaff, id: string, data: VehicleInput): Promise<ShuttleVehicleView> {
    const existing = await prisma.shuttleVehicle.findFirst({ where: { id, operatorId: actor.operatorId } });
    if (!existing) throw new HttpException(httpStatus.NOT_FOUND, 'Vehicle not found', 'not_found');
    const fields = await this.vehicleFields(actor, data);
    const vehicle = await prisma.shuttleVehicle.update({ where: { id }, data: fields, include: WITH_DRIVER_AND_HOLDERS });
    await this.audit.record(actor, {
      action: 'shuttle.vehicle_updated',
      entityType: 'shuttle_vehicle',
      entityId: vehicle.id,
      details: { model: vehicle.model, inService: vehicle.inService, seats: vehicle.seats },
    });
    return vehicleView(vehicle, await this.timezone(actor));
  }

  /** Normalises the sheet; the usual driver must belong to the team. */
  private async vehicleFields(actor: AuthenticatedStaff, data: VehicleInput): Promise<VehicleInput> {
    const fields: VehicleInput = {};
    if (data.model !== undefined) fields.model = data.model.trim();
    if (data.colour !== undefined) fields.colour = data.colour?.trim() || null;
    if (data.plate !== undefined) fields.plate = data.plate?.trim().toUpperCase() || null;
    if (data.seats !== undefined) fields.seats = data.seats;
    if (data.inService !== undefined) fields.inService = data.inService;
    if (data.driverId !== undefined) {
      if (data.driverId) {
        const driver = await prisma.staff.findFirst({
          where: { id: data.driverId, operatorId: actor.operatorId, isActive: true },
          select: { id: true },
        });
        if (!driver) throw new ValidationException({ driverId: 'invalid_driver' });
      }
      fields.driverId = data.driverId || null;
    }
    return fields;
  }

  public async removeVehicle(actor: AuthenticatedStaff, id: string): Promise<void> {
    const { count } = await prisma.shuttleVehicle.deleteMany({ where: { id, operatorId: actor.operatorId } });
    if (!count) throw new HttpException(httpStatus.NOT_FOUND, 'Vehicle not found', 'not_found');
    await this.audit.record(actor, { action: 'shuttle.vehicle_removed', entityType: 'shuttle_vehicle', entityId: id });
  }

  // ---------------------------------------------------------------- stops (D-A)

  /** The places the shuttle serves: the airport first (built in), then the parking's own stops. */
  public async stops(actor: AuthenticatedStaff): Promise<ShuttleStopView[]> {
    const parking = await this.parkings.getPrimary(actor);
    return this.stopsOf(parking.id, await this.meetingOf(parking.id, parking.address));
  }

  private async stopsOf(parkingId: string, meeting: MeetingPoint | null): Promise<ShuttleStopView[]> {
    const rows = await prisma.shuttleStop.findMany({ where: { parkingId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    const airport = airportStop(meeting);
    return [...(airport ? [airport] : []), ...rows.map(stopView)];
  }

  public async addStop(actor: AuthenticatedStaff, data: StopInput & { name: string; lat: number; lng: number }): Promise<ShuttleStopView> {
    const parking = await this.parkings.getPrimary(actor);
    const stop = await prisma.shuttleStop.create({
      data: {
        parkingId: parking.id,
        kind: data.kind ?? 'other',
        name: data.name.trim(),
        lat: data.lat,
        lng: data.lng,
        instructions: data.instructions?.trim() || null,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    await this.audit.record(actor, {
      action: 'shuttle.stop_added',
      entityType: 'shuttle_stop',
      entityId: stop.id,
      details: { name: stop.name, kind: stop.kind },
    });
    return stopView(stop);
  }

  public async updateStop(actor: AuthenticatedStaff, id: string, data: StopInput): Promise<ShuttleStopView> {
    const parking = await this.parkings.getPrimary(actor);
    const existing = await prisma.shuttleStop.findFirst({ where: { id, parkingId: parking.id } });
    if (!existing) throw new HttpException(httpStatus.NOT_FOUND, 'Stop not found', 'not_found');
    const stop = await prisma.shuttleStop.update({ where: { id }, data: this.stopFields(data) });
    await this.audit.record(actor, {
      action: 'shuttle.stop_updated',
      entityType: 'shuttle_stop',
      entityId: stop.id,
      details: { name: stop.name, kind: stop.kind },
    });
    return stopView(stop);
  }

  public async removeStop(actor: AuthenticatedStaff, id: string): Promise<void> {
    const parking = await this.parkings.getPrimary(actor);
    const { count } = await prisma.shuttleStop.deleteMany({ where: { id, parkingId: parking.id } });
    if (!count) throw new HttpException(httpStatus.NOT_FOUND, 'Stop not found', 'not_found');
    await this.audit.record(actor, { action: 'shuttle.stop_removed', entityType: 'shuttle_stop', entityId: id });
  }

  private stopFields(data: StopInput): Prisma.ShuttleStopUpdateInput {
    const fields: Prisma.ShuttleStopUpdateInput = {};
    if (data.kind !== undefined) fields.kind = data.kind;
    if (data.name !== undefined) fields.name = data.name.trim();
    if (data.lat !== undefined) fields.lat = data.lat;
    if (data.lng !== undefined) fields.lng = data.lng;
    if (data.instructions !== undefined) fields.instructions = data.instructions?.trim() || null;
    if (data.sortOrder !== undefined) fields.sortOrder = data.sortOrder;
    return fields;
  }

  /** The stop a trip or a booking refers to, checked against the parking. */
  private async stopOf(parkingId: string, stopId: string | null | undefined): Promise<ShuttleStop | null> {
    if (!stopId) return null;
    const stop = await prisma.shuttleStop.findFirst({ where: { id: stopId, parkingId } });
    if (!stop) throw new ValidationException({ stopId: 'invalid_stop' });
    return stop;
  }

  private async meetingOf(parkingId: string, address: string | null): Promise<MeetingPoint | null> {
    return this.arrivals.meetingPoint({ parkingId, parking: { id: parkingId, address, listing: await this.listingOf(parkingId) } }, 'return');
  }

  // ---------------------------------------------------------------- the driver's list

  /** Today's returns to pick up at the airport, flights refreshed when due, soonest first. */
  public async pickups(
    actor: AuthenticatedStaff,
  ): Promise<{ serverTime: string; meetingPoint: MeetingPoint | null; rows: PickupRow[]; sharePosition: boolean }> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    const { start, end } = dayBounds(now, parking.timezone);
    const where: Prisma.ReservationWhereInput = {
      parkingId: parking.id,
      status: { in: PICKUP_STATUSES },
      OR: [{ returnAt: { gte: start, lte: end } }, { flightEstimatedAt: { gte: start, lte: end } }],
    };
    const ids = (await prisma.reservation.findMany({ where, select: { id: true } })).map(r => r.id);
    await this.flights.refreshBookings(ids);
    const [rows, signals, trips] = await Promise.all([
      prisma.reservation.findMany({
        where: { id: { in: ids } },
        orderBy: { returnAt: 'asc' },
        include: { stop: { select: { id: true, name: true } } },
      }),
      prisma.arrivalSignal.findMany({
        where: { reservationId: { in: ids }, kind: 'return', state: 'at_meeting_point' },
        select: { reservationId: true, atMeetingPointAt: true },
      }),
      prisma.shuttleTripPassenger.findMany({
        where: { reservationId: { in: ids }, trip: { status: 'running' } },
        select: { reservationId: true, tripId: true },
      }),
    ]);
    const meetingPoint = await this.arrivals.meetingPoint(
      { parkingId: parking.id, parking: { id: parking.id, address: parking.address, listing: await this.listingOf(parking.id) } },
      'return',
    );
    const list: PickupRow[] = rows
      .filter(r => now.getTime() - (r.flightLandedAt ?? r.flightEstimatedAt ?? r.returnAt).getTime() <= PICKUP_LIST_HOURS_AFTER * 3600000)
      .map(r => ({
        reservationId: r.id,
        reference: r.reference,
        customerName: r.customerName,
        passengers: r.passengers,
        plate: r.plate,
        status: r.status,
        returnAt: r.returnAt.toISOString(),
        flight: flightView(r),
        terminal: r.stop ? r.stop.name : terminalOf(r.flightTerminal, meetingPoint),
        stopId: r.stop?.id ?? null,
        stopName: r.stop?.name ?? null,
        atMeetingPointAt: iso(signals.find(s => s.reservationId === r.id)?.atMeetingPointAt),
        tripId: trips.find(t => t.reservationId === r.id)?.tripId ?? null,
        notice: returnNoticeView(r),
        leaveAt: pickupTimes(r, this.waveTimes(parking)).leaveAt.toISOString(),
      }));
    // At the meeting point first, then landed, then by expected landing.
    const rank = (r: PickupRow) => (r.atMeetingPointAt ? 0 : r.flight.status === 'landed' ? 1 : 2);
    const expected = (r: PickupRow) => r.flight.landedAt ?? r.flight.estimatedAt ?? r.flight.scheduledAt ?? r.returnAt;
    list.sort((a, b) => rank(a) - rank(b) || expected(a).localeCompare(expected(b)));
    // R-B: the driver's app knows before starting whether the position will be shared.
    return { serverTime: now.toISOString(), meetingPoint, rows: list, sharePosition: sharesPosition(parking.shuttleTracking) };
  }

  /** Today's arrived travellers waiting for the shuttle to the terminal (drop-off), earliest first. */
  public async departures(actor: AuthenticatedStaff): Promise<{ serverTime: string; rows: DepartureRow[]; sharePosition: boolean }> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    const rows = await prisma.reservation.findMany({
      where: {
        parkingId: parking.id,
        status: { in: DROPOFF_STATUSES },
        // Checked in during the last hours, or (no check-in time recorded) planned around now.
        OR: [
          { arrivedAt: { gte: new Date(now.getTime() - DROPOFF_LIST_HOURS_BEFORE * 3600000) } },
          {
            arrivedAt: null,
            arrivalAt: {
              gte: new Date(now.getTime() - DROPOFF_LIST_HOURS_BEFORE * 3600000),
              lte: new Date(now.getTime() + DROPOFF_LIST_HOURS_AFTER * 3600000),
            },
          },
        ],
      },
      include: { spot: { select: { code: true } }, stop: { select: { id: true, name: true } } },
      orderBy: [{ arrivedAt: 'asc' }, { arrivalAt: 'asc' }],
    });
    // F-A: the travellers still expected in the coming hours, greyed on the driver's list.
    const expected = await prisma.reservation.findMany({
      where: {
        parkingId: parking.id,
        status: 'upcoming',
        arrivalAt: { gte: new Date(now.getTime() - 3600000), lte: new Date(now.getTime() + DROPOFF_LIST_HOURS_AFTER * 3600000) },
      },
      include: { spot: { select: { code: true } }, stop: { select: { id: true, name: true } } },
      orderBy: { arrivalAt: 'asc' },
    });
    const trips = await prisma.shuttleTripPassenger.findMany({
      where: { reservationId: { in: rows.map(r => r.id) }, trip: { status: 'running' } },
      select: { reservationId: true, tripId: true },
    });
    const times = this.waveTimes(parking);
    const view = (r: (typeof rows)[number], isExpected: boolean): DepartureRow => ({
      reservationId: r.id,
      reference: r.reference,
      customerName: r.customerName,
      passengers: r.passengers,
      plate: r.plate,
      status: r.status,
      arrivalAt: r.arrivalAt.toISOString(),
      arrivedAt: iso(r.arrivedAt),
      spot: r.spot?.code ?? null,
      stopId: r.stop?.id ?? null,
      stopName: r.stop?.name ?? null,
      tripId: trips.find(t => t.reservationId === r.id)?.tripId ?? null,
      leaveAt: dropoffTimes(r, times).leaveAt.toISOString(),
      expected: isExpected,
    });
    return {
      serverTime: now.toISOString(),
      rows: [...rows.map(r => view(r, false)), ...expected.map(r => view(r, true))],
      sharePosition: sharesPosition(parking.shuttleTracking),
    };
  }

  /** The parking's shuttle timing (the forecast's figures). */
  private waveTimes(parking: { shuttleTravelMinutes: number; terminalLeadMinutes: number; landingDelayMinutes: number }): WaveTimes {
    return {
      shuttleTravelMinutes: parking.shuttleTravelMinutes,
      terminalLeadMinutes: parking.terminalLeadMinutes,
      landingDelayMinutes: parking.landingDelayMinutes,
    };
  }

  /**
   * F-A (06/10/2026): the travellers the shuttle dropped at the terminal, kept on the driver's
   * list by return day until they come back, plus those brought back or handed back today.
   */
  public async staying(actor: AuthenticatedStaff): Promise<Staying> {
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    const { start } = localDayBounds(localDate(now, parking.timezone), parking.timezone);
    const include = { spot: { select: { code: true } }, stop: { select: { name: true } } };
    const [away, back] = await Promise.all([
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: ['shuttled_out', 'return_requested'] } },
        include,
        orderBy: { returnAt: 'asc' },
      }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, OR: [{ status: 'back_at_parking' }, { status: 'returned', returnedAt: { gte: start } }] },
        include,
        orderBy: [{ returnedAt: 'desc' }, { returnAt: 'asc' }],
      }),
    ]);
    const view = (r: (typeof away)[number]): StayingRow => ({
      reservationId: r.id,
      reference: r.reference,
      customerName: r.customerName,
      passengers: r.passengers,
      plate: r.plate,
      status: r.status,
      returnAt: r.returnAt.toISOString(),
      returnFlight: r.returnFlight,
      flight: flightView(r),
      spot: r.spot?.code ?? null,
      stopName: r.stop?.name ?? null,
      returnedAt: iso(r.returnedAt),
    });
    const days = new Map<string, StayingRow[]>();
    for (const r of away) {
      const date = localDate(r.returnAt, parking.timezone);
      days.set(date, [...(days.get(date) ?? []), view(r)]);
    }
    return { serverTime: now.toISOString(), days: [...days.entries()].map(([date, rows]) => ({ date, rows })), returnedToday: back.map(view) };
  }

  // ---------------------------------------------------------------- trips (driver)

  /**
   * "Démarrer le trajet (N clients)": one running trip per driver. `pickup` (default) goes to the
   * airport for returning travellers; `dropoff` takes arrived travellers to the terminal (T-A).
   */
  public async start(
    actor: AuthenticatedStaff,
    data: {
      reservationIds: string[];
      vehicleId?: string | null;
      vehicle?: { model?: string | null; colour?: string | null; plate?: string | null } | null;
      direction?: ShuttleDirection;
      /** The stop served (D-A); null or absent: the airport. */
      stopId?: string | null;
    },
  ): Promise<StaffTrip> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const direction: ShuttleDirection = data.direction ?? 'pickup';
    const stop = await this.stopOf(parking.id, data.stopId);
    // No vehicle given: the one taken for the day (V-A).
    const me = await prisma.staff.findUnique({ where: { id: actor.id }, select: { vehicleId: true, vehicleSetAt: true } });
    const vehicleId = data.vehicleId ?? (!data.vehicle && me && holdsVehicleToday(me, parking.timezone) ? me.vehicleId : null);
    const running = await prisma.shuttleTrip.findFirst({ where: { driverId: actor.id, status: 'running' } });
    if (running) throw new HttpException(httpStatus.CONFLICT, 'A trip is already running', 'trip_already_running', { tripId: running.id });
    const ids = [...new Set(data.reservationIds)];
    const bookings = await prisma.reservation.findMany({
      where: { id: { in: ids }, operatorId: actor.operatorId },
      select: { id: true, status: true, passengers: true },
    });
    if (bookings.length !== ids.length || bookings.some(b => !canBoard(direction, b.status))) {
      throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'A booking cannot board this trip', 'invalid_passengers');
    }
    const onAnotherTrip = await prisma.shuttleTripPassenger.findFirst({ where: { reservationId: { in: ids }, trip: { status: 'running' } } });
    if (onAnotherTrip) throw new HttpException(httpStatus.CONFLICT, 'A traveller is already on a running trip', 'already_on_trip');

    let vehicle: TripVehicle & { id: string | null } = {
      id: null,
      model: data.vehicle?.model?.trim() || null,
      colour: data.vehicle?.colour?.trim() || null,
      plate: data.vehicle?.plate?.trim().toUpperCase() || null,
    };
    if (vehicleId) {
      const known = await prisma.shuttleVehicle.findFirst({ where: { id: vehicleId, operatorId: actor.operatorId } });
      if (!known) throw new HttpException(httpStatus.NOT_FOUND, 'Vehicle not found', 'not_found');
      if (!known.inService) throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'This vehicle is out of service', 'vehicle_out_of_service');
      const seated = bookings.reduce((sum, b) => sum + b.passengers, 0);
      if (known.seats !== null && seated > known.seats) {
        throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, `${seated} passengers for ${known.seats} seats`, 'too_many_passengers', {
          seats: known.seats,
          passengers: seated,
        });
      }
      vehicle = { id: known.id, model: known.model, colour: known.colour, plate: known.plate };
    }
    const now = new Date();
    const trip = await prisma.shuttleTrip.create({
      data: {
        operatorId: actor.operatorId,
        parkingId: parking.id,
        driverId: actor.id,
        vehicleId: vehicle.id,
        vehicleModel: vehicle.model,
        vehicleColour: vehicle.colour,
        vehiclePlate: vehicle.plate,
        direction,
        stopId: stop?.id ?? null,
        stopKind: stop?.kind ?? null,
        stopName: stop?.name ?? null,
        status: 'running',
        startedAt: now,
        expiresAt: new Date(now.getTime() + TRIP_MAX_MINUTES * 60000),
        passengers: { create: ids.map(reservationId => ({ reservationId })) },
      },
    });
    await this.audit.record(actor, {
      action: 'shuttle.trip_started',
      entityType: 'shuttle_trip',
      entityId: trip.id,
      details: { direction, passengers: ids.length, reservationIds: ids, vehicle: vehicle.model ?? null, stop: stop?.name ?? null },
    });
    const view = (await this.staffTrip(trip.id))!;
    await this.notifyStarted(actor, trip, view, ids);
    return view;
  }

  /** N-A: the team hears of the departure; the passengers of a pick-up, that their shuttle left. */
  private async notifyStarted(actor: AuthenticatedStaff, trip: ShuttleTrip, view: StaffTrip, reservationIds: string[]) {
    const facts = this.facts(view);
    await this.push.notifyStaff(actor.operatorId, 'shuttles', tripStartedPush(facts), {
      excludeStaffId: actor.id,
      data: { type: 'shuttle', event: 'started', tripId: trip.id, direction: trip.direction },
      collapseId: `shuttle-${trip.id}`,
    });
    if (trip.direction !== 'pickup') return;
    const here = (await this.locations.locations([trip.parkingId])).get(trip.parkingId);
    const eta = here && view.stop ? this.estimator(here, view.stop).etaMinutes : null;
    await this.push.notifyTravellers(reservationIds, shuttleLeavingPush({ ...facts, etaMinutes: eta }), {
      data: { type: 'shuttle', event: 'started', tripId: trip.id },
      collapseId: `shuttle-${trip.id}`,
    });
  }

  private facts(view: StaffTrip): ShuttleTripFacts {
    return {
      direction: view.direction,
      driverFirstName: firstName(view.driverName),
      vehicle: vehicleShort(view.vehicle),
      stopName: view.stop && !view.stop.builtIn ? view.stop.name : null,
      passengers: view.passengers.reduce((sum, p) => sum + p.passengers, 0),
    };
  }

  /** The driver's latest position: one per 10 s at most, kept only while the trip runs. */
  public async position(
    actor: AuthenticatedStaff,
    tripId: string,
    position: { lat: number; lng: number; accuracy?: number | null; recordedAt: string },
  ): Promise<StaffTrip> {
    await this.sweep({ operatorId: actor.operatorId });
    const trip = await prisma.shuttleTrip.findFirst({ where: { id: tripId, driverId: actor.id } });
    if (!trip) throw new HttpException(httpStatus.NOT_FOUND, 'Trip not found', 'not_found');
    if (trip.status !== 'running') throw notRunning();
    const { shuttleTracking } = await prisma.parking.findUniqueOrThrow({ where: { id: trip.parkingId }, select: { shuttleTracking: true } });
    if (!sharesPosition(shuttleTracking)) {
      throw new HttpException(httpStatus.CONFLICT, "The parking does not share its shuttles' position", 'shuttle_tracking_off');
    }
    const now = new Date();
    const recordedAt = new Date(position.recordedAt);
    if (recordedAt.getTime() > now.getTime() + 60000)
      throw new HttpException(httpStatus.BAD_REQUEST, 'The position is dated in the future', 'invalid_recorded_at');
    if (now.getTime() - recordedAt.getTime() > TRIP_POSITION_MAX_AGE_SECONDS * 1000) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'The position is too old', 'position_too_old');
    }
    if (trip.positionRecordedAt && recordedAt <= trip.positionRecordedAt) return (await this.staffTrip(trip.id))!;
    const { count } = await prisma.shuttleTrip.updateMany({
      where: {
        id: trip.id,
        status: 'running',
        expiresAt: { gt: now },
        OR: [
          { positionReceivedAt: null },
          { positionReceivedAt: { lte: new Date(now.getTime() - TRIP_POSITION_MIN_INTERVAL_SECONDS * 1000 + POSITION_INTERVAL_TOLERANCE_MS) } },
        ],
      },
      data: { lat: position.lat, lng: position.lng, accuracyM: position.accuracy ?? null, positionRecordedAt: recordedAt, positionReceivedAt: now },
    });
    if (!count) {
      const current = await prisma.shuttleTrip.findUnique({ where: { id: trip.id } });
      if (current?.status !== 'running') throw notRunning();
      const waited = current.positionReceivedAt ? (now.getTime() - current.positionReceivedAt.getTime()) / 1000 : 0;
      throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'One position every 10 seconds at most', 'too_many_positions', {
        retryAfterSeconds: Math.max(1, Math.ceil(TRIP_POSITION_MIN_INTERVAL_SECONDS - waited)),
      });
    }
    const view = (await this.staffTrip(trip.id))!;
    // N-A: the shuttle reached the stop, its passengers hear it once (only when they may see the shuttle, R-B).
    if (
      travellersSeePosition(shuttleTracking) &&
      trip.direction === 'pickup' &&
      !trip.arrivedNotifiedAt &&
      view.stop &&
      haversineMeters(position, view.stop) <= STOP_REACHED_METERS
    ) {
      const { count: flagged } = await prisma.shuttleTrip.updateMany({
        where: { id: trip.id, arrivedNotifiedAt: null },
        data: { arrivedNotifiedAt: now },
      });
      if (flagged) {
        await this.push.notifyTravellers(
          view.passengers.map(p => p.reservationId),
          shuttleArrivedPush(this.facts(view)),
          { data: { type: 'shuttle', event: 'arrived', tripId: trip.id }, collapseId: `shuttle-${trip.id}` },
        );
      }
    }
    return view;
  }

  /**
   * "Clients récupérés · retour parking" / "Clients déposés": the trip ends, the position is erased
   * at once. A drop-off marks its passengers "Parti en navette".
   */
  public async end(actor: AuthenticatedStaff, tripId: string): Promise<StaffTrip> {
    const trip = await prisma.shuttleTrip.findFirst({ where: { id: tripId, operatorId: actor.operatorId }, include: { passengers: true } });
    if (!trip) throw new HttpException(httpStatus.NOT_FOUND, 'Trip not found', 'not_found');
    // The driver, or someone who manages bookings (manager, agent) closing a forgotten trip.
    if (trip.driverId !== actor.id && !can(actor.role, 'reservations:manage')) {
      throw new HttpException(httpStatus.FORBIDDEN, 'Only the driver can end this trip', 'forbidden');
    }
    const now = new Date();
    const { count } = await prisma.shuttleTrip.updateMany({
      where: { id: trip.id, status: 'running' },
      data: { status: 'ended', endReason: 'completed', endedAt: now, ...ERASED_POSITION, positionReceivedAt: null },
    });
    if (count) {
      await this.audit.record(actor, {
        action: 'shuttle.trip_ended',
        entityType: 'shuttle_trip',
        entityId: trip.id,
        details: { reason: 'completed', direction: trip.direction },
      });
      // A drop-off leaves its passengers "Parti en navette"; a pick-up brings them "De retour au parking" (A, 06/10/2026).
      const ids = trip.passengers.map(p => p.reservationId);
      const from: ReservationStatus[] = trip.direction === 'dropoff' ? ['arrived'] : PICKUP_STATUSES;
      const to: ReservationStatus = trip.direction === 'dropoff' ? 'shuttled_out' : 'back_at_parking';
      const moved = await prisma.reservation.findMany({ where: { id: { in: ids }, status: { in: from } }, select: { id: true, status: true } });
      if (moved.length) {
        await prisma.reservation.updateMany({ where: { id: { in: moved.map(r => r.id) }, status: { in: from } }, data: { status: to } });
        for (const r of moved) {
          await this.audit.record(actor, {
            action: 'reservation.status_changed',
            entityType: 'reservation',
            entityId: r.id,
            details: { from: r.status, to, by: trip.direction === 'dropoff' ? 'shuttle_dropoff' : 'shuttle_pickup', tripId: trip.id },
          });
        }
        // B (06/10/2026): "Bon voyage" to the travellers just dropped at the terminal.
        if (trip.direction === 'dropoff') {
          const parking = await prisma.parking.findUnique({
            where: { id: trip.parkingId },
            select: { name: true, listing: { select: { title: true } } },
          });
          await this.messages.droppedOff(
            moved.map(r => r.id),
            parking?.listing?.title ?? parking?.name ?? '',
          );
        }
      }
    }
    const view = (await this.staffTrip(trip.id))!;
    if (count) {
      await this.push.notifyStaff(actor.operatorId, 'shuttles', tripEndedPush(this.facts(view)), {
        excludeStaffId: actor.id,
        data: { type: 'shuttle', event: 'ended', tripId: trip.id, direction: trip.direction },
        collapseId: `shuttle-${trip.id}`,
      });
    }
    return view;
  }

  /** P-A: the operator's running shuttles on a map, for the whole team (position, where they go, how far). */
  public async live(actor: AuthenticatedStaff): Promise<LiveShuttles> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    const [trips, meeting, here] = await Promise.all([
      prisma.shuttleTrip.findMany({
        where: { operatorId: actor.operatorId, status: 'running' },
        include: {
          driver: { select: { name: true, firstName: true } },
          stop: true,
          passengers: { include: { reservation: { select: { passengers: true } } } },
        },
        orderBy: { startedAt: 'asc' },
      }),
      this.meetingOf(parking.id, parking.address),
      this.locations.locations([parking.id]).then(m => m.get(parking.id) ?? null),
    ]);
    const stops = await this.stopsOf(parking.id, meeting);
    const airport = airportStop(meeting);
    return {
      serverTime: now.toISOString(),
      parking: { id: parking.id, name: parking.name, lat: here?.lat ?? null, lng: here?.lng ?? null },
      stops,
      trips: trips.map(t => {
        const position = t.lat !== null && t.lng !== null ? { lat: t.lat, lng: t.lng } : null;
        const stop = t.stop ? stopView(t.stop) : airport;
        const estimate = (to: { lat: number; lng: number } | null) => {
          if (!position || !to) return null;
          const e = this.estimator(position, to);
          return { distanceM: e.distanceM, etaMinutes: e.etaMinutes };
        };
        return {
          id: t.id,
          direction: t.direction,
          driverId: t.driverId,
          driverName: t.driver.name,
          vehicle: { model: t.vehicleModel, colour: t.vehicleColour, plate: t.vehiclePlate },
          stop,
          passengers: t.passengers.reduce((sum, p) => sum + p.reservation.passengers, 0),
          startedAt: t.startedAt.toISOString(),
          expiresAt: t.expiresAt.toISOString(),
          position,
          positionAgeSeconds:
            position && t.positionReceivedAt ? Math.max(0, Math.round((now.getTime() - t.positionReceivedAt.getTime()) / 1000)) : null,
          toStop: estimate(stop),
          toParking: estimate(here),
        };
      }),
    };
  }

  /** The driver's running trip, or null. */
  public async current(actor: AuthenticatedStaff): Promise<StaffTrip | null> {
    await this.sweep({ operatorId: actor.operatorId });
    const trip = await prisma.shuttleTrip.findFirst({ where: { driverId: actor.id, status: 'running' }, select: { id: true } });
    return trip ? this.staffTrip(trip.id) : null;
  }

  /** The operator's running trips (for the planning's "Navette en route (Karim)"). */
  public async running(
    actor: AuthenticatedStaff,
  ): Promise<{ id: string; direction: ShuttleDirection; driverId: string; driverName: string; startedAt: string; reservationIds: string[] }[]> {
    await this.sweep({ operatorId: actor.operatorId });
    const trips = await prisma.shuttleTrip.findMany({
      where: { operatorId: actor.operatorId, status: 'running' },
      include: { driver: { select: { name: true, firstName: true } }, passengers: { select: { reservationId: true } } },
      orderBy: { startedAt: 'asc' },
    });
    return trips.map(t => ({
      id: t.id,
      direction: t.direction,
      driverId: t.driverId,
      driverName: t.driver.name,
      startedAt: t.startedAt.toISOString(),
      reservationIds: t.passengers.map(p => p.reservationId),
    }));
  }

  // ---------------------------------------------------------------- traveller

  /** The shuttle coming for this booking: only while a running pick-up trip includes it. */
  public async forTraveller(reservationId: string): Promise<TravellerShuttle | null> {
    await this.sweep({ reservationId });
    const passenger = await prisma.shuttleTripPassenger.findFirst({
      where: { reservationId, trip: { status: 'running', direction: 'pickup' } },
      include: {
        trip: {
          include: {
            driver: { select: { name: true, firstName: true } },
            parking: { select: { id: true, address: true, shuttleTracking: true } },
            stop: true,
          },
        },
      },
    });
    if (!passenger) return null;
    const trip = passenger.trip;
    const meeting = await this.meetingOf(trip.parkingId, trip.parking.address);
    // R-B: without "everyone", the traveller knows the shuttle left, not where it is.
    return this.travellerView(trip, {
      mine: true,
      meeting,
      destination: this.stopDestination(trip, meeting),
      showPosition: travellersSeePosition(trip.parking.shuttleTracking),
    });
  }

  /**
   * S-A "Navette en direct le jour J": from the arrival day to the return day, the parking's running
   * shuttles, with the distance to the parking (arrival, stay) or to the meeting point (return day).
   * Outside those days `phase` is null and the list empty. The traveller's own trip is flagged.
   */
  public async forStay(booking: {
    id: string;
    status: ReservationStatus;
    arrivalAt: Date;
    returnAt: Date;
    parkingId: string;
    parking: { id: string; address: string | null; timezone: string; shuttleTracking: ShuttleTracking };
  }): Promise<StayShuttles> {
    const now = new Date();
    const tz = booking.parking.timezone;
    const phase = stayPhase(booking, localDate(now, tz), localDate(booking.arrivalAt, tz), localDate(booking.returnAt, tz));
    // R-B: the block exists only when the parking shows its shuttles to the travellers.
    if (!phase || !travellersSeePosition(booking.parking.shuttleTracking)) return { phase: null, serverTime: now.toISOString(), shuttles: [] };
    await this.sweep({ parkingId: booking.parkingId });
    const trips = await prisma.shuttleTrip.findMany({
      where: { parkingId: booking.parkingId, status: 'running' },
      include: { driver: { select: { name: true, firstName: true } }, passengers: { select: { reservationId: true } }, stop: true },
      orderBy: { startedAt: 'asc' },
    });
    if (!trips.length) return { phase, serverTime: now.toISOString(), shuttles: [] };
    const listing = await this.listingOf(booking.parkingId);
    const meeting = await this.arrivals.meetingPoint({ parkingId: booking.parkingId, parking: { ...booking.parking, listing } }, 'return');
    let destination: ShuttleDestination | null = null;
    if (phase === 'return') {
      destination = meeting ? { kind: 'meeting_point', lat: meeting.lat, lng: meeting.lng, label: meeting.label } : null;
    } else {
      const here = (await this.locations.locations([booking.parkingId])).get(booking.parkingId);
      destination = here ? { kind: 'parking', ...here, label: null } : null;
    }
    return {
      phase,
      serverTime: now.toISOString(),
      shuttles: trips.map(trip =>
        this.travellerView(trip, {
          mine: trip.passengers.some(p => p.reservationId === booking.id),
          meeting: phase === 'return' ? meeting : null,
          // On the return day a trip serving a stop (the station…) is measured to that stop.
          destination: phase === 'return' ? this.stopDestination(trip, meeting) : destination,
          showPosition: true,
        }),
      ),
    };
  }

  private travellerView(
    trip: ShuttleTrip & { driver: { name: string; firstName?: string } },
    options: { mine: boolean; meeting: MeetingPoint | null; destination: ShuttleDestination | null; showPosition: boolean },
  ): TravellerShuttle {
    const now = new Date();
    const position = options.showPosition && trip.lat !== null && trip.lng !== null ? { lat: trip.lat, lng: trip.lng } : null;
    const estimate = position && options.destination ? this.estimator(position, options.destination) : null;
    return {
      tripId: trip.id,
      direction: trip.direction,
      mine: options.mine,
      startedAt: trip.startedAt.toISOString(),
      vehicle: { model: trip.vehicleModel, colour: trip.vehicleColour, plate: trip.vehiclePlate },
      driverFirstName: trip.driver.firstName || firstName(trip.driver.name),
      position,
      positionAgeSeconds:
        position && trip.positionReceivedAt ? Math.max(0, Math.round((now.getTime() - trip.positionReceivedAt.getTime()) / 1000)) : null,
      distanceM: estimate?.distanceM ?? null,
      etaMinutes: estimate?.etaMinutes ?? null,
      etaAt: estimate ? new Date(now.getTime() + estimate.etaMinutes * 60000).toISOString() : null,
      meetingPoint: options.meeting,
      destination: options.destination,
    };
  }

  /** Where a trip goes: its stop (D-A), else the airport's meeting point. */
  private stopDestination(trip: ShuttleTrip & { stop: ShuttleStop | null }, meeting: MeetingPoint | null): ShuttleDestination | null {
    if (trip.stop) return { kind: 'meeting_point', lat: trip.stop.lat, lng: trip.stop.lng, label: trip.stop.name };
    return meeting ? { kind: 'meeting_point', lat: meeting.lat, lng: meeting.lng, label: meeting.label } : null;
  }

  // ---------------------------------------------------------------- retention

  /** Ends the trips past their 90 minutes, erasing their position. Lazily on reads, and by the cron. */
  public async sweep(scope: { operatorId?: string; parkingId?: string; reservationId?: string } = {}): Promise<number> {
    const now = new Date();
    const where: Prisma.ShuttleTripWhereInput = {
      status: 'running',
      expiresAt: { lte: now },
      ...(scope.operatorId ? { operatorId: scope.operatorId } : {}),
      ...(scope.parkingId ? { parkingId: scope.parkingId } : {}),
      ...(scope.reservationId ? { passengers: { some: { reservationId: scope.reservationId } } } : {}),
    };
    const expired = await prisma.shuttleTrip.findMany({ where, select: { id: true, operatorId: true, driverId: true } });
    if (!expired.length) return 0;
    await prisma.shuttleTrip.updateMany({
      where: { id: { in: expired.map(t => t.id) }, status: 'running' },
      data: { status: 'ended', endReason: 'expired', endedAt: now, ...ERASED_POSITION, positionReceivedAt: null },
    });
    await prisma.auditLog.createMany({
      data: expired.map(t => ({
        operatorId: t.operatorId,
        staffId: t.driverId,
        action: 'shuttle.trip_ended',
        entityType: 'shuttle_trip',
        entityId: t.id,
        details: { reason: 'expired' },
      })),
    });
    return expired.length;
  }

  // ---------------------------------------------------------------- internals

  private async listingOf(parkingId: string) {
    return prisma.listing.findUnique({ where: { parkingId }, include: { airport: true } });
  }

  private async staffTrip(id: string): Promise<StaffTrip | null> {
    const trip = await prisma.shuttleTrip.findUnique({
      where: { id },
      include: {
        driver: { select: { name: true, firstName: true } },
        parking: { select: { id: true, address: true, shuttleTracking: true } },
        stop: true,
        passengers: {
          include: {
            reservation: { select: { id: true, reference: true, customerName: true, passengers: true, plate: true, flightTerminal: true } },
          },
        },
      },
    });
    if (!trip) return null;
    const now = new Date();
    const meeting = await this.meetingOf(trip.parkingId, trip.parking.address);
    return {
      id: trip.id,
      status: trip.status,
      direction: trip.direction,
      driverId: trip.driverId,
      driverName: trip.driver.name,
      vehicle: { model: trip.vehicleModel, colour: trip.vehicleColour, plate: trip.vehiclePlate },
      startedAt: trip.startedAt.toISOString(),
      expiresAt: trip.expiresAt.toISOString(),
      endedAt: iso(trip.endedAt),
      endReason: trip.endReason,
      secondsLeft: trip.status === 'running' ? Math.max(0, Math.floor((trip.expiresAt.getTime() - now.getTime()) / 1000)) : 0,
      passengers: trip.passengers.map(p => ({
        reservationId: p.reservation.id,
        reference: p.reservation.reference,
        customerName: p.reservation.customerName,
        passengers: p.reservation.passengers,
        plate: p.reservation.plate,
        terminal: terminalOf(p.reservation.flightTerminal, meeting),
      })),
      // The driver's own position is never sent back (the phone has it); only when it was last received.
      positionUpdatedAt: trip.status === 'running' ? iso(trip.positionReceivedAt) : null,
      meetingPoint: meeting,
      stop: trip.stop ? stopView(trip.stop) : airportStop(meeting),
      sharePosition: sharesPosition(trip.parking.shuttleTracking),
    };
  }
}

/** "Terminal 1" from the flight's terminal, else the meeting point's label. */
export function terminalOf(flightTerminal: string | null, meeting: MeetingPoint | null): string | null {
  if (flightTerminal) return /^\d+[A-Z]?$/i.test(flightTerminal) ? `Terminal ${flightTerminal.toUpperCase()}` : flightTerminal;
  return meeting?.label ?? null;
}

export type { ShuttleTrip };
