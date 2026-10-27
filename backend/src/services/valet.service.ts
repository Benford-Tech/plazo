import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, Reservation, ReservationStatus } from '@/database';
import { can } from '@/domain/roles';
import { dayBounds as localDayBounds, localDate } from '@/domain/time';
import {
  ARRIVAL_OPEN_STATUSES,
  DEPARTURE_OPEN_STATUSES,
  RUN_DONE_STATUS,
  RUN_LIST_HOURS_AHEAD,
  RUN_LIST_HOURS_BEFORE,
  runNoticeDue,
  runRefusal,
  runState,
  runTimes,
  ValetRunKind,
  ValetRunState,
  valetMeetingPointOf,
} from '@/domain/valet';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { FlightTrackingService } from './flight-tracking.service';
import { ParkingService } from './parking.service';
import { PushService } from './push.service';
import { ReservationService } from './reservation.service';
import { FlightView, flightView } from './shuttle.service';

/** A run as the valets see it (Plazo Pro « Terminal » tab, the pro space's « Courses au terminal »). */
export interface ValetRun {
  id: string;
  reservationId: string;
  kind: ValetRunKind;
  state: ValetRunState;
  /** When the valet meets the traveller at the terminal, and when to leave the parking for it. */
  meetAt: string;
  leaveAt: string;
  takenBy: { id: string; firstName: string } | null;
  takenAt: string | null;
  /** Done: the car taken (arrival, Sur place) or handed back (departure, Rendu). */
  doneAt: string | null;
  mine: boolean;
  reference: string;
  customerName: string;
  customerPhone: string;
  plate: string;
  vehicleModel: string | null;
  vehicleColour: string | null;
  passengers: number;
  status: ReservationStatus;
  /** Arrival: the outbound flight; departure: the return flight. */
  flight: FlightView;
  departureFlight: string | null;
  spot: string | null;
  file: string | null;
  keyHook: string | null;
  keysLeftAt: string | null;
}

export interface ValetRuns {
  serverTime: string;
  meetingPoint: string;
  runs: ValetRun[];
  counts: Record<ValetRunState, number>;
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const firstNameOf = (s: { firstName: string; name: string }) => s.firstName || s.name.split(' ')[0] || '';

const RUN_INCLUDE = {
  spot: { select: { code: true } },
  file: { select: { code: true } },
  valetArrivalBy: { select: { id: true, firstName: true, name: true } },
  valetDepartureBy: { select: { id: true, firstName: true, name: true } },
} satisfies Prisma.ReservationInclude;
type RunBooking = Prisma.ReservationGetPayload<{ include: typeof RUN_INCLUDE }>;

/**
 * « Voiturier au terminal » (27/10/2026, direction B): the valet runs of the day. A valet booking gives an arrival run
 * (meet the traveller at the terminal, take the car: « Sur place ») and a departure run (bring the car back:
 * « Rendu »); one valet takes each run, the team sees who went.
 */
@Service()
export class ValetService {
  public audit = Container.get(AuditService);
  public flights = Container.get(FlightTrackingService);
  public parkings = Container.get(ParkingService);
  public push = Container.get(PushService);
  public reservations = Container.get(ReservationService);

  /** The parking's valet meeting point, from its setting or the airport of its listing. */
  public async meetingPoint(parking: Pick<Parking, 'id' | 'valetMeetingPoint'>): Promise<string> {
    const listing = await prisma.listing.findUnique({ where: { parkingId: parking.id }, select: { airport: { select: { code: true } } } });
    return valetMeetingPointOf(parking, listing?.airport.code ?? null);
  }

  /** The runs around today: open runs from 6 hours ago to 18 hours ahead, and the runs done today. */
  public async runs(actor: AuthenticatedStaff, now = new Date()): Promise<ValetRuns> {
    this.require(actor, 'reservations:view');
    const parking = await this.parkings.getPrimary(actor);
    const from = new Date(now.getTime() - RUN_LIST_HOURS_BEFORE * 3600000);
    const to = new Date(now.getTime() + RUN_LIST_HOURS_AHEAD * 3600000);
    const { start } = localDayBounds(localDate(now, parking.timezone), parking.timezone);
    const bookings = await prisma.reservation.findMany({
      where: {
        parkingId: parking.id,
        handover: 'valet',
        OR: [
          { status: { in: [...ARRIVAL_OPEN_STATUSES] }, arrivalAt: { gte: from, lte: to } },
          { status: { in: [...DEPARTURE_OPEN_STATUSES] }, OR: [{ returnAt: { lte: to } }, { flightEstimatedAt: { lte: to } }] },
          { arrivedAt: { gte: start } },
          { status: 'returned', returnedAt: { gte: start } },
        ],
      },
      include: RUN_INCLUDE,
    });
    // The return flights of the departures due soon, refreshed like the driver's list.
    const departures = bookings.filter(b => DEPARTURE_OPEN_STATUSES.includes(b.status) && b.returnAt <= to).map(b => b.id);
    if (departures.length) await this.flights.refreshBookings(departures);
    const fresh = departures.length
      ? await prisma.reservation.findMany({ where: { id: { in: bookings.map(b => b.id) } }, include: RUN_INCLUDE })
      : bookings;
    const runs: ValetRun[] = [];
    for (const booking of fresh) {
      for (const kind of ['arrival', 'departure'] as const) {
        const run = this.view(actor, parking, booking, kind, start);
        if (run) runs.push(run);
      }
    }
    const rank: Record<ValetRunState, number> = { taken: 0, todo: 1, done: 2 };
    runs.sort(
      (a, b) => rank[a.state] - rank[b.state] || (a.state === 'done' ? b.doneAt!.localeCompare(a.doneAt!) : a.leaveAt.localeCompare(b.leaveAt)),
    );
    const counts = { todo: 0, taken: 0, done: 0 } as Record<ValetRunState, number>;
    for (const run of runs) counts[run.state] += 1;
    return { serverTime: now.toISOString(), meetingPoint: await this.meetingPoint(parking), runs, counts };
  }

  /** A booking's run when it belongs on today's list; null otherwise (a departure days away, a run done before today). */
  private view(actor: AuthenticatedStaff, parking: Parking, booking: RunBooking, kind: ValetRunKind, dayStart: Date, window = true): ValetRun | null {
    const takenAt = kind === 'arrival' ? booking.valetArrivalTakenAt : booking.valetDepartureTakenAt;
    const state = runState(kind, { status: booking.status, takenAt });
    if (!state) return null;
    const doneAt = state === 'done' ? (kind === 'arrival' ? booking.arrivedAt : booking.returnedAt) : null;
    if (state === 'done' && (!doneAt || doneAt < dayStart)) return null;
    const times = runTimes(kind, booking, parking);
    if (window && state !== 'done') {
      const now = Date.now();
      if (times.leaveAt.getTime() > now + RUN_LIST_HOURS_AHEAD * 3600000) return null;
      if (kind === 'arrival' && times.meetAt.getTime() < now - RUN_LIST_HOURS_BEFORE * 3600000) return null;
    }
    const by = kind === 'arrival' ? booking.valetArrivalBy : booking.valetDepartureBy;
    return {
      id: `${booking.id}:${kind}`,
      reservationId: booking.id,
      kind,
      state,
      meetAt: times.meetAt.toISOString(),
      leaveAt: times.leaveAt.toISOString(),
      takenBy: by ? { id: by.id, firstName: firstNameOf(by) } : null,
      takenAt: iso(takenAt),
      doneAt: iso(doneAt),
      mine: !!by && by.id === actor.id,
      reference: booking.reference,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      plate: booking.plate,
      vehicleModel: booking.vehicleModel,
      vehicleColour: booking.vehicleColour,
      passengers: booking.passengers,
      status: booking.status,
      flight: flightView(booking),
      departureFlight: booking.departureFlight,
      spot: booking.spot?.code ?? null,
      file: booking.file?.code ?? null,
      keyHook: booking.keyHook,
      keysLeftAt: iso(booking.keysLeftAt),
    };
  }

  /** « Je prends »: the run is this valet's (taken by someone else: 409 run_taken; already theirs: unchanged). */
  public async take(actor: AuthenticatedStaff, reservationId: string, kind: ValetRunKind): Promise<ValetRun> {
    this.require(actor, 'reservations:status');
    const parking = await this.parkings.getPrimary(actor);
    const by = kind === 'arrival' ? 'valetArrivalById' : 'valetDepartureById';
    const at = kind === 'arrival' ? 'valetArrivalTakenAt' : 'valetDepartureTakenAt';
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${reservationId} FOR UPDATE`;
      const booking = await this.own(actor, reservationId, tx);
      this.check(kind, booking);
      const holder = booking[by];
      if (holder === actor.id) return;
      if (holder) throw new HttpException(httpStatus.CONFLICT, 'Run taken by another valet', 'run_taken');
      await tx.reservation.update({ where: { id: booking.id }, data: { [by]: actor.id, [at]: new Date() } });
    });
    await this.audit.record(actor, { action: 'reservation.valet_run_taken', entityType: 'reservation', entityId: reservationId, details: { kind } });
    return this.single(actor, parking, reservationId, kind);
  }

  /** « Je ne peux plus »: gives the run back (only its valet, or a manager). */
  public async release(actor: AuthenticatedStaff, reservationId: string, kind: ValetRunKind): Promise<ValetRun> {
    this.require(actor, 'reservations:status');
    const parking = await this.parkings.getPrimary(actor);
    const by = kind === 'arrival' ? 'valetArrivalById' : 'valetDepartureById';
    const at = kind === 'arrival' ? 'valetArrivalTakenAt' : 'valetDepartureTakenAt';
    await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${reservationId} FOR UPDATE`;
      const booking = await this.own(actor, reservationId, tx);
      this.check(kind, booking);
      if (!booking[at]) return;
      if (booking[by] !== actor.id && !can(actor.role, 'reservations:manage')) {
        throw new HttpException(httpStatus.FORBIDDEN, 'Run taken by another valet', 'run_taken');
      }
      await tx.reservation.update({ where: { id: booking.id }, data: { [by]: null, [at]: null } });
    });
    await this.audit.record(actor, {
      action: 'reservation.valet_run_released',
      entityType: 'reservation',
      entityId: reservationId,
      details: { kind },
    });
    return this.single(actor, parking, reservationId, kind);
  }

  /**
   * « Voiture récupérée au terminal » (arrival → Sur place) or « Voiture rendue au client » (departure → Rendu), through
   * the status change everybody uses (history, keys, file, closing message). A run nobody took becomes this valet's.
   */
  public async done(actor: AuthenticatedStaff, reservationId: string, kind: ValetRunKind, note?: string): Promise<ValetRun> {
    this.require(actor, 'reservations:status');
    const parking = await this.parkings.getPrimary(actor);
    const booking = await this.own(actor, reservationId);
    this.check(kind, booking);
    const by = kind === 'arrival' ? 'valetArrivalById' : 'valetDepartureById';
    const at = kind === 'arrival' ? 'valetArrivalTakenAt' : 'valetDepartureTakenAt';
    if (!booking[at]) {
      await prisma.reservation.updateMany({ where: { id: booking.id, [at]: null }, data: { [by]: actor.id, [at]: new Date() } });
    }
    await this.reservations.changeStatus(actor, reservationId, { status: RUN_DONE_STATUS[kind], note });
    return this.single(actor, parking, reservationId, kind);
  }

  /**
   * « Course à prendre » (the 15-minute pass of remind-tomorrow): the valets hear of each run nobody took, once, half an
   * hour before they should leave. Returns how many runs were announced.
   */
  public async announceDue(now = new Date()): Promise<number> {
    const soon = new Date(now.getTime() + RUN_LIST_HOURS_AHEAD * 3600000);
    const bookings = await prisma.reservation.findMany({
      where: {
        handover: 'valet',
        operator: { status: 'active', archivedAt: null },
        OR: [
          { status: 'upcoming', valetArrivalTakenAt: null, valetArrivalNotifiedAt: null, arrivalAt: { gte: now, lte: soon } },
          { status: { in: [...DEPARTURE_OPEN_STATUSES] }, valetDepartureTakenAt: null, valetDepartureNotifiedAt: null, returnAt: { lte: soon } },
        ],
      },
      include: { parking: true },
      take: 50,
    });
    let sent = 0;
    for (const booking of bookings) {
      const kind: ValetRunKind = booking.status === 'upcoming' ? 'arrival' : 'departure';
      const { leaveAt, meetAt } = runTimes(kind, booking, booking.parking);
      if (!runNoticeDue(leaveAt, now)) continue;
      const column = kind === 'arrival' ? 'valetArrivalNotifiedAt' : 'valetDepartureNotifiedAt';
      const claimed = await prisma.reservation.updateMany({ where: { id: booking.id, [column]: null }, data: { [column]: now } });
      if (!claimed.count) continue;
      try {
        const message = runPush(kind, booking, meetAt, await this.meetingPoint(booking.parking), booking.parking.timezone);
        await this.push.notifyStaff(booking.operatorId, 'valets', message, {
          data: { type: 'valet_run', kind, reservationId: booking.id },
          collapseId: `valet-${booking.id}-${kind}`,
          ttl: 3600,
        });
        sent += 1;
      } catch (error) {
        logger.warn(`[Valet] run notice failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
    return sent;
  }

  private async single(actor: AuthenticatedStaff, parking: Parking, reservationId: string, kind: ValetRunKind): Promise<ValetRun> {
    const booking = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId }, include: RUN_INCLUDE });
    const run = this.view(actor, parking, booking, kind, new Date(0), false);
    if (!run) throw new HttpException(httpStatus.CONFLICT, 'This run is closed', 'run_closed');
    return run;
  }

  private check(kind: ValetRunKind, booking: Pick<Reservation, 'handover' | 'status'>) {
    const refusal = runRefusal(kind, booking);
    if (refusal === 'not_valet') throw new HttpException(httpStatus.BAD_REQUEST, 'Not a valet booking', 'not_valet');
    if (refusal) throw new HttpException(httpStatus.CONFLICT, 'This run is closed', 'run_closed');
  }

  private async own(actor: AuthenticatedStaff, id: string, client: Prisma.TransactionClient | typeof prisma = prisma) {
    const booking = await client.reservation.findFirst({ where: { id, operatorId: actor.operatorId } });
    if (!booking) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    return booking;
  }

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw new HttpException(httpStatus.FORBIDDEN, 'Forbidden', 'forbidden');
  }
}

/** « Course à prendre · 08:15 au Terminal 1 » / « Récupérer GH-456-JK · C. Martin ». */
export function runPush(
  kind: ValetRunKind,
  booking: { plate: string; customerFirstName: string; customerLastName: string; customerName: string },
  meetAt: Date,
  meetingPoint: string,
  timezone = 'Europe/Paris',
) {
  const hour = meetAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: timezone });
  const name = booking.customerLastName
    ? `${booking.customerFirstName ? `${booking.customerFirstName[0]}. ` : ''}${booking.customerLastName}`
    : booking.customerName;
  const plate = booking.plate ? `${booking.plate} · ` : '';
  return {
    title: `Course à prendre · ${hour} · ${meetingPoint}`,
    body: kind === 'arrival' ? `Récupérer la voiture : ${plate}${name}` : `Rendre la voiture : ${plate}${name}`,
  };
}
