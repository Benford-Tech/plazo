import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, Reservation, ReservationStatus } from '@/database';
import { can } from '@/domain/roles';
import { canTransition, formatFlight, formatPlate, newReference, plateKey, RELEASED_STATUSES } from '@/domain/reservation';
import { addDays, DATE_RE, dayBounds, localDate, parseInstant } from '@/domain/time';
import { ChangeStatusDto, CreateReservationDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { CapacityService, NightLoad } from './capacity.service';
import { ParkingService } from './parking.service';

const MAX_STAY_DAYS = 90;
const PLANNING_NIGHTS = 7;

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
const fieldError = (field: string, code: string) => new ValidationException({ [field]: code });

type Client = Prisma.TransactionClient | typeof prisma;

@Service()
export class ReservationService {
  public audit = Container.get(AuditService);
  public capacity = Container.get(CapacityService);
  public parkings = Container.get(ParkingService);

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw forbidden();
  }

  private async findOwn(actor: AuthenticatedStaff, id: string, client: Client = prisma): Promise<Reservation> {
    const reservation = await client.reservation.findFirst({ where: { id, operatorId: actor.operatorId } });
    if (!reservation) throw notFound();
    return reservation;
  }

  private parseStay(parking: Parking, arrival: string, ret: string) {
    const arrivalAt = parseInstant(arrival, parking.timezone);
    const returnAt = parseInstant(ret, parking.timezone);
    if (!arrivalAt) throw fieldError('arrivalAt', 'invalid_datetime');
    if (!returnAt) throw fieldError('returnAt', 'invalid_datetime');
    if (returnAt <= arrivalAt) throw fieldError('returnAt', 'return_before_arrival');
    if (returnAt.getTime() - arrivalAt.getTime() > MAX_STAY_DAYS * 86400000) throw fieldError('returnAt', 'stay_too_long');
    return { arrivalAt, returnAt };
  }

  private normalizeFlight(flight: string | null | undefined): string | null {
    if (!flight || !flight.trim()) return null;
    const formatted = formatFlight(flight);
    if (!formatted) throw fieldError('returnFlight', 'invalid_flight');
    return formatted;
  }

  /**
   * Refuses a stay that would exceed the bookable capacity on any night, unless the staff member
   * forces it. Must run inside the transaction holding the parking lock.
   */
  private async checkCapacity(
    tx: Client,
    actor: AuthenticatedStaff,
    parking: Parking,
    stay: { arrivalAt: Date; returnAt: Date },
    force: boolean | undefined,
    excludeReservationId?: string,
  ): Promise<NightLoad[]> {
    const { full } = await this.capacity.fullNights(parking, stay.arrivalAt, stay.returnAt, { excludeReservationId, client: tx });
    if (full.length && !(force && can(actor.role, 'reservations:force'))) {
      throw new HttpException(httpStatus.CONFLICT, 'At least one night is full', 'overbooked', { nights: full });
    }
    return full;
  }

  /** Serializes capacity checks per parking: two concurrent bookings cannot both take the last spot. */
  private async lockParking(tx: Prisma.TransactionClient, parkingId: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${parkingId}))`;
  }

  public async create(actor: AuthenticatedStaff, data: CreateReservationDto) {
    this.require(actor, 'reservations:manage');
    const parking = await this.parkings.getPrimary(actor);
    const stay = this.parseStay(parking, data.arrivalAt, data.returnAt);
    const returnFlight = this.normalizeFlight(data.returnFlight);

    return prisma.$transaction(async tx => {
      await this.lockParking(tx, parking.id);
      const full = await this.checkCapacity(tx, actor, parking, stay, data.force);

      let reference = newReference();
      while (await tx.reservation.findUnique({ where: { reference } })) reference = newReference();

      const reservation = await tx.reservation.create({
        data: {
          reference,
          operatorId: actor.operatorId,
          parkingId: parking.id,
          channel: data.channel,
          channelDetail: data.channelDetail?.trim() || null,
          ...stay,
          passengers: data.passengers,
          customerName: data.customerName.trim(),
          customerPhone: data.customerPhone.trim(),
          customerEmail: data.customerEmail?.trim().toLowerCase() || null,
          plate: formatPlate(data.plate),
          plateKey: plateKey(data.plate),
          returnFlight,
          notes: data.notes?.trim() || null,
          overbooked: full.length > 0,
          createdById: actor.id,
        },
      });
      await this.audit.record(
        actor,
        {
          action: full.length ? 'reservation.created_overbooked' : 'reservation.created',
          entityType: 'reservation',
          entityId: reservation.id,
          details: full.length ? { fullNights: full.map(n => n.date) } : {},
        },
        tx,
      );
      return reservation;
    });
  }

  public async update(actor: AuthenticatedStaff, id: string, data: UpdateReservationDto) {
    this.require(actor, 'reservations:manage');
    const parking = await this.parkings.getPrimary(actor);

    return prisma.$transaction(async tx => {
      await this.lockParking(tx, parking.id);
      const before = await this.findOwn(actor, id, tx);
      if (['returned', 'cancelled', 'no_show'].includes(before.status)) {
        throw new HttpException(httpStatus.BAD_REQUEST, 'This reservation is closed', 'reservation_closed');
      }

      const datesChanged = data.arrivalAt !== undefined || data.returnAt !== undefined;
      const stay = datesChanged
        ? this.parseStay(parking, data.arrivalAt ?? before.arrivalAt.toISOString(), data.returnAt ?? before.returnAt.toISOString())
        : { arrivalAt: before.arrivalAt, returnAt: before.returnAt };
      const full = datesChanged ? await this.checkCapacity(tx, actor, parking, stay, data.force, id) : [];

      const after = await tx.reservation.update({
        where: { id },
        data: {
          channel: data.channel,
          channelDetail: data.channelDetail === undefined ? undefined : data.channelDetail?.trim() || null,
          ...stay,
          passengers: data.passengers,
          customerName: data.customerName?.trim(),
          customerPhone: data.customerPhone?.trim(),
          customerEmail: data.customerEmail === undefined ? undefined : data.customerEmail?.trim().toLowerCase() || null,
          plate: data.plate === undefined ? undefined : formatPlate(data.plate),
          plateKey: data.plate === undefined ? undefined : plateKey(data.plate),
          returnFlight: data.returnFlight === undefined ? undefined : this.normalizeFlight(data.returnFlight),
          notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
          overbooked: datesChanged ? full.length > 0 : undefined,
        },
      });

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of Object.keys(after) as (keyof Reservation)[]) {
        if (key === 'updatedAt') continue;
        const a = before[key] instanceof Date ? (before[key] as Date).toISOString() : before[key];
        const b = after[key] instanceof Date ? (after[key] as Date).toISOString() : after[key];
        if (a !== b) changes[key] = { from: a, to: b };
      }
      await this.audit.record(actor, { action: 'reservation.updated', entityType: 'reservation', entityId: id, details: changes as any }, tx);
      return after;
    });
  }

  public async changeStatus(actor: AuthenticatedStaff, id: string, data: ChangeStatusDto) {
    this.require(actor, 'reservations:status');
    const before = await this.findOwn(actor, id);
    if (before.status === data.status) return before;
    if (!canTransition(before.status, data.status)) {
      throw new HttpException(httpStatus.BAD_REQUEST, `Cannot go from ${before.status} to ${data.status}`, 'invalid_transition');
    }
    // Cancelling and no-show are booking decisions, not field operations.
    if (['cancelled', 'no_show'].includes(data.status) || ['cancelled', 'no_show'].includes(before.status)) {
      this.require(actor, 'reservations:manage');
    }
    // Reopening a cancelled booking takes a spot again: re-check capacity.
    if (RELEASED_STATUSES.includes(before.status)) {
      const parking = await this.parkings.getPrimary(actor);
      return prisma.$transaction(async tx => {
        await this.lockParking(tx, parking.id);
        await this.checkCapacity(tx, actor, parking, before, false, id);
        return this.applyStatus(actor, before, data.status, tx);
      });
    }
    return this.applyStatus(actor, before, data.status, prisma);
  }

  private async applyStatus(actor: AuthenticatedStaff, before: Reservation, status: ReservationStatus, client: Client) {
    const now = new Date();
    const after = await client.reservation.update({
      where: { id: before.id },
      data: {
        status,
        arrivedAt: status === 'arrived' && !before.arrivedAt ? now : status === 'upcoming' ? null : undefined,
        returnedAt: status === 'returned' ? now : before.status === 'returned' ? null : undefined,
        cancelledAt: status === 'cancelled' ? now : before.status === 'cancelled' ? null : undefined,
      },
    });
    await this.audit.record(
      actor,
      { action: 'reservation.status_changed', entityType: 'reservation', entityId: before.id, details: { from: before.status, to: status } },
      client,
    );
    return after;
  }

  public async get(actor: AuthenticatedStaff, id: string) {
    this.require(actor, 'reservations:view');
    return this.findOwn(actor, id);
  }

  /** Search by plate, name, phone or reference; most recent arrivals first. */
  public async list(actor: AuthenticatedStaff, query: { q?: string; page?: number; limit?: number }) {
    this.require(actor, 'reservations:view');
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const q = query.q?.trim();
    const where: Prisma.ReservationWhereInput = { operatorId: actor.operatorId };
    if (q) {
      const key = plateKey(q);
      where.OR = [
        { customerName: { contains: q, mode: 'insensitive' } },
        { reference: { equals: q.toUpperCase() } },
        { customerPhone: { contains: q } },
        ...(key.length >= 2 ? [{ plateKey: { contains: key } }] : []),
      ];
    }
    const [docs, totalDocs] = await Promise.all([
      prisma.reservation.findMany({ where, orderBy: { arrivalAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.reservation.count({ where }),
    ]);
    const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
    return { docs, totalDocs, limit, page, totalPages, hasPrevPage: page > 1, hasNextPage: page < totalPages };
  }

  /** Capacity preview for a stay (used by the booking form before saving). */
  public async previewCapacity(actor: AuthenticatedStaff, arrival: string, ret: string, excludeReservationId?: string) {
    this.require(actor, 'reservations:view');
    const parking = await this.parkings.getPrimary(actor);
    const stay = this.parseStay(parking, arrival, ret);
    const { nights, full } = await this.capacity.fullNights(parking, stay.arrivalAt, stay.returnAt, { excludeReservationId });
    return { nights, fullNights: full.map(n => n.date), canForce: can(actor.role, 'reservations:force') };
  }

  /** The day sheet: arrivals and returns of a local date, plus the load of the next nights. */
  public async planning(actor: AuthenticatedStaff, date?: string) {
    this.require(actor, 'reservations:view');
    const parking = await this.parkings.getPrimary(actor);
    const day = date && DATE_RE.test(date) ? date : localDate(new Date(), parking.timezone);
    const { start, end } = dayBounds(day, parking.timezone);
    const active = { notIn: ['cancelled', 'no_show'] as ReservationStatus[] };

    const [arrivals, returns, nights] = await Promise.all([
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: active, arrivalAt: { gte: start, lt: end } },
        orderBy: { arrivalAt: 'asc' },
      }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: active, returnAt: { gte: start, lt: end } },
        orderBy: { returnAt: 'asc' },
      }),
      this.capacity.nights(parking, day, addDays(day, PLANNING_NIGHTS - 1)),
    ]);

    return {
      date: day,
      timezone: parking.timezone,
      parking: { id: parking.id, name: parking.name, bookableCapacity: parking.bookableCapacity },
      arrivals,
      returns,
      nights,
      stats: {
        arrivals: arrivals.length,
        arrived: arrivals.filter(r => r.status !== 'upcoming').length,
        returns: returns.length,
        returnsWithFlight: returns.filter(r => r.returnFlight).length,
      },
    };
  }
}
