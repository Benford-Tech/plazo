import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Parking, Prisma } from '@/database';
import {
  IMPORT_FIELDS,
  ImportedBooking,
  ImportRowInput,
  ImportWarning,
  MAX_IMPORT_ROWS,
  ReadRow,
  readImportRow,
  dateOrderOf,
  UNDO_HOURS,
} from '@/domain/booking-import';
import { sameTraveller } from '@/domain/import-change';
import { newReference } from '@/domain/reservation';
import { can } from '@/domain/roles';
import { addDays, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { CapacityService, occupiedNights } from './capacity.service';
import { ParkingService } from './parking.service';

type Client = Prisma.TransactionClient | typeof prisma;

export type ImportOutcome = 'create' | 'check' | 'duplicate' | 'error';

export interface ImportPreviewRow {
  line: number;
  outcome: ImportOutcome;
  errors: string[];
  warnings: ImportWarning[];
  /** The booking already in Plazo (its reference), or the earlier line of the file, the row repeats. */
  duplicateOf: { reference: string | null; line: number | null } | null;
  booking: {
    customerName: string;
    customerPhone: string;
    plate: string;
    arrivalAt: string;
    returnAt: string;
    status: string;
    channel: string;
    channelDetail: string | null;
    externalReference: string | null;
    priceCents: number | null;
    returnFlight: string | null;
    passengers: number;
    timing: ImportedBooking['timing'];
  } | null;
}

interface Classified extends ReadRow {
  outcome: ImportOutcome;
  duplicateOf: ImportPreviewRow['duplicateOf'];
  overbooked: boolean;
}

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Import not found', 'not_found');

/** The statuses whose stay holds a place (the nights of an imported booking still to come). */
const HOLDS_PLACE = new Set(['upcoming', 'arrived', 'returned']);

/**
 * 28/10/2026 (« je veux importer des anciennes réservations dans plazo et avoir un aperçu avant de valider », direction
 * A, « avec les réservations à venir aussi »): a spreadsheet of the parking's bookings, past and to come, previewed then
 * imported. The preview and the import run the same reading (domain/booking-import.ts) and the same checks, the import
 * again under the parking's lock: a duplicate (the same reference, else the same traveller arriving the same local day,
 * in Plazo or earlier in the file) is left out, a row in error too, a night already full imports the booking flagged
 * (« À vérifier »). Nothing is sent: no push, no SMS or email, and the day-before SMS is switched off for the bookings
 * to come (« Ne pas envoyer », the manager can restore it).
 */
@Service()
export class BookingImportService {
  private parkings = Container.get(ParkingService);
  private capacity = Container.get(CapacityService);
  private audit = Container.get(AuditService);

  private require(actor: AuthenticatedStaff) {
    if (!can(actor.role, 'parking:manage')) throw forbidden();
  }

  /** The rows of the request: an array of objects with a line and texts, 2 000 at most. */
  private rowsOf(body: unknown): { rows: ImportRowInput[]; fileName: string } {
    const input = (body ?? {}) as Record<string, unknown>;
    if (!Array.isArray(input.rows) || input.rows.length === 0) throw new ValidationException({ rows: 'required' });
    if (input.rows.length > MAX_IMPORT_ROWS) throw new ValidationException({ rows: 'too_many_rows' });
    const rows = input.rows.map((raw, i) => {
      const value = (raw ?? {}) as Record<string, unknown>;
      const row: ImportRowInput = { line: Number.isInteger(value.line) ? (value.line as number) : i + 2 };
      for (const field of IMPORT_FIELDS) {
        const cell = value[field];
        if (typeof cell === 'string') row[field] = cell.slice(0, 1000);
        else if (typeof cell === 'number' && Number.isFinite(cell)) row[field] = String(cell);
      }
      return row;
    });
    const fileName = typeof input.fileName === 'string' ? input.fileName.trim().slice(0, 120) : '';
    return { rows, fileName };
  }

  /** Each row's outcome against the operator's bookings and the rows above it, the nights to come counted as they go. */
  private async classify(client: Client, operatorId: string, parking: Parking, read: ReadRow[], now: Date): Promise<Classified[]> {
    const tz = parking.timezone;
    const bookings = read.map(r => r.booking).filter((b): b is ImportedBooking => !!b);
    const day = (d: Date) => localDate(d, tz);

    const references = [...new Set(bookings.map(b => b.externalReference).filter((r): r is string => !!r))];
    const byReference = new Map(
      (references.length
        ? await client.reservation.findMany({
            where: { operatorId, externalReference: { in: references } },
            select: { reference: true, externalReference: true },
          })
        : []
      ).map(r => [r.externalReference!, r.reference]),
    );

    const times = bookings.map(b => b.arrivalAt.getTime());
    const candidates = times.length
      ? await client.reservation.findMany({
          where: {
            operatorId,
            status: { not: 'pending_payment' },
            arrivalAt: { gte: new Date(Math.min(...times) - 36 * 3600_000), lte: new Date(Math.max(...times) + 36 * 3600_000) },
          },
          select: { reference: true, externalReference: true, plateKey: true, customerPhone: true, customerName: true, arrivalAt: true },
        })
      : [];
    const sameDay = new Map<string, typeof candidates>();
    for (const c of candidates) sameDay.set(day(c.arrivalAt), [...(sameDay.get(day(c.arrivalAt)) ?? []), c]);

    // The nights from today on, counted once and then row by row (a file of the season ahead fills them itself).
    const today = day(now);
    const future = bookings.filter(b => HOLDS_PLACE.has(b.status) && b.timing !== 'past');
    const lastNight = future.reduce((max, b) => (day(b.returnAt) > max ? day(b.returnAt) : max), today);
    const load = new Map(future.length ? (await this.capacity.nights(parking, today, addDays(lastNight, 1), { client })).map(n => [n.date, n]) : []);

    const seenReferences = new Map<string, number>();
    const accepted: { line: number; booking: ImportedBooking }[] = [];
    return read.map(row => {
      const base = { ...row, warnings: [...row.warnings] };
      const b = row.booking;
      if (!b) return { ...base, outcome: 'error' as const, duplicateOf: null, overbooked: false };
      const keys = { plateKey: b.plateKey, customerPhone: b.customerPhone, customerName: b.customerName };
      const duplicate = (duplicateOf: ImportPreviewRow['duplicateOf']) => ({
        ...base,
        outcome: 'duplicate' as const,
        duplicateOf,
        overbooked: false,
      });

      if (b.externalReference) {
        if (byReference.has(b.externalReference)) return duplicate({ reference: byReference.get(b.externalReference)!, line: null });
        if (seenReferences.has(b.externalReference)) return duplicate({ reference: null, line: seenReferences.get(b.externalReference)! });
      }
      const inPlazo = (sameDay.get(day(b.arrivalAt)) ?? []).find(
        c => sameTraveller(c, keys) && (!c.externalReference || !b.externalReference || c.externalReference === b.externalReference),
      );
      if (inPlazo) return duplicate({ reference: inPlazo.reference, line: null });
      const earlier = accepted.find(
        a =>
          day(a.booking.arrivalAt) === day(b.arrivalAt) &&
          sameTraveller(a.booking, keys) &&
          (!a.booking.externalReference || !b.externalReference || a.booking.externalReference === b.externalReference),
      );
      if (earlier) return duplicate({ reference: null, line: earlier.line });

      let overbooked = false;
      if (HOLDS_PLACE.has(b.status) && b.timing !== 'past') {
        const nights = occupiedNights(b.arrivalAt, b.returnAt, tz).filter(n => n >= today);
        overbooked = nights.some(n => {
          const night = load.get(n);
          return !!night && night.count + 1 > night.bookable;
        });
        for (const n of nights) {
          const night = load.get(n);
          if (night) night.count += 1;
        }
        if (overbooked) base.warnings.push('full_night');
      }
      if (b.externalReference) seenReferences.set(b.externalReference, row.line);
      accepted.push({ line: row.line, booking: b });
      return { ...base, outcome: base.warnings.length ? ('check' as const) : ('create' as const), duplicateOf: null, overbooked };
    });
  }

  private view(rows: Classified[]) {
    const counts = { create: 0, check: 0, duplicate: 0, error: 0 };
    const data: ImportPreviewRow[] = rows.map(r => {
      counts[r.outcome] += 1;
      const b = r.booking;
      return {
        line: r.line,
        outcome: r.outcome,
        errors: r.errors,
        warnings: r.warnings,
        duplicateOf: r.duplicateOf,
        booking: b && {
          customerName: b.customerName,
          customerPhone: b.customerPhone,
          plate: b.plate,
          arrivalAt: b.arrivalAt.toISOString(),
          returnAt: b.returnAt.toISOString(),
          status: b.status,
          channel: b.channel,
          channelDetail: b.channelDetail,
          externalReference: b.externalReference,
          priceCents: b.priceCents,
          returnFlight: b.returnFlight,
          passengers: b.passengers,
          timing: b.timing,
        },
      };
    });
    return { counts, rows: data };
  }

  /** POST /internal/reservations/import { rows, fileName?, dryRun? }: the preview (dryRun, nothing written) or the import. */
  public async run(actor: AuthenticatedStaff, body: unknown) {
    this.require(actor);
    const { rows, fileName } = this.rowsOf(body);
    const dryRun = (body as Record<string, unknown>)?.dryRun !== false;
    const parking = await this.parkings.getPrimary(actor);
    const now = new Date();
    // The file's date order, read from all its dates at once (a row alone can't tell « 03/04 » apart).
    const dateOrder = dateOrderOf(rows.flatMap(r => [r.arrivalDate, r.returnDate, r.bookedAt]));
    const read = rows.map(r => readImportRow(r, parking.timezone, now, dateOrder));

    if (dryRun) {
      const classified = await this.classify(prisma, actor.operatorId, parking, read, now);
      return { dryRun: true, timezone: parking.timezone, dateOrder, ...this.view(classified), import: null };
    }

    return prisma.$transaction(
      async tx => {
        await this.capacity.lock(tx, parking.id);
        const classified = await this.classify(tx, actor.operatorId, parking, read, now);
        const toCreate = classified.filter(r => r.outcome === 'create' || r.outcome === 'check');
        const stamp = new Date();
        const record = await tx.reservationImport.create({
          data: { operatorId: actor.operatorId, staffId: actor.id, fileName, createdCount: toCreate.length, createdAt: stamp },
        });
        const references = await this.newReferences(tx, toCreate.length);
        const created = toCreate.length
          ? await tx.reservation.createManyAndReturn({
              data: toCreate.map((r, i) => this.columns(r, references[i], parking, actor, record.id, stamp)),
              select: { id: true },
            })
          : [];
        const viewAs = actor.actingAs ? { viewAs: true } : {};
        if (created.length) {
          await tx.auditLog.createMany({
            data: created.map(c => ({
              operatorId: actor.operatorId,
              staffId: actor.id,
              action: 'reservation.created',
              entityType: 'reservation',
              entityId: c.id,
              details: { by: 'file_import', importId: record.id, ...viewAs },
            })),
          });
        }
        const view = this.view(classified);
        await this.audit.record(
          actor,
          {
            action: 'reservation.imported',
            entityType: 'reservation_import',
            entityId: record.id,
            details: { fileName, rows: rows.length, ...view.counts },
          },
          tx,
        );
        return { dryRun: false, timezone: parking.timezone, dateOrder, ...view, import: { id: record.id, created: created.length } };
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  }

  /** `count` customer references none of the bookings has yet. */
  private async newReferences(client: Client, count: number): Promise<string[]> {
    const references = new Set<string>();
    while (references.size < count) {
      const batch = new Set<string>();
      while (batch.size < count - references.size) {
        const reference = newReference();
        if (!references.has(reference)) batch.add(reference);
      }
      const taken = new Set(
        (await client.reservation.findMany({ where: { reference: { in: [...batch] } }, select: { reference: true } })).map(r => r.reference),
      );
      for (const reference of batch) if (!taken.has(reference)) references.add(reference);
    }
    return [...references];
  }

  private columns(
    row: Classified,
    reference: string,
    parking: Parking,
    actor: AuthenticatedStaff,
    importId: string,
    stamp: Date,
  ): Prisma.ReservationCreateManyInput {
    const b = row.booking!;
    const startedBefore = b.arrivalAt < stamp ? b.arrivalAt : stamp;
    const onSiteOrDone = b.status === 'arrived' || b.status === 'returned';
    return {
      reference,
      operatorId: actor.operatorId,
      parkingId: parking.id,
      channel: b.channel,
      channelDetail: b.channelDetail,
      status: b.status,
      arrivalAt: b.arrivalAt,
      returnAt: b.returnAt,
      passengers: b.passengers,
      customerFirstName: b.customerFirstName,
      customerLastName: b.customerLastName,
      customerName: b.customerName,
      customerPhone: b.customerPhone,
      customerEmail: b.customerEmail,
      plate: b.plate,
      plateKey: b.plateKey,
      returnFlight: b.returnFlight,
      departureFlight: b.departureFlight,
      vehicleModel: b.vehicleModel,
      notes: b.notes,
      externalReference: b.externalReference,
      priceCents: b.priceCents,
      importedPriceCents: b.channel === 'aggregator' ? b.priceCents : null,
      handover: b.handover,
      commissionOverrideCents: b.commissionOverrideCents,
      overbooked: row.overbooked,
      createdById: actor.id,
      importId,
      // The day the booking was made counts for the revenue « par jour de réservation » and the comparator's rate: the
      // file's own date, else the arrival of a stay already begun, else the import.
      createdAt: b.bookedAt ?? (b.timing === 'future' ? stamp : startedBefore),
      updatedAt: stamp,
      arrivedAt: onSiteOrDone ? b.arrivalAt : null,
      returnedAt: b.status === 'returned' ? b.returnAt : null,
      cancelledAt: b.status === 'cancelled' ? startedBefore : null,
      // Nothing goes to the traveller for an imported booking: the day-before SMS is left out (« Ne pas envoyer »,
      // restorable), and the messages of a stay already begun or over count as sent.
      reminderExcludedAt: b.status === 'upcoming' ? stamp : null,
      reminderExcludedById: b.status === 'upcoming' ? actor.id : null,
      confirmationSentAt: stamp,
      parkedNotifiedAt: onSiteOrDone ? stamp : null,
      closingSentAt: b.status === 'returned' ? stamp : null,
    };
  }

  /** GET /internal/reservations/imports: the last ten imports, with whether « Retirer cet import » is still open. */
  public async list(actor: AuthenticatedStaff) {
    this.require(actor);
    const now = Date.now();
    const rows = await prisma.reservationImport.findMany({
      where: { operatorId: actor.operatorId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { staff: { select: { firstName: true, lastName: true } } },
    });
    return {
      data: rows.map(r => {
        const until = new Date(r.createdAt.getTime() + UNDO_HOURS * 3600_000);
        return {
          id: r.id,
          fileName: r.fileName,
          createdAt: r.createdAt.toISOString(),
          createdCount: r.createdCount,
          removedCount: r.removedCount,
          undoneAt: r.undoneAt?.toISOString() ?? null,
          undoableUntil: !r.undoneAt && r.createdCount > 0 && until.getTime() > now ? until.toISOString() : null,
          by: r.staff ? `${r.staff.firstName} ${r.staff.lastName}`.trim() : null,
        };
      }),
    };
  }

  /**
   * POST /internal/reservations/imports/:id/undo: within 24 hours, removes the import's bookings nobody touched since —
   * no audit entry after the import (status, place, edit…), no shuttle trip, email, contract, condition report, service
   * or SMS on them. The others stay (`kept`).
   */
  public async undo(actor: AuthenticatedStaff, id: string) {
    this.require(actor);
    return prisma.$transaction(async tx => {
      const record = await tx.reservationImport.findFirst({ where: { id, operatorId: actor.operatorId } });
      if (!record) throw notFound();
      if (record.undoneAt) throw new HttpException(httpStatus.CONFLICT, 'This import was already removed', 'already_undone');
      if (Date.now() - record.createdAt.getTime() > UNDO_HOURS * 3600_000) {
        throw new HttpException(httpStatus.CONFLICT, 'An import can be removed within 24 hours', 'undo_expired');
      }
      const ids = (await tx.reservation.findMany({ where: { importId: id }, select: { id: true } })).map(r => r.id);
      const touched = new Set(
        (
          await tx.auditLog.findMany({
            where: {
              operatorId: actor.operatorId,
              entityType: 'reservation',
              entityId: { in: ids },
              NOT: { action: 'reservation.created', details: { path: ['importId'], equals: id } },
            },
            select: { entityId: true },
          })
        ).map(a => a.entityId!),
      );
      const removable = ids.filter(r => !touched.has(r));
      const { count } = await tx.reservation.deleteMany({
        where: {
          id: { in: removable },
          importId: id,
          shuttleTrips: { none: {} },
          inboundEmails: { none: {} },
          contract: null,
          inspections: { none: {} },
          extras: { none: {} },
          smsOutbox: { none: {} },
          signatureCodes: { none: {} },
        },
      });
      await tx.reservationImport.update({ where: { id }, data: { undoneAt: new Date(), removedCount: count } });
      await this.audit.record(
        actor,
        {
          action: 'reservation.import_removed',
          entityType: 'reservation_import',
          entityId: id,
          details: { removed: count, kept: ids.length - count },
        },
        tx,
      );
      return { removed: count, kept: ids.length - count };
    });
  }
}
