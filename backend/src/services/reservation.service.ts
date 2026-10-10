import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, Reservation, ReservationStatus } from '@/database';
import { can } from '@/domain/roles';
import {
  canTransition,
  formatFlight,
  formatPlate,
  isPriceLocked,
  newReference,
  plateKey,
  RELEASED_STATUSES,
  STATUS_TRANSITIONS,
} from '@/domain/reservation';
import { ParsedBooking, parseConfirmationEmail } from '@/domain/importers';
import { addDays, DATE_RE, dayBounds, exceedsCalendarDays, localDate, localDateTime, parseInstant } from '@/domain/time';
import { ChangeStatusDto, CreateReservationDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { cleanNamePart, CustomerNames, customerNamesOf, importedNames } from '@/domain/customer-name';
import { ImportChange, ImportChangeReason, importChanges, withoutField } from '@/domain/import-change';
import { ImportedFlights, importedFlights, notesWithLines, unreadableFlightLines } from '@/domain/imported-flights';
import { chronologicalPage } from '@/domain/chronological-pages';
import { FileService } from './file.service';
import { AuditService } from './audit.service';
import { CapacityService, NightLoad, occupiedNights } from './capacity.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { TravellerMessagesService } from './traveller-messages.service';
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

/** 10/10/2026 (« C'est une modification »): what became of a comparator's change of a booking (applyImportChange). */
export interface ImportChangeResult {
  /** The booking as it is now (changed or not). */
  reservation: Reservation;
  /** What differs between the booking and the comparator's state, as the staff read it; empty: nothing to change. */
  changes: ImportChange[];
  applied: boolean;
  /** Why the changes were left to the staff (applied false with changes). */
  reason?: ImportChangeReason;
}

/** A booking the comparator no longer changes: handed back, cancelled, no-show (or a hold that never was one). */
const CLOSED_FOR_CHANGES: ReservationStatus[] = ['returned', 'cancelled', 'no_show', 'pending_payment'];

@Service()
export class ReservationService {
  public audit = Container.get(AuditService);
  public sms = Container.get(SmsService);
  public capacity = Container.get(CapacityService);
  public parkings = Container.get(ParkingService);
  public payments = Container.get(PaymentService);
  public notifications = Container.get(NotificationService);
  public push = Container.get(PushService);
  public messages = Container.get(TravellerMessagesService);

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
  public normalizeFlight(flight: string | null | undefined, field: 'returnFlight' | 'departureFlight' = 'returnFlight'): string | null {
    if (!flight || !flight.trim()) return null;
    const formatted = formatFlight(flight);
    if (!formatted) throw fieldError(field, 'invalid_flight');
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
    const departureFlight = this.normalizeFlight(data.departureFlight, 'departureFlight');
    const stopId = await this.checkStop(parking.id, data.stopId);

    const externalReference = data.externalReference?.trim().toUpperCase() || null;

    return prisma
      .$transaction(async tx => {
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
            ...customerNamesOf(data),
            customerPhone: data.customerPhone.trim(),
            customerEmail: data.customerEmail?.trim().toLowerCase() || null,
            plate: formatPlate(data.plate),
            plateKey: plateKey(data.plate),
            returnFlight,
            departureFlight,
            stopId,
            notes: data.notes?.trim() || null,
            customerNote: data.customerNote?.trim() || null,
            vehicleModel: data.vehicleModel?.trim() || null,
            vehicleColour: data.vehicleColour?.trim() || null,
            externalReference,
            priceCents: data.priceCents ?? null,
            // 10/10/2026: the amount read in the email (« Compléter »), kept apart from a price the staff corrected.
            importedPriceCents: externalReference ? (data.importedPriceCents ?? data.priceCents ?? null) : null,
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
      })
      .then(async reservation => {
        // Colleagues hear of it (06/10/2026); the creator is left out.
        await this.push.notifyNewBooking({ ...reservation, createdById: actor.id }, parking.timezone);
        return reservation;
      });
  }

  /**
   * M-A (06/10/2026): a booking read from a forwarded confirmation email, created without staff.
   * The external reference stops a second import (the existing booking is returned instead); a full
   * night does not stop it (the comparator already sold the place: overbooked and flagged).
   */
  public async createFromImport(operatorId: string, parsed: ParsedBooking): Promise<{ reservation: Reservation; duplicate: boolean }> {
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) throw notFound();
    const stay = this.parseStay(parking, parsed.arrivalAt!, parsed.returnAt!);
    // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): a flight that is no flight number is dropped, kept for
    // the staff in the notes; it no longer refuses the whole booking.
    const flights = importedFlights(parsed);
    logUnreadableFlights(flights, parsed.provider);
    const { returnFlight, departureFlight } = flights;
    const notes = notesWithLines(null, unreadableFlightLines(flights, parsed.provider));
    const externalReference = parsed.externalReference?.trim().toUpperCase() || null;
    const system = { id: null, operatorId };
    const created = await prisma.$transaction(async tx => {
      await this.capacity.lock(tx, parking.id);
      if (externalReference) {
        const existing = await tx.reservation.findUnique({ where: { operatorId_externalReference: { operatorId, externalReference } } });
        if (existing) return { reservation: existing, duplicate: true };
      } else {
        // L-A (08/10/2026): an email read by Claude may carry no reference; the same car arriving at the same
        // moment is the same booking (the mail forwarded twice, or by two people).
        const existing = await tx.reservation.findFirst({
          where: { operatorId, plateKey: plateKey(parsed.plate!), arrivalAt: stay.arrivalAt, status: { notIn: ['cancelled', 'no_show'] } },
        });
        if (existing) return { reservation: existing, duplicate: true };
      }
      const { full } = await this.capacity.fullNights(parking, stay.arrivalAt, stay.returnAt, { client: tx });
      const reference = await this.newUniqueReference(tx);
      const reservation = await tx.reservation.create({
        data: {
          reference,
          operatorId,
          parkingId: parking.id,
          channel: 'aggregator',
          channelDetail: parsed.provider,
          ...stay,
          passengers: parsed.passengers ?? 1,
          ...importedNames(parsed),
          customerPhone: parsed.customerPhone!.trim(),
          customerEmail: parsed.customerEmail?.trim().toLowerCase() || null,
          plate: formatPlate(parsed.plate!),
          plateKey: plateKey(parsed.plate!),
          returnFlight,
          departureFlight,
          notes,
          externalReference,
          priceCents: parsed.priceCents ?? null,
          importedPriceCents: parsed.priceCents ?? null,
          vehicleModel: parsed.vehicleModel?.trim().slice(0, 40) || null,
          vehicleColour: parsed.vehicleColour?.trim().slice(0, 30) || null,
          overbooked: full.length > 0,
        },
      });
      await this.audit.record(
        system,
        {
          action: full.length ? 'reservation.created_overbooked' : 'reservation.created',
          entityType: 'reservation',
          entityId: reservation.id,
          details: { by: 'inbound_email', provider: parsed.provider, ...(full.length ? { fullNights: full.map(n => n.date) } : {}) },
        },
        tx,
      );
      return { reservation, duplicate: false };
    });
    if (!created.duplicate) await this.push.notifyNewBooking(created.reservation, parking.timezone);
    return created;
  }

  /**
   * 10/10/2026 (« C'est une modification »: « Plazo relit la page Allopark, met à jour la réservation existante […], le
   * note dans l'historique et prévient l'équipe »): a comparator's change of a booking, applied without staff, with the
   * rules of update(): one transaction under the parking's lock, the booking read again, the stay checked (parseStay),
   * no full night among those the booking did not hold yet (no force: a change never overbooks), the flight tracking
   * started over for a new flight, the name rebuilt, the history written as `reservation.updated` with { field: { from,
   * to } } and where it came from (`source`, `inboundEmailId`), by no staff member. Left to the staff (applied false,
   * with the reason): a Plazo booking (`plazo_booking`), a closed one (`reservation_closed`), a new arrival once the car
   * is there (`already_arrived`: a new return alone is applied), no room (`no_room`), dates that make no stay
   * (`invalid_stay`). The price of a booking paid online is never changed (the rest is). Nothing to change: applied
   * false and no changes. The team hears of an applied change (« Réservation modifiée · Allopark »). 10/10/2026 (« Tu
   * n'as pas récupéré le prix pour la modif »): a flight of the comparator that is no flight number is no change; what
   * was typed joins the notes once (« Vol retour indiqué par Allopark : U2AB3C (numéro non reconnu) »), with the change
   * or alone when nothing else differs.
   */
  public async applyImportChange(
    operatorId: string,
    reservationId: string,
    booking: ParsedBooking,
    origin: { source: string; inboundEmailId?: string | null },
  ): Promise<ImportChangeResult> {
    const found = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId }, select: { parkingId: true } });
    if (!found) throw notFound();
    const parking = await prisma.parking.findUniqueOrThrow({ where: { id: found.parkingId } });
    // 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): a flight of the page that is no flight number is never a
    // change (importChanges ignores it, the booking keeps its flight); what was typed joins the notes, once.
    const flights = importedFlights(booking);
    logUnreadableFlights(flights, booking.provider);
    const flightLines = unreadableFlightLines(flights, booking.provider);
    const result = await prisma.$transaction(async (tx): Promise<ImportChangeResult> => {
      await this.capacity.lock(tx, parking.id);
      const before = await tx.reservation.findFirst({ where: { id: reservationId, operatorId } });
      if (!before) throw notFound();
      let diff = importChanges(before, booking, parking.timezone);
      // What the traveller paid online stays what they paid.
      if (isPriceLocked(before)) diff = withoutField(diff, 'priceCents');
      const left = (reason: ImportChangeReason): ImportChangeResult => ({ reservation: before, changes: diff.changes, applied: false, reason });
      const notes = notesWithLines(before.notes, flightLines);
      const notesAdded = notes !== before.notes;
      const record = (after: Reservation) =>
        this.audit.record(
          { id: null, operatorId },
          {
            action: 'reservation.updated',
            entityType: 'reservation',
            entityId: before.id,
            details: {
              ...columnChanges(before, after),
              by: 'inbound_email',
              source: origin.source,
              provider: booking.provider,
              ...(origin.inboundEmailId ? { inboundEmailId: origin.inboundEmailId } : {}),
            } as Prisma.InputJsonValue,
          },
          tx,
        );
      const open = before.channel !== 'plazo' && !CLOSED_FOR_CHANGES.includes(before.status);
      if (!diff.changes.length) {
        // Nothing to change but the unreadable flight's line: written quietly (no change listed, nobody told).
        if (!notesAdded || !open) return { reservation: before, changes: [], applied: false };
        const after = await tx.reservation.update({ where: { id: before.id }, data: { notes } });
        await record(after);
        return { reservation: after, changes: [], applied: false };
      }
      if (before.channel === 'plazo') return left('plazo_booking');
      if (CLOSED_FOR_CHANGES.includes(before.status)) return left('reservation_closed');
      if (diff.data.arrivalAt && before.status !== 'upcoming') return left('already_arrived');

      let overbooked: boolean | undefined;
      if (diff.data.arrivalAt || diff.data.returnAt) {
        let stay: { arrivalAt: Date; returnAt: Date };
        try {
          stay = this.parseStay(
            parking,
            (diff.data.arrivalAt ?? before.arrivalAt).toISOString(),
            (diff.data.returnAt ?? before.returnAt).toISOString(),
          );
        } catch {
          return left('invalid_stay');
        }
        const { full } = await this.capacity.fullNights(parking, stay.arrivalAt, stay.returnAt, { excludeReservationId: before.id, client: tx });
        // Nights the booking already held are not taken from anyone: only the new ones need room.
        const held = new Set(occupiedNights(before.arrivalAt, before.returnAt, parking.timezone));
        if (full.some(night => !held.has(night.date))) return left('no_room');
        overbooked = full.length > 0;
      }

      const after = await tx.reservation.update({
        where: { id: before.id },
        data: {
          ...diff.data,
          ...(notesAdded ? { notes } : {}),
          ...(overbooked === undefined ? {} : { overbooked }),
          // A new flight starts its tracking over (the landing a traveller reported stays theirs).
          ...(diff.data.departureFlight
            ? { departureStatus: null, departureScheduledAt: null, departureEstimatedAt: null, departureTerminal: null, departureCheckedAt: null }
            : {}),
          ...(diff.data.returnFlight
            ? {
                flightStatus: null,
                flightScheduledAt: null,
                flightEstimatedAt: null,
                flightTerminal: null,
                flightGate: null,
                flightCheckedAt: null,
                ...(before.flightLandedSource === 'tracking' ? { flightLandedAt: null, flightLandedSource: null } : {}),
              }
            : {}),
        },
      });
      await record(after);
      return { reservation: after, changes: diff.changes, applied: true };
    });
    if (result.applied) await this.push.notifyBookingChanged(result.reservation, result.changes);
    return result;
  }

  /**
   * 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): the operator's bookings a comparator's change may be
   * about although they lack its reference (typed by hand from the inbox, « Compléter », before the booking page was
   * read): a comparator's booking (never a Plazo one) without a reference, or with the same digits (« AL 123829327 »),
   * or with one that names no comparator (no letter: « 123829327 ») when the booking names no other comparator (its
   * channel's detail blank or this one: a numeric reference may be Onepark's), for the same car (plateKey) and a stay that
   * overlaps the comparator's or begins the same local day, neither cancelled nor a no-show. Two ids at most: one is
   * the booking, two make the change ambiguous. None without a plate or a stay. 10/10/2026 (relecture): a booking
   * without a reference that names another comparator (« Onepark », « Site du parking ») is not this one either
   * (« Allopark.com » typed by hand still names it), and a closed booking (handed back: its planned stay still overlaps)
   * never takes the reference, which would then keep the real booking from being created.
   */
  public async unreferencedMatches(operatorId: string, booking: ParsedBooking, externalReference: string): Promise<string[]> {
    const key = booking.plate ? plateKey(booking.plate) : '';
    if (!key || !booking.arrivalAt || !booking.returnAt) return [];
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) return [];
    const arrivalAt = parseInstant(booking.arrivalAt, parking.timezone);
    const returnAt = parseInstant(booking.returnAt, parking.timezone);
    if (!arrivalAt || !returnAt) return [];
    const day = dayBounds(localDate(arrivalAt, parking.timezone), parking.timezone);
    const sameDay: Prisma.ReservationWhereInput = { arrivalAt: { gte: day.start, lt: day.end } };
    const overlap: Prisma.ReservationWhereInput[] = returnAt > arrivalAt ? [{ arrivalAt: { lt: returnAt }, returnAt: { gt: arrivalAt } }] : [];
    const rows = await prisma.reservation.findMany({
      where: {
        operatorId,
        channel: 'aggregator',
        plateKey: key,
        status: { notIn: CLOSED_FOR_CHANGES },
        AND: [STAFF_VISIBLE, { OR: [...overlap, sameDay] }],
      },
      select: { id: true, externalReference: true, channelDetail: true },
      orderBy: { arrivalAt: 'asc' },
      take: 20,
    });
    const digits = (text: string) => text.replace(/\D/g, '');
    const letters = (text: string | null) => (text ?? '').toLowerCase().replace(/[^a-z]/g, '');
    const own = digits(externalReference);
    const provider = letters(booking.provider);
    const sameComparator = (detail: string | null) => !letters(detail) || (!!provider && letters(detail).includes(provider));
    const unreferenced = (r: { externalReference: string | null; channelDetail: string | null }) =>
      (!!own && !!r.externalReference && digits(r.externalReference) === own) ||
      ((!r.externalReference || !/\p{L}/u.test(r.externalReference)) && sameComparator(r.channelDetail));
    return rows
      .filter(unreferenced)
      .map(r => r.id)
      .slice(0, 2);
  }

  /**
   * 10/10/2026: gives a booking typed without it the comparator's reference (unreferencedMatches), by no staff member,
   * in the history (`reservation.updated`, { externalReference: { from, to } }, `source`, `inboundEmailId`). False when
   * the booking is gone, closed, changed its reference meanwhile, or another booking of the operator holds this one
   * already. 10/10/2026 (relecture): under the parking's lock, as createFromImport checks and inserts a reference, so a
   * confirmation of the same reference imported at the same moment finds this one (a duplicate) instead of failing.
   */
  public async linkExternalReference(
    operatorId: string,
    reservationId: string,
    externalReference: string,
    origin: { source: string; provider: string; inboundEmailId?: string | null },
  ): Promise<boolean> {
    const reference = externalReference.trim().toUpperCase();
    try {
      return await prisma.$transaction(async tx => {
        const before = await tx.reservation.findFirst({ where: { id: reservationId, operatorId } });
        if (!before || before.channel === 'plazo' || CLOSED_FOR_CHANGES.includes(before.status)) return false;
        if (before.externalReference === reference) return true;
        await this.capacity.lock(tx, before.parkingId);
        const { count } = await tx.reservation.updateMany({
          where: { id: before.id, operatorId, externalReference: before.externalReference },
          data: { externalReference: reference },
        });
        if (!count) return false;
        await this.audit.record(
          { id: null, operatorId },
          {
            action: 'reservation.updated',
            entityType: 'reservation',
            entityId: before.id,
            details: {
              externalReference: { from: before.externalReference, to: reference },
              by: 'inbound_email',
              source: origin.source,
              provider: origin.provider,
              ...(origin.inboundEmailId ? { inboundEmailId: origin.inboundEmailId } : {}),
            },
          },
          tx,
        );
        return true;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return false;
      throw error;
    }
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

  /** A stop of the parking (D-A), or null for the airport. */
  private async checkStop(parkingId: string, stopId: string | null | undefined): Promise<string | null> {
    if (!stopId) return null;
    const stop = await prisma.shuttleStop.findFirst({ where: { id: stopId, parkingId }, select: { id: true } });
    if (!stop) throw fieldError('stopId', 'invalid_stop');
    return stop.id;
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

      // 10/10/2026: what the traveller paid on Plazo is not the staff's to change (an unchanged value goes through).
      const priceChanged = data.priceCents !== undefined && data.priceCents !== before.priceCents;
      if (priceChanged && isPriceLocked(before)) throw fieldError('priceCents', 'price_locked');

      const datesChanged = data.arrivalAt !== undefined || data.returnAt !== undefined;
      const stay = datesChanged
        ? this.parseStay(parking, data.arrivalAt ?? before.arrivalAt.toISOString(), data.returnAt ?? before.returnAt.toISOString())
        : { arrivalAt: before.arrivalAt, returnAt: before.returnAt };
      const full = datesChanged ? await this.checkCapacity(tx, actor, parking, stay, data.force, id) : [];
      const stopId = data.stopId === undefined ? undefined : await this.checkStop(parking.id, data.stopId);
      const names = this.namesForUpdate(before, data);

      const after = await tx.reservation.update({
        where: { id },
        data: {
          channel: data.channel,
          channelDetail: data.channelDetail === undefined ? undefined : data.channelDetail?.trim() || null,
          ...stay,
          passengers: data.passengers,
          ...names,
          customerPhone: data.customerPhone?.trim(),
          customerEmail: data.customerEmail === undefined ? undefined : data.customerEmail?.trim().toLowerCase() || null,
          plate: data.plate === undefined ? undefined : formatPlate(data.plate),
          plateKey: data.plate === undefined ? undefined : plateKey(data.plate),
          returnFlight: data.returnFlight === undefined ? undefined : this.normalizeFlight(data.returnFlight),
          departureFlight: data.departureFlight === undefined ? undefined : this.normalizeFlight(data.departureFlight, 'departureFlight'),
          // A new outbound flight starts its tracking over.
          ...(data.departureFlight === undefined
            ? {}
            : { departureStatus: null, departureScheduledAt: null, departureEstimatedAt: null, departureTerminal: null, departureCheckedAt: null }),
          stopId,
          notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
          customerNote: data.customerNote === undefined ? undefined : data.customerNote?.trim() || null,
          vehicleModel: data.vehicleModel === undefined ? undefined : data.vehicleModel?.trim() || null,
          vehicleColour: data.vehicleColour === undefined ? undefined : data.vehicleColour?.trim() || null,
          priceCents: priceChanged ? data.priceCents : undefined,
          overbooked: datesChanged ? full.length > 0 : undefined,
        },
      });

      await this.audit.record(
        actor,
        { action: 'reservation.updated', entityType: 'reservation', entityId: id, details: columnChanges(before, after) as Prisma.InputJsonValue },
        tx,
      );
      return after;
    });
  }

  /**
   * 09/10/2026: a first or a last name (or both) is merged with the stored one and the display name rebuilt; an older
   * app's single `customerName` is split. A blank one is refused (null gets past the PATCH's validation).
   */
  private namesForUpdate(before: Reservation, data: UpdateReservationDto): CustomerNames | Record<string, never> {
    if (data.customerFirstName !== undefined || data.customerLastName !== undefined) {
      for (const field of ['customerFirstName', 'customerLastName'] as const) {
        if (data[field] !== undefined && !cleanNamePart(data[field])) throw fieldError(field, 'required');
      }
      return customerNamesOf({
        customerFirstName: data.customerFirstName ?? before.customerFirstName,
        customerLastName: data.customerLastName ?? before.customerLastName,
        customerName: before.customerName,
      });
    }
    if (data.customerName !== undefined) {
      if (!cleanNamePart(data.customerName)) throw fieldError('customerName', 'required');
      // An older app sends the whole form back: the same name keeps its stored split ("Marie Claire" / "Dupont").
      if (cleanNamePart(data.customerName) === cleanNamePart(before.customerName)) return {};
      return customerNamesOf({ customerName: data.customerName });
    }
    return {};
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
        (tx, refund) => this.applyStatus(actor, before, 'cancelled', tx, refund ?? undefined, data.note),
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
        return this.applyStatus(actor, before, data.status, tx, undefined, data.note);
      });
    }
    const after = await this.applyStatus(actor, before, data.status, prisma, undefined, data.note);
    // B (06/10/2026): the closing message after the handover.
    if (after.status === 'returned') await this.messages.handedBack(after.id);
    return after;
  }

  private async applyStatus(
    actor: AuthenticatedStaff,
    before: Reservation,
    status: ReservationStatus,
    client: Client,
    refund?: { paymentStatus: 'refunded'; refundedAt: Date; stripeRefundId: string; payoutStatus: 'cancelled' | 'reversed' },
    note?: string,
  ) {
    const now = new Date();
    // A remark made with the change (06/10/2026: the handover checklist's "dégât, litige…") joins the notes, dated and signed.
    const remark = note?.trim();
    const stamp = `${localDateTime(now, 'Europe/Paris').slice(0, 16).replace('T', ' ')} · ${actor.firstName || actor.name.split(' ')[0]}`;
    const notes = remark ? [before.notes?.trim(), `[${stamp}] ${remark}`].filter(Boolean).join('\n') : undefined;
    const after = await client.reservation.update({
      where: { id: before.id },
      data: {
        status,
        arrivedAt: status === 'arrived' && !before.arrivedAt ? now : status === 'upcoming' ? null : undefined,
        returnedAt: status === 'returned' ? now : before.status === 'returned' ? null : undefined,
        cancelledAt: status === 'cancelled' ? now : before.status === 'cancelled' ? null : undefined,
        // Handed back: the keys left the hook with the car, and the file has one car less (S-C).
        keyHook: status === 'returned' ? null : undefined,
        fileId: ['returned', 'cancelled', 'no_show'].includes(status) ? null : undefined,
        fileRank: ['returned', 'cancelled', 'no_show'].includes(status) ? null : undefined,
        notes,
        ...refund,
      },
    });
    await this.audit.record(
      actor,
      {
        action: 'reservation.status_changed',
        entityType: 'reservation',
        entityId: before.id,
        details: { from: before.status, to: status, ...(refund ? { refunded: true } : {}), ...(remark ? { note: remark } : {}) },
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

  /** The sheet, with the code of the spot the vehicle is on (bloc 2) and the stop served (D-A). */
  public async get(actor: AuthenticatedStaff, id: string) {
    this.require(actor, 'reservations:view');
    const reservation = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      include: {
        spot: { select: { code: true } },
        file: { select: { id: true, code: true, name: true } },
        stop: { select: { id: true, name: true, kind: true } },
      },
    });
    if (!reservation) throw notFound();
    const filePosition = reservation.fileId ? await Container.get(FileService).positionOf(reservation.fileId, reservation.id) : null;
    return { ...reservation, filePosition, nextStatuses: this.nextStatuses(actor, reservation) };
  }

  /**
   * The statuses this staff member may set next, in the journey's order (06/10/2026: served by the API
   * so the web and the app no longer copy the table). A refunded booking is closed for good.
   */
  public nextStatuses(actor: AuthenticatedStaff, booking: { status: ReservationStatus; paymentStatus: string | null }): ReservationStatus[] {
    if (booking.paymentStatus === 'refunded' || !can(actor.role, 'reservations:status')) return [];
    const decisions = can(actor.role, 'reservations:manage');
    return STATUS_TRANSITIONS[booking.status].filter(
      s => decisions || (!RELEASED_STATUSES.includes(s) && !RELEASED_STATUSES.includes(booking.status)),
    );
  }

  /**
   * Search by plate, name, phone or reference, in chronological order (10/10/2026, « Les réservations doivent être
   * affichées de manière chronologique »): by arrival, the earliest first. Without a search, the pages count from today
   * (the parking's local day), so the list opens on what is coming without hiding the past (`chronologicalPage`). A
   * search lists every match from the earliest.
   */
  public async list(actor: AuthenticatedStaff, query: { q?: string; page?: number; limit?: number }) {
    this.require(actor, 'reservations:view');
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
    // Before the first page: the bookings arriving before today (the parking's day), none for a search.
    const parking = q
      ? null
      : await prisma.parking.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { createdAt: 'asc' }, select: { timezone: true } });
    const timezone = parking?.timezone ?? 'Europe/Paris';
    const today = dayBounds(localDate(new Date(), timezone), timezone).start;
    const [totalDocs, before] = await Promise.all([
      prisma.reservation.count({ where }),
      q ? 0 : prisma.reservation.count({ where: { AND: [where, { arrivalAt: { lt: today } }] } }),
    ]);
    const { skip, take, ...pages } = chronologicalPage(totalDocs, before, limit, query.page);
    const docs = await prisma.reservation.findMany({ where, orderBy: [{ arrivalAt: 'asc' }, { id: 'asc' }], skip, take });
    return { docs, totalDocs, limit, ...pages };
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
      // Read with the nights, against the plan's room (`CapacityService.nights`): no second read of the plan.
      parking: { id: parking.id, name: parking.name, bookableCapacity: nights[0].bookable },
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

/** 10/10/2026: an import's flight that is no flight number, logged by its field only (never what was typed). */
function logUnreadableFlights(flights: ImportedFlights, provider: string | null | undefined) {
  for (const { field } of flights.unreadable) {
    logger.warn(`[Import] ${provider || 'comparator'}: ${field} is no flight number, dropped and kept in the notes`);
  }
}

/** The columns of a booking that changed, { column: { from, to } } (dates as ISO strings): the history of an update. */
function columnChanges(before: Reservation, after: Reservation): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after) as (keyof Reservation)[]) {
    if (key === 'updatedAt') continue;
    const a = before[key] instanceof Date ? (before[key] as Date).toISOString() : before[key];
    const b = after[key] instanceof Date ? (after[key] as Date).toISOString() : after[key];
    if (a !== b) changes[key] = { from: a, to: b };
  }
  return changes;
}
