import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Prisma, ReservationStatus, ShuttleTrip, ShuttleVehicle } from '@/database';
import { ArrivalEstimator, straightLineEstimate } from '@/domain/arrival';
import { localDate } from '@/domain/time';
import {
  canPickUp,
  firstName,
  PICKUP_LIST_HOURS_AFTER,
  PICKUP_LIST_HOURS_BEFORE,
  PICKUP_STATUSES,
  TRIP_MAX_MINUTES,
  TRIP_POSITION_MAX_AGE_SECONDS,
  TRIP_POSITION_MIN_INTERVAL_SECONDS,
} from '@/domain/shuttle';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { ArrivalService, MeetingPoint } from './arrival.service';
import { AuditService } from './audit.service';
import { FlightTrackingService } from './flight-tracking.service';
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

export interface StaffTrip {
  id: string;
  status: string;
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
  startedAt: string;
  vehicle: TripVehicle;
  driverFirstName: string;
  position: { lat: number; lng: number } | null;
  positionAgeSeconds: number | null;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  meetingPoint: MeetingPoint | null;
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
  public estimator: ArrivalEstimator = straightLineEstimate;

  // ---------------------------------------------------------------- vehicles

  public async vehicles(actor: AuthenticatedStaff): Promise<ShuttleVehicle[]> {
    return prisma.shuttleVehicle.findMany({ where: { operatorId: actor.operatorId }, orderBy: { createdAt: 'asc' } });
  }

  public async addVehicle(
    actor: AuthenticatedStaff,
    data: { model: string; colour?: string | null; plate?: string | null },
  ): Promise<ShuttleVehicle> {
    const vehicle = await prisma.shuttleVehicle.create({
      data: {
        operatorId: actor.operatorId,
        model: data.model.trim(),
        colour: data.colour?.trim() || null,
        plate: data.plate?.trim().toUpperCase() || null,
      },
    });
    await this.audit.record(actor, {
      action: 'shuttle.vehicle_added',
      entityType: 'shuttle_vehicle',
      entityId: vehicle.id,
      details: { model: vehicle.model },
    });
    return vehicle;
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

  // ---------------------------------------------------------------- trips (driver)

  /** "Démarrer le trajet (N clients)": one running trip per driver. */
  public async start(
    actor: AuthenticatedStaff,
    data: {
      reservationIds: string[];
      vehicleId?: string | null;
      vehicle?: { model?: string | null; colour?: string | null; plate?: string | null } | null;
    },
  ): Promise<StaffTrip> {
    await this.sweep({ operatorId: actor.operatorId });
    const parking = await this.parkings.getPrimary(actor);
    const running = await prisma.shuttleTrip.findFirst({ where: { driverId: actor.id, status: 'running' } });
    if (running) throw new HttpException(httpStatus.CONFLICT, 'A trip is already running', 'trip_already_running', { tripId: running.id });
    const ids = [...new Set(data.reservationIds)];
    const bookings = await prisma.reservation.findMany({
      where: { id: { in: ids }, operatorId: actor.operatorId },
      select: { id: true, status: true },
    });
    if (bookings.length !== ids.length || bookings.some(b => !canPickUp(b.status))) {
      throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'A booking cannot be picked up', 'invalid_passengers');
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
      details: { passengers: ids.length, reservationIds: ids, vehicle: vehicle.model ?? null },
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

  /** "Clients récupérés · retour parking": the trip ends, the position is erased at once. */
  public async end(actor: AuthenticatedStaff, tripId: string): Promise<StaffTrip> {
    const trip = await prisma.shuttleTrip.findFirst({ where: { id: tripId, operatorId: actor.operatorId } });
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
    if (count)
      await this.audit.record(actor, {
        action: 'shuttle.trip_ended',
        entityType: 'shuttle_trip',
        entityId: trip.id,
        details: { reason: 'completed' },
      });
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
  ): Promise<{ id: string; driverId: string; driverName: string; startedAt: string; reservationIds: string[] }[]> {
    await this.sweep({ operatorId: actor.operatorId });
    const trips = await prisma.shuttleTrip.findMany({
      where: { operatorId: actor.operatorId, status: 'running' },
      include: { driver: { select: { name: true } }, passengers: { select: { reservationId: true } } },
      orderBy: { startedAt: 'asc' },
    });
    return trips.map(t => ({
      id: t.id,
      driverId: t.driverId,
      driverName: t.driver.name,
      startedAt: t.startedAt.toISOString(),
      reservationIds: t.passengers.map(p => p.reservationId),
    }));
  }

  // ---------------------------------------------------------------- traveller

  /** The shuttle coming for this booking: only while a running trip includes it. */
  public async forTraveller(reservationId: string): Promise<TravellerShuttle | null> {
    await this.sweep({ reservationId });
    const passenger = await prisma.shuttleTripPassenger.findFirst({
      where: { reservationId, trip: { status: 'running' } },
      include: { trip: { include: { driver: { select: { name: true } }, parking: { select: { id: true, address: true } } } } },
    });
    if (!passenger) return null;
    const trip = passenger.trip;
    const now = new Date();
    const meeting = await this.arrivals.meetingPoint(
      { parkingId: trip.parkingId, parking: { id: trip.parkingId, address: trip.parking.address, listing: await this.listingOf(trip.parkingId) } },
      'return',
    );
    const position = trip.lat !== null && trip.lng !== null ? { lat: trip.lat, lng: trip.lng } : null;
    const estimate = position && meeting ? this.estimator(position, meeting) : null;
    return {
      tripId: trip.id,
      startedAt: trip.startedAt.toISOString(),
      vehicle: { model: trip.vehicleModel, colour: trip.vehicleColour, plate: trip.vehiclePlate },
      driverFirstName: firstName(trip.driver.name),
      position,
      positionAgeSeconds:
        position && trip.positionReceivedAt ? Math.max(0, Math.round((now.getTime() - trip.positionReceivedAt.getTime()) / 1000)) : null,
      distanceM: estimate?.distanceM ?? null,
      etaMinutes: estimate?.etaMinutes ?? null,
      etaAt: estimate ? new Date(now.getTime() + estimate.etaMinutes * 60000).toISOString() : null,
      meetingPoint: meeting,
    };
  }

  // ---------------------------------------------------------------- retention

  /** Ends the trips past their 90 minutes, erasing their position. Lazily on reads, and by the cron. */
  public async sweep(scope: { operatorId?: string; reservationId?: string } = {}): Promise<number> {
    const now = new Date();
    const where: Prisma.ShuttleTripWhereInput = {
      status: 'running',
      expiresAt: { lte: now },
      ...(scope.operatorId ? { operatorId: scope.operatorId } : {}),
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
