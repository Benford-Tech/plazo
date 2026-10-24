import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma, Reservation, ReservationStatus } from '@/database';
import { can } from '@/domain/roles';
import {
  canTransition,
  formatFlight,
  formatPlate,
  importedPlate,
  isPriceLocked,
  newReference,
  PLATE_OPTIONAL_CHANNELS,
  plateKey,
  RELEASED_STATUSES,
  STATUS_TRANSITIONS,
  statusSideEffects,
} from '@/domain/reservation';
import { ParsedBooking, parseConfirmationEmail } from '@/domain/importers';
import type { OneparkSummaryStay } from '@/domain/importers/onepark';
import { addDays, DATE_RE, dayBounds, exceedsCalendarDays, localDate, localDateTime, parseInstant } from '@/domain/time';
import { ChangeStatusDto, CreateReservationDto, UpdateReservationDto } from '@/dtos/reservation.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { childSeatColumns, childSeatsOf, childSeatsRefusal, NO_CHILD_SEATS } from '@/domain/child-seats';
import { cleanNamePart, CustomerNames, customerNamesOf, importedNames } from '@/domain/customer-name';
import { ImportChange, ImportChangeReason, importChanges, nameWords, phoneKey, sameTraveller, withoutField } from '@/domain/import-change';
import { REQUIRED_FOR_IMPORT } from '@/domain/inbound-email';
import { ImportedFlights, importedFlights, notesWithLines, unreadableFlightLines } from '@/domain/imported-flights';
import { chronologicalPage } from '@/domain/chronological-pages';
import { BOARDING_CHECK_IN_SELECT, boardingCheckInOf } from '@/domain/shuttle';
import { FileService } from './file.service';
import { AuditService } from './audit.service';
import { CommissionService } from './commission.service';
import { CapacityService, NightLoad, occupiedNights } from './capacity.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { TravellerMessagesService } from './traveller-messages.service';
import { ParkingService } from './parking.service';
import { PaymentService } from './payment.service';
import { SmsService } from './sms.service';
import { TestFeedService } from './test-feed.service';

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
/** 20/10/2026: what Onepark's daily summary did, by booking number (completeFromSummary). */
export interface SummaryReport {
  /** Took its number or its plate. */
  completed: string[];
  upToDate: string[];
  /** Plazo has another plate for it (the team's is kept). */
  plateDiffers: string[];
  /** No booking of it in Plazo, and none created (its stay is over, or its dates cannot be read). */
  missing: string[];
  /** 20/10/2026 (« Les créer »): created from the summary itself, without a phone (« À saisir »). */
  created: string[];
  /** Several bookings could be it. */
  ambiguous: string[];
  /** 21/10/2026 (« je veux voir les réservations même annulées »): cancelled or no-show in Plazo, though Onepark still
   * lists the stay: shown, never changed nor created again. */
  cancelled: string[];
}

/**
 * 21/10/2026: a comparator's cancellation of one of its bookings: `cancelled` by Plazo, already `cancelled_before`, or
 * left to the staff (`left`, with the reason: unknown booking, several, a car already there, a closed booking).
 */
export interface ImportCancellationResult {
  outcome: 'cancelled' | 'cancelled_before' | 'left';
  reason?: ImportChangeReason;
  reservation: Reservation | null;
}

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
  public testFeed = Container.get(TestFeedService);

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
    const seatsRefusal = childSeatsRefusal({ ...NO_CHILD_SEATS, ...(data.childSeats ?? {}) }, data.passengers);
    if (seatsRefusal) throw fieldError('childSeats', seatsRefusal);

    const externalReference = data.externalReference?.trim().toUpperCase() || null;
    // 15/10/2026: a comparator's booking may come without its plate (« Compléter » an email without it): stored ''.
    // A plate without a letter or a digit (« -- ») is none: '' stands for « no plate » (plateKey '').
    const plate = typeof data.plate === 'string' && plateKey(data.plate) ? formatPlate(data.plate) : '';
    if (!plate && !PLATE_OPTIONAL_CHANNELS.includes(data.channel)) throw fieldError('plate', 'invalid_plate');

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
            plate,
            plateKey: plateKey(plate),
            returnFlight,
            departureFlight,
            stopId,
            notes: data.notes?.trim() || null,
            customerNote: data.customerNote?.trim() || null,
            vehicleModel: data.vehicleModel?.trim() || null,
            vehicleColour: data.vehicleColour?.trim() || null,
            ...childSeatColumns(data.childSeats),
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
   * night does not stop it (the comparator already sold the place: overbooked and flagged). 15/10/2026 (« ne pas planter
   * à l'import quand la plaque est manquante »): without a plate (or what is no plate: importedPlate) the booking is
   * created with '' (read on arrival).
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
    const plate = importedPlate(parsed.plate) ?? '';
    const key = plateKey(plate);
    const names = importedNames(parsed);
    const system = { id: null, operatorId };
    const created = await prisma.$transaction(async tx => {
      await this.capacity.lock(tx, parking.id);
      const existing = await this.importDuplicate(tx, operatorId, parsed, stay.arrivalAt);
      if (existing) return { reservation: existing, duplicate: true };
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
          ...names,
          customerPhone: parsed.customerPhone!.trim(),
          customerEmail: parsed.customerEmail?.trim().toLowerCase() || null,
          plate,
          plateKey: key,
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
   * The booking of the operator an import is a duplicate of (createFromImport): the one with its external reference;
   * without a reference (L-A, 08/10/2026: an email read by Claude may carry none), the same traveller arriving at the same
   * moment (the mail forwarded twice, or by two people): the same plate, or, without a plate (15/10/2026), the same phone
   * and a word of the name in common (sameTraveller).
   */
  private async importDuplicate(client: Client, operatorId: string, parsed: ParsedBooking, arrivalAt: Date): Promise<Reservation | null> {
    const externalReference = parsed.externalReference?.trim().toUpperCase() || null;
    if (externalReference) return client.reservation.findUnique({ where: { operatorId_externalReference: { operatorId, externalReference } } });
    const key = plateKey(importedPlate(parsed.plate) ?? '');
    const incoming = { plateKey: key, customerPhone: parsed.customerPhone ?? '', customerName: importedNames(parsed).customerName };
    const rows = await client.reservation.findMany({
      where: {
        operatorId,
        arrivalAt,
        status: { notIn: ['cancelled', 'no_show'] },
        ...(key ? { plateKey: { in: [key, ''] } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return rows.find(r => sameTraveller(r, incoming)) ?? null;
  }

  /**
   * 16/10/2026 (« relie les mail deja traité »): an imported booking whose stay is over at `now` (its return passed, read in
   * the parking's time zone), with the booking createFromImport would find for it (importDuplicate, nothing created; null
   * when there is none); null when the stay is not over or its dates cannot be read. The re-reading of the mails already
   * received only links such a stay to the booking Plazo has of it, never creates one.
   */
  public async overStay(operatorId: string, parsed: ParsedBooking, now: Date): Promise<{ existing: Reservation | null } | null> {
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    const arrivalAt = parking && parsed.arrivalAt ? parseInstant(parsed.arrivalAt, parking.timezone) : null;
    const returnAt = parking && parsed.returnAt ? parseInstant(parsed.returnAt, parking.timezone) : null;
    if (!arrivalAt || !returnAt || returnAt.getTime() > now.getTime()) return null;
    return { existing: await this.importDuplicate(prisma, operatorId, parsed, arrivalAt) };
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
      // 15/10/2026 (relecture de « ne pas planter à l'import quand la plaque est manquante »): the plate of a car already
      // on the parking is the one the team read on it (often typed on arrival, the comparator having none): a comparator's
      // never replaces it. A booking still without a plate takes the comparator's.
      if (before.plateKey && before.status !== 'upcoming') diff = withoutField(diff, 'plate');
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
   * 20/10/2026 (Onepark's daily summary, « Voici le résumé des réservations en cours et à venir »): each stay it lists
   * completes the Onepark booking Plazo has of it, never makes one (the summary gives no phone). The booking is the one
   * with its number, else the only Onepark booking without a number for the same local arrival and a word of the name in
   * common (one typed by hand, or imported from Onepark's short notice, which has no number). It takes the number when it
   * has none and the plate when it has none; a plate the team typed is never replaced (a different one is reported).
   * Neither a Plazo booking nor a closed one is touched. Written under the booking's row lock, in its history.
   * 21/10/2026: a cancelled or no-show booking is found as well (by its number, its name and arrival, or its car) and
   * reported, never changed nor created again.
   */
  public async completeFromSummary(
    operatorId: string,
    stays: OneparkSummaryStay[],
    origin: { inboundEmailId?: string | null },
    now: Date = new Date(),
  ): Promise<SummaryReport> {
    const report: SummaryReport = { completed: [], upToDate: [], plateDiffers: [], missing: [], ambiguous: [], created: [], cancelled: [] };
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) return { ...report, missing: stays.map(s => s.reference) };
    for (const stay of stays) {
      const byReference = await prisma.reservation.findFirst({ where: { operatorId, externalReference: stay.reference }, select: { id: true } });
      let id = byReference?.id ?? null;
      if (!id && stay.arrivalAt) {
        const arrival = parseInstant(stay.arrivalAt, parking.timezone);
        const words = new Set(nameWords(stay.customerName));
        const candidates = arrival
          ? await prisma.reservation.findMany({
              where: {
                operatorId,
                channel: 'aggregator',
                externalReference: null,
                arrivalAt: arrival,
                // 21/10/2026: a cancelled booking is found too (and reported), never created again.
                status: { not: 'pending_payment' },
                OR: [{ channelDetail: { equals: 'Onepark', mode: 'insensitive' } }, { channelDetail: null }, { channelDetail: '' }],
              },
              select: { id: true, customerName: true },
            })
          : [];
        const same = candidates.filter(c => nameWords(c.customerName).some(w => words.has(w)));
        if (same.length > 1) {
          report.ambiguous.push(stay.reference);
          continue;
        }
        id = same[0]?.id ?? null;
      }
      const plate = importedPlate(stay.plate);
      if (!id) {
        // 20/10/2026 (« Les créer »): the car is on the parking, the team must see it. The same car on another booking of
        // this stay (typed by hand, another channel) takes the number instead; two of them are left to the team.
        const arrivalAt = stay.arrivalAt ? parseInstant(stay.arrivalAt, parking.timezone) : null;
        const returnAt = stay.returnAt ? parseInstant(stay.returnAt, parking.timezone) : null;
        if (!arrivalAt || !returnAt || returnAt <= arrivalAt || returnAt.getTime() <= now.getTime()) {
          report.missing.push(stay.reference);
          continue;
        }
        const samePlate = plate
          ? await prisma.reservation.findMany({
              where: {
                operatorId,
                plateKey: plateKey(plate),
                // 21/10/2026: a cancelled booking is found too (and reported), never created again.
                status: { not: 'pending_payment' },
                arrivalAt: { lt: returnAt },
                returnAt: { gt: arrivalAt },
              },
              select: { id: true, externalReference: true },
            })
          : [];
        if (samePlate.length > 1 || (samePlate[0]?.externalReference && samePlate[0].externalReference !== stay.reference)) {
          report.ambiguous.push(stay.reference);
          continue;
        }
        if (samePlate[0]) {
          id = samePlate[0].id;
        } else {
          const { duplicate } = await this.createFromImport(operatorId, {
            provider: 'Onepark',
            externalReference: stay.reference,
            arrivalAt: stay.arrivalAt,
            returnAt: stay.returnAt,
            customerName: stay.customerName,
            customerPhone: '',
            plate: plate ?? undefined,
          });
          report[duplicate ? 'upToDate' : 'created'].push(stay.reference);
          continue;
        }
      }
      const outcome = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
        const before = await tx.reservation.findFirst({ where: { id: id!, operatorId } });
        if (!before) return 'upToDate' as const;
        if (before.status === 'cancelled' || before.status === 'no_show') return 'cancelled' as const;
        if (before.channel === 'plazo' || CLOSED_FOR_CHANGES.includes(before.status)) return 'upToDate' as const;
        const data: Prisma.ReservationUpdateInput = {};
        if (!before.externalReference) data.externalReference = stay.reference;
        const differs = !!plate && !!before.plateKey && before.plateKey !== plateKey(plate);
        if (plate && !before.plateKey) Object.assign(data, { plate, plateKey: plateKey(plate) });
        if (!Object.keys(data).length) return differs ? ('plateDiffers' as const) : ('upToDate' as const);
        const after = await tx.reservation.update({ where: { id: before.id }, data });
        await this.audit.record(
          { id: null, operatorId },
          {
            action: 'reservation.updated',
            entityType: 'reservation',
            entityId: before.id,
            details: {
              ...columnChanges(before, after),
              by: 'inbound_email',
              source: 'onepark_summary',
              provider: 'Onepark',
              ...(origin.inboundEmailId ? { inboundEmailId: origin.inboundEmailId } : {}),
            } as Prisma.InputJsonValue,
          },
          tx,
        );
        return differs ? ('plateDiffers' as const) : ('completed' as const);
      });
      report[outcome].push(stay.reference);
    }
    return report;
  }

  /**
   * 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): the operator's bookings a comparator's change may be
   * about although they lack its reference (typed by hand from the inbox, « Compléter », before the booking page was
   * read): a comparator's booking (never a Plazo one) without a reference, or with the same digits (« AL 123829327 »),
   * or with one that names no comparator (no letter: « 123829327 ») when the booking names no other comparator (its
   * channel's detail blank or this one: a numeric reference may be Onepark's), for the same car (plateKey) and a stay that
   * overlaps the comparator's or begins the same local day, neither cancelled nor a no-show. Two ids at most: one is
   * the booking, two make the change ambiguous. 15/10/2026: when the comparator or the booking has no plate, the same
   * traveller stands for the car (sameTraveller: the same phone, 6 digits at least, and a word of the name in common, so
   * that a change never lands on another traveller sharing a phone); none without a plate and a phone, or without a stay.
   * Every candidate is read (no cut-off that could hide the booking and make a second one). 10/10/2026
   * (relecture): a booking without a reference that names another comparator (« Onepark », « Site du parking ») is not
   * this one either (« Allopark.com » typed by hand still names it), and a closed booking (handed back: its planned stay
   * still overlaps) never takes the reference, which would then keep the real booking from being created.
   */
  public async unreferencedMatches(operatorId: string, booking: ParsedBooking, externalReference: string): Promise<string[]> {
    const key = plateKey(importedPlate(booking.plate) ?? '');
    const phone = booking.customerPhone ? phoneKey(booking.customerPhone) : '';
    if ((!key && phone.length < 6) || !booking.arrivalAt || !booking.returnAt) return [];
    const incoming = { plateKey: key, customerPhone: booking.customerPhone ?? '', customerName: importedNames(booking).customerName };
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
        ...(key ? { plateKey: { in: [key, ''] } } : {}),
        status: { notIn: CLOSED_FOR_CHANGES },
        AND: [STAFF_VISIBLE, { OR: [...overlap, sameDay] }],
      },
      select: { id: true, externalReference: true, channelDetail: true, plateKey: true, customerPhone: true, customerName: true },
      orderBy: { arrivalAt: 'asc' },
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
      .filter(r => sameTraveller(r, incoming))
      .filter(unreferenced)
      .map(r => r.id)
      .slice(0, 2);
  }

  /**
   * 15/10/2026 (relecture de « ne pas planter à l'import quand la plaque est manquante »): whether the staff made this
   * traveller's booking themselves while the email waited in « À traiter » (typed at the counter, by phone…): a booking of
   * the operator created after `since`, whatever its status (one the staff cancelled or marked a no-show since is theirs
   * too: the email never brings it back), whose stay overlaps the email's or begins the same local day, for the same phone
   * (6 digits at least) or the same name (the words of one within the other's), other than one with the email's own
   * reference (that one, createFromImport finds as a duplicate). Plazo's automatic re-analyses then leave the email to the
   * staff rather than make a second booking of the same car. Wider than sameTraveller on purpose: a match here only
   * leaves the email in « À traiter », as it was.
   */
  public async typedSince(operatorId: string, booking: ParsedBooking, since: Date): Promise<boolean> {
    if (!booking.arrivalAt || !booking.returnAt) return false;
    const phone = booking.customerPhone ? phoneKey(booking.customerPhone) : '';
    const words = nameWords(importedNames(booking).customerName);
    if (phone.length < 6 && !words.length) return false;
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) return false;
    const arrivalAt = parseInstant(booking.arrivalAt, parking.timezone);
    const returnAt = parseInstant(booking.returnAt, parking.timezone);
    if (!arrivalAt || !returnAt) return false;
    const day = dayBounds(localDate(arrivalAt, parking.timezone), parking.timezone);
    const sameDay: Prisma.ReservationWhereInput = { arrivalAt: { gte: day.start, lt: day.end } };
    const overlap: Prisma.ReservationWhereInput[] = returnAt > arrivalAt ? [{ arrivalAt: { lt: returnAt }, returnAt: { gt: arrivalAt } }] : [];
    const rows = await prisma.reservation.findMany({
      where: { operatorId, createdAt: { gt: since }, AND: [STAFF_VISIBLE, { OR: [...overlap, sameDay] }] },
      select: { externalReference: true, customerPhone: true, customerName: true },
    });
    const reference = booking.externalReference?.trim().toUpperCase() || null;
    const within = (a: string[], b: string[]) => a.length > 0 && a.every(w => b.includes(w));
    return rows.some(r => {
      if (reference && r.externalReference === reference) return false;
      if (phone.length >= 6 && phoneKey(r.customerPhone) === phone) return true;
      const theirs = nameWords(r.customerName);
      return within(words, theirs) || within(theirs, words);
    });
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

    const missing = REQUIRED_FOR_IMPORT.filter(key => !parsed[key]);

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
      // 15/10/2026: a blank or null plate (Plazo Pro in the stores always sends the field) leaves a booking without a
      // plate as it is; a plate is never erased.
      const plate = typeof data.plate === 'string' && plateKey(data.plate) ? formatPlate(data.plate) : undefined;
      if (plate === undefined && data.plate !== undefined && before.plateKey) throw fieldError('plate', 'required');
      // Nor does a booking without a plate move to a channel that needs one (the phone, the counter) unless it is typed.
      const channel = data.channel ?? before.channel;
      if (channel !== before.channel && !PLATE_OPTIONAL_CHANNELS.includes(channel) && !plateKey(plate ?? before.plate)) {
        throw fieldError('plate', 'required');
      }
      // Child car seats (24/10/2026): fewer than the passengers, one adult at least.
      const seats = data.childSeats === undefined ? childSeatsOf(before) : { ...NO_CHILD_SEATS, ...(data.childSeats ?? {}) };
      const seatsRefusal = childSeatsRefusal(seats, data.passengers ?? before.passengers);
      if (seatsRefusal) throw fieldError('childSeats', seatsRefusal);

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
          plate,
          plateKey: plate === undefined ? undefined : plateKey(plate),
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
          ...(data.childSeats === undefined ? {} : childSeatColumns(data.childSeats)),
          priceCents: priceChanged ? data.priceCents : undefined,
          overbooked: datesChanged ? full.length > 0 : undefined,
        },
      });

      await this.audit.record(
        actor,
        { action: 'reservation.updated', entityType: 'reservation', entityId: id, details: columnChanges(before, after) as Prisma.InputJsonValue },
        tx,
      );
      return { ...after, childSeats: childSeatsOf(after) };
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
    // The row locked and read again: a traveller checked in meanwhile as they boarded a drop-off (« Embarquer en un
    // geste ») is not cancelled over their running trip; the same change made meanwhile is done.
    const after = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
      const current = await tx.reservation.findUniqueOrThrow({ where: { id } });
      if (current.status === before.status) return this.applyStatus(actor, before, data.status, tx, undefined, data.note);
      if (current.status === data.status) return current;
      throw new HttpException(httpStatus.BAD_REQUEST, `Cannot go from ${current.status} to ${data.status}`, 'invalid_transition');
    });
    // B (06/10/2026): the closing message after the handover.
    if (after.status === 'returned') await this.messages.handedBack(after.id);
    return after;
  }

  private async applyStatus(
    actor: AuthenticatedStaff,
    before: Reservation,
    status: ReservationStatus,
    client: Client,
    refund?: { paymentStatus: 'refunded'; refundedAt: Date; stripeRefundId: string | null; payoutStatus: 'cancelled' | 'reversed' },
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
        // Checked in once; back to "Attendu", no longer checked in at a boarding (« Embarquer en un geste »); handed back,
        // the keys left the hook with the car, and the file has one car less (S-C).
        ...statusSideEffects(before, status, now),
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
   * 21/10/2026 (« apprends à traiter les annulations ParkVia »): a comparator's own cancellation notice cancels the
   * booking it names (its reference, this comparator or none named), by no staff member: the row locked and read again,
   * only a booking still « Attendu » (a car already there, or a stay over, is the staff's), never a Plazo booking; history
   * `reservation.status_changed` with `source`, the notes say so, the file or spot freed (statusSideEffects), and the team
   * hears it (« Réservation annulée · ParkVia »). Unknown or several bookings: left to the staff.
   */
  public async applyImportCancellation(
    operatorId: string,
    provider: string,
    reference: string,
    origin: { source: string; inboundEmailId?: string | null },
    now: Date = new Date(),
  ): Promise<ImportCancellationResult> {
    const candidates = await prisma.reservation.findMany({
      where: {
        operatorId,
        AND: [STAFF_VISIBLE, { OR: [{ channelDetail: null }, { channelDetail: { equals: provider, mode: 'insensitive' } }] }],
        externalReference: { equals: reference, mode: 'insensitive' },
        channel: { not: 'plazo' },
      },
      select: { id: true },
      take: 2,
    });
    if (!candidates.length) return { outcome: 'left', reason: 'unknown_booking', reservation: null };
    if (candidates.length > 1) return { outcome: 'left', reason: 'ambiguous', reservation: null };
    const result = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${candidates[0].id} FOR UPDATE`;
      const before = await tx.reservation.findUniqueOrThrow({ where: { id: candidates[0].id } });
      if (before.status === 'cancelled') return { outcome: 'cancelled_before' as const, reservation: before };
      if (before.status !== 'upcoming') {
        const reason: ImportChangeReason = RELEASED_STATUSES.includes(before.status) ? 'reservation_closed' : 'already_arrived';
        return { outcome: 'left' as const, reason, reservation: before };
      }
      const stamp = localDateTime(now, 'Europe/Paris').slice(0, 16).replace('T', ' ');
      const notes = [before.notes?.trim(), `[${stamp}] Annulée par ${provider} (mail d'annulation).`].filter(Boolean).join('\n');
      const after = await tx.reservation.update({
        where: { id: before.id },
        data: { status: 'cancelled', ...statusSideEffects(before, 'cancelled', now), notes },
      });
      await this.audit.record(
        { id: null, operatorId },
        {
          action: 'reservation.status_changed',
          entityType: 'reservation',
          entityId: before.id,
          details: {
            from: before.status,
            to: 'cancelled',
            by: 'inbound_email',
            source: origin.source,
            provider,
            ...(origin.inboundEmailId ? { inboundEmailId: origin.inboundEmailId } : {}),
          },
        },
        tx,
      );
      return { outcome: 'cancelled' as const, reservation: after };
    });
    if (result.outcome === 'cancelled') {
      const parking = await prisma.parking.findUnique({ where: { id: result.reservation.parkingId }, select: { timezone: true } });
      await this.push.notifyBookingCancelled(result.reservation, localDateTime(result.reservation.arrivalAt, parking?.timezone ?? 'Europe/Paris'));
    }
    return result;
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

  /**
   * The sheet, with the code of the spot the vehicle is on (bloc 2), the stop served (D-A) and, when the traveller was
   * checked in as they boarded a drop-off, by whom and when (`boardingCheckIn`, « Embarquer en un geste »).
   */
  public async get(actor: AuthenticatedStaff, id: string) {
    this.require(actor, 'reservations:view');
    const found = await prisma.reservation.findFirst({
      where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      include: {
        spot: { select: { code: true } },
        file: { select: { id: true, code: true, name: true } },
        stop: { select: { id: true, name: true, kind: true } },
        boardingTrip: BOARDING_CHECK_IN_SELECT.boardingTrip,
      },
    });
    if (!found) throw notFound();
    const { boardingTrip, ...reservation } = found;
    const filePosition = reservation.fileId ? await Container.get(FileService).positionOf(reservation.fileId, reservation.id) : null;
    return {
      ...reservation,
      childSeats: childSeatsOf(reservation),
      // What the comparator takes and what the operator keeps (19/10/2026), for the managers only.
      commission: await this.commissionFor(actor, reservation),
      filePosition,
      boardingCheckIn: boardingCheckInOf({ ...reservation, boardingTrip }),
      nextStatuses: this.nextStatuses(actor, reservation),
    };
  }

  /** A booking's comparator commission, for the managers (null for the others and for a booking not a comparator's). */
  private async commissionFor(actor: AuthenticatedStaff, booking: Reservation) {
    if (!can(actor.role, 'revenue:view')) return null;
    const parking = await prisma.parking.findUnique({ where: { id: booking.parkingId }, select: { timezone: true } });
    const [commission] = await Container.get(CommissionService).of(actor.operatorId, parking?.timezone ?? 'Europe/Paris', [booking]);
    return commission;
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
  public async list(actor: AuthenticatedStaff, query: { q?: string; page?: number; limit?: number; noPrice?: boolean }) {
    this.require(actor, 'reservations:view');
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const q = query.q?.trim();
    // 21/10/2026 (« Mets en évidence les réservations sans prix »): the managers' « Sans prix » filter and its count.
    const managers = can(actor.role, 'revenue:view');
    const noPrice = managers && !!query.noPrice;
    const where: Prisma.ReservationWhereInput = noPrice
      ? this.noPriceWhere(actor.operatorId)
      : { operatorId: actor.operatorId, AND: [STAFF_VISIBLE] };
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
    const parking = await prisma.parking.findFirst({
      where: { operatorId: actor.operatorId },
      orderBy: { createdAt: 'asc' },
      select: { timezone: true },
    });
    const timezone = parking?.timezone ?? 'Europe/Paris';
    const today = dayBounds(localDate(new Date(), timezone), timezone).start;
    const [totalDocs, before, noPriceCount] = await Promise.all([
      prisma.reservation.count({ where }),
      q ? 0 : prisma.reservation.count({ where: { AND: [where, { arrivalAt: { lt: today } }] } }),
      managers ? prisma.reservation.count({ where: this.noPriceWhere(actor.operatorId) }) : null,
    ]);
    const { skip, take, ...pages } = chronologicalPage(totalDocs, before, limit, query.page);
    const rows = await prisma.reservation.findMany({ where, orderBy: [{ arrivalAt: 'asc' }, { id: 'asc' }], skip, take });
    // What each comparator takes (19/10/2026): the managers see what they keep under each price.
    const commissions = can(actor.role, 'revenue:view') ? await Container.get(CommissionService).of(actor.operatorId, timezone, rows) : [];
    const docs = rows.map((r, i) => ({ ...r, commission: commissions[i] ?? null }));
    return { docs, totalDocs, limit, ...pages, noPriceCount };
  }

  /**
   * Bookings without a price (21/10/2026): not cancelled and no amount, so they count in no revenue nor commission. The
   * same rule as the revenue page's « sans montant » (a no-show counts), whatever the date.
   */
  public noPriceWhere(operatorId: string): Prisma.ReservationWhereInput {
    return { operatorId, AND: [STAFF_VISIBLE], status: { not: 'cancelled' }, priceCents: null };
  }

  /**
   * The dashboard's « Les compléter » card: how many bookings have no price and the `limit` nearest to now (the coming
   * ones first, from the soonest, then the past ones, from the latest). Managers only (null otherwise).
   */
  public async noPrice(actor: AuthenticatedStaff, now: Date = new Date(), limit = 3) {
    if (!can(actor.role, 'revenue:view')) return null;
    const where = this.noPriceWhere(actor.operatorId);
    const select = {
      id: true,
      reference: true,
      customerName: true,
      plate: true,
      arrivalAt: true,
      channel: true,
      channelDetail: true,
    } satisfies Prisma.ReservationSelect;
    const [count, coming, past] = await Promise.all([
      prisma.reservation.count({ where }),
      prisma.reservation.findMany({
        where: { AND: [where, { arrivalAt: { gte: now } }] },
        orderBy: [{ arrivalAt: 'asc' }, { id: 'asc' }],
        take: limit,
        select,
      }),
      prisma.reservation.findMany({
        where: { AND: [where, { arrivalAt: { lt: now } }] },
        orderBy: [{ arrivalAt: 'desc' }, { id: 'asc' }],
        take: limit,
        select,
      }),
    ]);
    const next = [...coming, ...past].slice(0, limit).map(r => ({
      id: r.id,
      reference: r.reference,
      customerName: r.customerName,
      plate: r.plate,
      arrivalAt: r.arrivalAt.toISOString(),
      channel: r.channel,
      detail: r.channel === 'aggregator' || r.channel === 'import' ? r.channelDetail : null,
    }));
    return { count, next };
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
    // The platform's test operator: its fictional travellers topped up first (nothing for any other operator).
    await this.testFeed.maybeRun(actor, parking);
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
