import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, Reservation, ReservationStatus } from '@/database';
import { can } from '@/domain/roles';
import { canTransition, formatFlight, formatPlate, newReference, plateKey, RELEASED_STATUSES } from '@/domain/reservation';
import { parseConfirmationEmail } from '@/domain/importers';
import { addDays, DATE_RE, dayBounds, exceedsCalendarDays, localDate, parseInstant } from '@/domain/time';
import { ChangeStatusDto, CreateReservationDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { AuditService } from './audit.service';
import { CapacityService, NightLoad } from './capacity.service';
import { NotificationService } from './notification.service';
import { ParkingService } from './parking.service';
import { PaymentService } from './payment.service';
import { SmsService } from './sms.service';

const MAX_STAY_DAYS = 90;
const PLANNING_NIGHTS = 7;

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
const fieldError = (field: string, code: string) => new ValidationException({ [field]: code });

type Client = Prisma.TransactionClient | typeof prisma;

/**
 * Bookings staff work with: not the ones still waiting for their online payment, nor the holds
 * that ended unpaid (they were never bookings).
 */
export const STAFF_VISIBLE: Prisma.ReservationWhereInput = {
  status: { not: 'pending_payment' },
  OR: [{ paymentStatus: null }, { paymentStatus: { not: 'expired' } }],
};

@Service()
export class ReservationService {
  public audit = Container.get(AuditService);
  public sms = Container.get(SmsService);
  public capacity = Container.get(CapacityService);
  public parkings = Container.get(ParkingService);
  public payments = Container.get(PaymentService);
  public notifications = Container.get(NotificationService);

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw forbidden();
  }

  private async findOwn(actor: AuthenticatedStaff, id: string, client: Client = prisma): Promise<Reservation> {
    const reservation = await client.reservation.findFirst({ where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] } });
    if (!reservation) throw notFound();
    return reservation;
  }

  private parseStay(parking: Parking, arrival: string, ret: string) {
    const arrivalAt = parseInstant(arrival, parking.timezone);
    const returnAt = parseInstant(ret, parking.timezone);
    if (!arrivalAt) throw fieldError('arrivalAt', 'invalid_datetime');
    if (!returnAt) throw fieldError('returnAt', 'invalid_datetime');
    if (returnAt <= arrivalAt) throw fieldError('returnAt', 'return_before_arrival');
    if (exceedsCalendarDays(arrivalAt, returnAt, parking.timezone, MAX_STAY_DAYS)) throw fieldError('returnAt', 'stay_too_long');
    return { arrivalAt, returnAt };
  }

  /** "to3627" -> "TO 3627"; empty -> null; 400 "invalid_flight" when it is not a flight number. */
  public normalizeFlight(flight: string | null | undefined): string | null {
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

  /** A customer reference not used yet. */
  public async newUniqueReference(client: Client): Promise<string> {
    let reference = newReference();
    while (await client.reservation.findUnique({ where: { reference }, select: { id: true } })) reference = newReference();
    return reference;
  }

  public async create(actor: AuthenticatedStaff, data: CreateReservationDto) {
    this.require(actor, 'reservations:manage');
    const parking = await this.parkings.getPrimary(actor);
    const stay = this.parseStay(parking, data.arrivalAt, data.returnAt);
    const returnFlight = this.normalizeFlight(data.returnFlight);

    const externalReference = data.externalReference?.trim().toUpperCase() || null;

    return prisma.$transaction(async tx => {
      await this.capacity.lock(tx, parking.id);
      if (externalReference) await this.refuseDuplicate(tx, actor, externalReference);
      const full = await this.checkCapacity(tx, actor, parking, stay, data.force);
      const reference = await this.newUniqueReference(tx);

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
          externalReference,
          priceCents: data.priceCents ?? null,
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

  /** A booking already imported from its channel is never created twice. */
  private async refuseDuplicate(client: Client, actor: AuthenticatedStaff, externalReference: string) {
    const existing = await client.reservation.findUnique({
      where: { operatorId_externalReference: { operatorId: actor.operatorId, externalReference } },
      select: { id: true, reference: true },
    });
    if (existing) {
      throw new HttpException(httpStatus.CONFLICT, 'This booking was already imported', 'already_imported', { reservation: existing });
    }
  }

  /**
   * Reads a pasted confirmation email (Allopark for now) and returns what it found, what staff
   * must complete, whether it was already imported and the load of the nights concerned.
   */
  public async parseEmail(actor: AuthenticatedStaff, text: string) {
    this.require(actor, 'reservations:manage');
    const parsed = parseConfirmationEmail(text);
    if (!parsed) throw new HttpException(httpStatus.UNPROCESSABLE_ENTITY, 'Unrecognised email', 'unrecognised_email');

    const required = ['arrivalAt', 'returnAt', 'customerName', 'customerPhone', 'plate'] as const;
    const missing = required.filter(key => !parsed[key]);

    const duplicate = parsed.externalReference
      ? await prisma.reservation.findUnique({
          where: { operatorId_externalReference: { operatorId: actor.operatorId, externalReference: parsed.externalReference.toUpperCase() } },
          select: { id: true, reference: true },
        })
      : null;

    let capacity = null;
    if (parsed.arrivalAt && parsed.returnAt) {
      try {
        capacity = await this.previewCapacity(actor, parsed.arrivalAt, parsed.returnAt);
      } catch {
        capacity = null; // inconsistent dates: staff will see them in the form
      }
    }
    return { parsed, missing, duplicate, capacity };
  }

  public async update(actor: AuthenticatedStaff, id: string, data: UpdateReservationDto) {
    this.require(actor, 'reservations:manage');
    const parking = await this.parkings.getPrimary(actor);

    return prisma.$transaction(async tx => {
      await this.capacity.lock(tx, parking.id);
      const before = await this.findOwn(actor, id, tx);
      if (['returned', 'cancelled', 'no_show'].includes(before.status)) {
        throw new HttpException(httpStatus.BAD_REQUEST, 'This reservation is closed', 'reservation_closed');
      }
      // A booking made on the site stays one (commission), and staff cannot pass theirs off as one.
      if (data.channel !== undefined && data.channel !== before.channel && (data.channel === 'plazo' || before.channel === 'plazo')) {
        throw fieldError('channel', 'invalid_channel');
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
    // A booking paid online and refunded cannot be reopened: it would be a booking nobody paid.
    if (before.paymentStatus === 'refunded') {
      throw new HttpException(httpStatus.CONFLICT, 'This booking was refunded', 'booking_refunded');
    }
    // Cancelling a booking paid online refunds it in full (the row is locked during the refund;
    // if Stripe refuses, nothing changes: 502 "refund_failed").
    if (data.status === 'cancelled' && before.paymentStatus === 'paid') {
      const after = await this.payments.cancelWithRefund(
        before.id,
        current => {
          if (!canTransition(current.status, 'cancelled')) {
            throw new HttpException(httpStatus.BAD_REQUEST, `Cannot go from ${current.status} to cancelled`, 'invalid_transition');
          }
        },
        (tx, refund) => this.applyStatus(actor, before, 'cancelled', tx, refund ?? undefined),
      );
      const record = await prisma.reservation.findUnique({ where: { id: before.id }, include: WITH_LISTING });
      if (record?.parking.listing) await this.notifications.bookingCancelled(toPublicBooking(record));
      return after;
    }
    // Reopening a cancelled booking takes a spot again: re-check capacity.
    if (RELEASED_STATUSES.includes(before.status)) {
      const parking = await this.parkings.getPrimary(actor);
      return prisma.$transaction(async tx => {
        await this.capacity.lock(tx, parking.id);
        await this.checkCapacity(tx, actor, parking, before, false, id);
        return this.applyStatus(actor, before, data.status, tx);
      });
    }
    return this.applyStatus(actor, before, data.status, prisma);
  }

  private async applyStatus(
    actor: AuthenticatedStaff,
    before: Reservation,
    status: ReservationStatus,
    client: Client,
    refund?: { paymentStatus: 'refunded'; refundedAt: Date; stripeRefundId: string; payoutStatus: 'cancelled' | 'reversed' },
  ) {
    const now = new Date();
    const after = await client.reservation.update({
      where: { id: before.id },
      data: {
        status,
        arrivedAt: status === 'arrived' && !before.arrivedAt ? now : status === 'upcoming' ? null : undefined,
        returnedAt: status === 'returned' ? now : before.status === 'returned' ? null : undefined,
        cancelledAt: status === 'cancelled' ? now : before.status === 'cancelled' ? null : undefined,
        ...refund,
      },
    });
    await this.audit.record(
      actor,
      {
        action: 'reservation.status_changed',
        entityType: 'reservation',
        entityId: before.id,
        details: { from: before.status, to: status, ...(refund ? { refunded: true } : {}) },
      },
      client,
    );
    return after;
  }

  /**
   * Revokes the traveller's manage link of a booking made on the site (e.g. a forwarded or leaked
   * email): the old link stops working. The traveller gets a new one with "Ma réservation"
   * (reference + email).
   */
  public async revokeManageLink(actor: AuthenticatedStaff, id: string) {
    this.require(actor, 'reservations:manage');
    const before = await this.findOwn(actor, id);
    if (before.channel !== 'plazo')
      throw new HttpException(httpStatus.BAD_REQUEST, 'Only bookings made on the site have a manage link', 'not_site_booking');
    return prisma.$transaction(async tx => {
      const after = await tx.reservation.update({ where: { id }, data: { manageTokenVersion: { increment: 1 } } });
      await this.audit.record(actor, { action: 'reservation.manage_link_revoked', entityType: 'reservation', entityId: id, details: {} }, tx);
      return after;
    });
  }

  /** The sheet, with the code of the spot the vehicle is on (bloc 2). */
  public async get(actor: AuthenticatedStaff, id: string) {
    this.require(actor, 'reservations:view');
    const reservation = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      include: { spot: { select: { code: true } } },
    });
    if (!reservation) throw notFound();
    return reservation;
  }

  /** Search by plate, name, phone or reference; most recent arrivals first. */
  public async list(actor: AuthenticatedStaff, query: { q?: string; page?: number; limit?: number }) {
    this.require(actor, 'reservations:view');
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const q = query.q?.trim();
    const where: Prisma.ReservationWhereInput = { operatorId: actor.operatorId, AND: [STAFF_VISIBLE] };
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

    // Lazy retry of the operator's waiting SMS (their phone may be back online), throttled to once a minute.
    await this.sms
      .refreshQueue(parking.operatorId)
      .catch(error => logger.warn(`[SMS] Queue refresh failed for operator ${parking.operatorId}: ${error?.name ?? 'error'}`));

    const [arrivals, returns, nights, smsWarning] = await Promise.all([
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: active, arrivalAt: { gte: start, lt: end }, AND: [STAFF_VISIBLE] },
        orderBy: { arrivalAt: 'asc' },
      }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: active, returnAt: { gte: start, lt: end }, AND: [STAFF_VISIBLE] },
        orderBy: { returnAt: 'asc' },
      }),
      this.capacity.nights(parking, day, addDays(day, PLANNING_NIGHTS - 1)),
      this.sms.pendingWarning(parking.operatorId),
    ]);

    return {
      date: day,
      // { pending } when a gateway SMS has waited more than 10 minutes (phone off or offline), else null.
      smsWarning,
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
