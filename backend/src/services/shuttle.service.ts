import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Prisma, ReservationStatus, ShuttleTrip, ShuttleVehicle } from '@/database';
import { ArrivalEstimator, straightLineEstimate } from '@/domain/arrival';
import { localDate } from '@/domain/time';
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
  TRIP_POSITION_MIN_INTERVAL_SECONDS,
} from '@/domain/shuttle';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { ArrivalService, MeetingPoint } from './arrival.service';
import { AuditService } from './audit.service';
import { FlightTrackingService } from './flight-tracking.service';
import { ParkingLocationService } from './parking-location.service';
import { ParkingService } from './parking.service';

/** Fields of the position: all cleared together, whenever a trip ends. */
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
  /** The traveller said (or was seen) at the meeting point. */
  atMeetingPointAt: string | null;
  /** Id of the running trip this traveller is on, if any. */
  tripId: string | null;
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
  tripId: string | null;
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
const WITH_DRIVER = { driver: { select: { name: true } } } as const;
const vehicleView = (v: ShuttleVehicle & { driver: { name: string } | null }): ShuttleVehicleView => ({
  id: v.id,
  model: v.model,
  colour: v.colour,
  plate: v.plate,
  seats: v.seats,
  inService: v.inService,
  driverId: v.driverId,
  driverName: v.driver?.name ?? null,
});

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
  public estimator: ArrivalEstimator = straightLineEstimate;

  // ---------------------------------------------------------------- vehicles

  public async vehicles(actor: AuthenticatedStaff): Promise<ShuttleVehicleView[]> {
    const rows = await prisma.shuttleVehicle.findMany({
      where: { operatorId: actor.operatorId },
      include: WITH_DRIVER,
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(vehicleView);
  }

  public async addVehicle(actor: AuthenticatedStaff, data: VehicleInput & { model: string }): Promise<ShuttleVehicleView> {
    const fields = await this.vehicleFields(actor, data);
    const vehicle = await prisma.shuttleVehicle.create({
      data: { operatorId: actor.operatorId, ...fields, model: fields.model! },
      include: WITH_DRIVER,
    });
    await this.audit.record(actor, {
      action: 'shuttle.vehicle_added',
      entityType: 'shuttle_vehicle',
      entityId: vehicle.id,
      details: { model: vehicle.model },
    });
    return vehicleView(vehicle);
  }

  /** Edits the sheet: fields left out keep their value, `null` clears one. */
  public async updateVehicle(actor: AuthenticatedStaff, id: string, data: VehicleInput): Promise<ShuttleVehicleView> {
    const existing = await prisma.shuttleVehicle.findFirst({ where: { id, operatorId: actor.operatorId } });
    if (!existing) throw new HttpException(httpStatus.NOT_FOUND, 'Vehicle not found', 'not_found');
    const fields = await this.vehicleFields(actor, data);
    const vehicle = await prisma.shuttleVehicle.update({ where: { id }, data: fields, include: WITH_DRIVER });
    await this.audit.record(actor, {
      action: 'shuttle.vehicle_updated',
      entityType: 'shuttle_vehicle',
      entityId: vehicle.id,
      details: { model: vehicle.model, inService: vehicle.inService, seats: vehicle.seats },
    });
    return vehicleView(vehicle);
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
        if (!driver) throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'Unknown driver', 'invalid_driver', { driverId: 'invalid_driver' });
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

  // ---------------------------------------------------------------- the driver's list

  /** Today's returns to pick up at the airport, flights refreshed when due, soonest first. */
  public async pickups(actor: AuthenticatedStaff): Promise<{ serverTime: string; meetingPoint: MeetingPoint | null; rows: PickupRow[] }> {
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
      prisma.reservation.findMany({ where: { id: { in: ids } }, orderBy: { returnAt: 'asc' } }),
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
        terminal: terminalOf(r.flightTerminal, meetingPoint),
        atMeetingPointAt: iso(signals.find(s => s.reservationId === r.id)?.atMeetingPointAt),
        tripId: trips.find(t => t.reservationId === r.id)?.tripId ?? null,
      }));
    // At the meeting point first, then landed, then by expected landing.
    const rank = (r: PickupRow) => (r.atMeetingPointAt ? 0 : r.flight.status === 'landed' ? 1 : 2);
    const expected = (r: PickupRow) => r.flight.landedAt ?? r.flight.estimatedAt ?? r.flight.scheduledAt ?? r.returnAt;
    list.sort((a, b) => rank(a) - rank(b) || expected(a).localeCompare(expected(b)));
    return { serverTime: now.toISOString(), meetingPoint, rows: list };
  }

  /** Today's arrived travellers waiting for the shuttle to the terminal (drop-off), earliest first. */
  public async departures(actor: AuthenticatedStaff): Promise<{ serverTime: string; rows: DepartureRow[] }> {
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
      include: { spot: { select: { code: true } } },
      orderBy: [{ arrivedAt: 'asc' }, { arrivalAt: 'asc' }],
    });
    const trips = await prisma.shuttleTripPassenger.findMany({
      where: { reservationId: { in: rows.map(r => r.id) }, trip: { status: 'running' } },
      select: { reservationId: true, tripId: true },
    });
    return {
      serverTime: now.toISOString(),
      rows: rows.map(r => ({
        reservationId: r.id,
        reference: r.reference,
        customerName: r.customerName,
        passengers: r.passengers,
        plate: r.plate,
        status: r.status,
        arrivalAt: r.arrivalAt.toISOString(),
        arrivedAt: iso(r.arrivedAt),
        spot: r.spot?.code ?? null,
        tripId: trips.find(t => t.reservationId === r.id)?.tripId ?? null,
      })),
    };
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
    },
  ): Promise<StaffTrip> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const direction: ShuttleDirection = data.direction ?? 'pickup';
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
    if (data.vehicleId) {
      const known = await prisma.shuttleVehicle.findFirst({ where: { id: data.vehicleId, operatorId: actor.operatorId } });
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
      details: { direction, passengers: ids.length, reservationIds: ids, vehicle: vehicle.model ?? null },
    });
    return (await this.staffTrip(trip.id))!;
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
        OR: [{ positionReceivedAt: null }, { positionReceivedAt: { lte: new Date(now.getTime() - TRIP_POSITION_MIN_INTERVAL_SECONDS * 1000) } }],
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
    return (await this.staffTrip(trip.id))!;
  }

  /**
   * "Clients récupérés · retour parking" / "Clients déposés": the trip ends, the position is erased
   * at once. A drop-off marks its passengers "Parti en navette".
   */
  public async end(actor: AuthenticatedStaff, tripId: string): Promise<StaffTrip> {
    const trip = await prisma.shuttleTrip.findFirst({ where: { id: tripId, operatorId: actor.operatorId }, include: { passengers: true } });
    if (!trip) throw new HttpException(httpStatus.NOT_FOUND, 'Trip not found', 'not_found');
    // The driver, or a manager/agent closing a forgotten trip.
    if (trip.driverId !== actor.id && actor.role !== 'manager' && actor.role !== 'agent') {
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
      if (trip.direction === 'dropoff') {
        const ids = trip.passengers.map(p => p.reservationId);
        const { count: moved } = await prisma.reservation.updateMany({
          where: { id: { in: ids }, status: 'arrived' },
          data: { status: 'shuttled_out' },
        });
        if (moved) {
          await this.audit.record(actor, {
            action: 'reservation.status_changed',
            entityType: 'reservation',
            entityId: trip.id,
            details: { from: 'arrived', to: 'shuttled_out', reservationIds: ids, by: 'shuttle_dropoff' },
          });
        }
      }
    }
    return (await this.staffTrip(trip.id))!;
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
      include: { driver: { select: { name: true } }, passengers: { select: { reservationId: true } } },
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
      include: { trip: { include: { driver: { select: { name: true } }, parking: { select: { id: true, address: true } } } } },
    });
    if (!passenger) return null;
    const trip = passenger.trip;
    const meeting = await this.arrivals.meetingPoint(
      { parkingId: trip.parkingId, parking: { id: trip.parkingId, address: trip.parking.address, listing: await this.listingOf(trip.parkingId) } },
      'return',
    );
    const destination: ShuttleDestination | null = meeting
      ? { kind: 'meeting_point', lat: meeting.lat, lng: meeting.lng, label: meeting.label }
      : null;
    return this.travellerView(trip, { mine: true, meeting, destination });
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
    parking: { id: string; address: string | null; timezone: string };
  }): Promise<StayShuttles> {
    const now = new Date();
    const tz = booking.parking.timezone;
    const phase = stayPhase(booking, localDate(now, tz), localDate(booking.arrivalAt, tz), localDate(booking.returnAt, tz));
    if (!phase) return { phase: null, serverTime: now.toISOString(), shuttles: [] };
    await this.sweep({ parkingId: booking.parkingId });
    const trips = await prisma.shuttleTrip.findMany({
      where: { parkingId: booking.parkingId, status: 'running' },
      include: { driver: { select: { name: true } }, passengers: { select: { reservationId: true } } },
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
          destination,
        }),
      ),
    };
  }

  private travellerView(
    trip: ShuttleTrip & { driver: { name: string } },
    options: { mine: boolean; meeting: MeetingPoint | null; destination: ShuttleDestination | null },
  ): TravellerShuttle {
    const now = new Date();
    const position = trip.lat !== null && trip.lng !== null ? { lat: trip.lat, lng: trip.lng } : null;
    const estimate = position && options.destination ? this.estimator(position, options.destination) : null;
    return {
      tripId: trip.id,
      direction: trip.direction,
      mine: options.mine,
      startedAt: trip.startedAt.toISOString(),
      vehicle: { model: trip.vehicleModel, colour: trip.vehicleColour, plate: trip.vehiclePlate },
      driverFirstName: firstName(trip.driver.name),
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
        driver: { select: { name: true } },
        parking: { select: { id: true, address: true } },
        passengers: {
          include: {
            reservation: { select: { id: true, reference: true, customerName: true, passengers: true, plate: true, flightTerminal: true } },
          },
        },
      },
    });
    if (!trip) return null;
    const now = new Date();
    const meeting = await this.arrivals.meetingPoint(
      { parkingId: trip.parkingId, parking: { id: trip.parkingId, address: trip.parking.address, listing: await this.listingOf(trip.parkingId) } },
      'return',
    );
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
    };
  }
}

/** "Terminal 1" from the flight's terminal, else the meeting point's label. */
export function terminalOf(flightTerminal: string | null, meeting: MeetingPoint | null): string | null {
  if (flightTerminal) return /^\d+[A-Z]?$/i.test(flightTerminal) ? `Terminal ${flightTerminal.toUpperCase()}` : flightTerminal;
  return meeting?.label ?? null;
}

export type { ShuttleTrip };
