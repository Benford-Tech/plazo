import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma from '@/database';
import {
  Commission,
  CommissionBooking,
  commissionOf,
  CommissionRate,
  comparatorKey,
  isComparatorChannel,
  KNOWN_COMPARATORS,
  MAX_RATE_BP,
  rateOn,
  validateRate,
} from '@/domain/comparator-commission';
import { can } from '@/domain/roles';
import { DATE_RE, dayBounds, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { ParkingService } from './parking.service';
import { STAFF_VISIBLE } from './reservation.service';

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');

export interface ComparatorCommissionView {
  key: string;
  label: string;
  /** The rate in force today, null when none is set. */
  current: CommissionRate | null;
  /** Rates that start after today. */
  upcoming: CommissionRate[];
  /** Every rate set, the latest start first. */
  history: CommissionRate[];
  /** The comparator's bookings made this month (local days of the parking). */
  bookingsThisMonth: number;
}

/**
 * What each comparator takes (19/10/2026, « paramétrer le taux de commission de chaque comparateur », choice « les
 * 3 »): the managers set a rate per comparator from a day on (Parking › Réglages › Comparateurs, and the revenue page's
 * « Par canal »), and a booking's own exception (its sheet). The revenue page and the bookings show what the operator
 * keeps. Plazo's own bookings are not concerned: the platform's commission is in « Reversements ».
 */
@Service()
export class CommissionService {
  public parkings = Container.get(ParkingService);
  public audit = Container.get(AuditService);

  /** Every rate of the operator, for `commissionOf`. */
  public async rates(operatorId: string): Promise<CommissionRate[]> {
    return prisma.comparatorCommission.findMany({
      where: { operatorId },
      select: { comparatorKey: true, label: true, rateBp: true, fixedCents: true, effectiveFrom: true },
    });
  }

  /** The commission of each booking (null for a booking that is not a comparator's), rates read once. */
  public async of<T extends CommissionBooking>(operatorId: string, timeZone: string, bookings: T[]): Promise<(Commission | null)[]> {
    if (!bookings.some(b => isComparatorChannel(b.channel))) return bookings.map(() => null);
    const rates = await this.rates(operatorId);
    return bookings.map(b => commissionOf(b, rates, timeZone));
  }

  /** The comparators the operator deals with: the known four, every name on its bookings, every rate set. */
  public async list(actor: AuthenticatedStaff, now: Date = new Date()): Promise<{ today: string; comparators: ComparatorCommissionView[] }> {
    if (!can(actor.role, 'revenue:view')) throw forbidden();
    const parking = await this.parkings.getPrimary(actor);
    const today = localDate(now, parking.timezone);
    const monthStart = dayBounds(`${today.slice(0, 7)}-01`, parking.timezone).start;
    const [rates, names, month] = await Promise.all([
      this.rates(actor.operatorId),
      prisma.reservation.groupBy({
        by: ['channelDetail'],
        where: { operatorId: actor.operatorId, channel: { in: ['aggregator', 'import'] }, channelDetail: { not: null }, AND: [STAFF_VISIBLE] },
        _count: { _all: true },
      }),
      prisma.reservation.groupBy({
        by: ['channelDetail'],
        where: {
          operatorId: actor.operatorId,
          channel: { in: ['aggregator', 'import'] },
          channelDetail: { not: null },
          status: { not: 'cancelled' },
          createdAt: { gte: monthStart },
          AND: [STAFF_VISIBLE],
        },
        _count: { _all: true },
      }),
    ]);

    const labels = new Map<string, string>();
    const counts = new Map<string, number>();
    for (const name of KNOWN_COMPARATORS) labels.set(comparatorKey(name)!, name);
    // The name the bookings use most is the one shown, unless a rate already names it.
    for (const row of [...names].sort((a, b) => b._count._all - a._count._all)) {
      const key = comparatorKey(row.channelDetail);
      if (key && !labels.has(key)) labels.set(key, row.channelDetail!.replace(/\s+/g, ' ').trim());
    }
    for (const row of month) {
      const key = comparatorKey(row.channelDetail);
      if (key) counts.set(key, (counts.get(key) ?? 0) + row._count._all);
    }
    const byLatest = [...rates].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    for (const rate of byLatest) if (!labels.has(rate.comparatorKey)) labels.set(rate.comparatorKey, rate.label);
    for (const rate of [...byLatest].reverse()) labels.set(rate.comparatorKey, rate.label);

    const comparators = [...labels.entries()].map(([key, label]) => {
      const history = byLatest.filter(r => r.comparatorKey === key);
      return {
        key,
        label,
        current: rateOn(rates, key, today),
        upcoming: history.filter(r => r.effectiveFrom > today).reverse(),
        history,
        bookingsThisMonth: counts.get(key) ?? 0,
      };
    });
    // The busiest first, then by name.
    comparators.sort((a, b) => b.bookingsThisMonth - a.bookingsThisMonth || a.label.localeCompare(b.label, 'fr'));
    return { today, comparators };
  }

  /** A comparator's rate from a day on; the same day again replaces it. */
  public async setRate(actor: AuthenticatedStaff, body: Record<string, unknown>): Promise<CommissionRate> {
    if (!can(actor.role, 'revenue:view')) throw forbidden();
    const checked = validateRate(body);
    if (!checked.ok) throw new ValidationException(checked.fields);
    const { label, rateBp, fixedCents, effectiveFrom } = checked.value;
    const key = comparatorKey(label)!;
    const where = { operatorId_comparatorKey_effectiveFrom: { operatorId: actor.operatorId, comparatorKey: key, effectiveFrom } };
    return prisma.$transaction(async tx => {
      const before = await tx.comparatorCommission.findUnique({ where });
      const row = await tx.comparatorCommission.upsert({
        where,
        create: { operatorId: actor.operatorId, comparatorKey: key, label, rateBp, fixedCents, effectiveFrom, createdById: actor.id },
        update: { label, rateBp, fixedCents },
      });
      await this.audit.record(
        actor,
        {
          action: 'comparator_commission.updated',
          entityType: 'comparator_commission',
          entityId: row.id,
          details: {
            comparator: key,
            effectiveFrom,
            rateBp: { from: before?.rateBp ?? null, to: rateBp },
            fixedCents: { from: before?.fixedCents ?? null, to: fixedCents },
          },
        },
        tx,
      );
      return { comparatorKey: row.comparatorKey, label: row.label, rateBp: row.rateBp, fixedCents: row.fixedCents, effectiveFrom: row.effectiveFrom };
    });
  }

  /** Takes out a rate set by mistake: the bookings it covered fall back on the one before. */
  public async removeRate(actor: AuthenticatedStaff, key: string, effectiveFrom: string): Promise<void> {
    if (!can(actor.role, 'revenue:view')) throw forbidden();
    if (!DATE_RE.test(effectiveFrom)) throw new ValidationException({ effectiveFrom: 'invalid_date' });
    const row = await prisma.comparatorCommission.findUnique({
      where: { operatorId_comparatorKey_effectiveFrom: { operatorId: actor.operatorId, comparatorKey: comparatorKey(key) ?? '', effectiveFrom } },
    });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'Rate not found', 'not_found');
    await prisma.$transaction(async tx => {
      await tx.comparatorCommission.delete({ where: { id: row.id } });
      await this.audit.record(
        actor,
        {
          action: 'comparator_commission.removed',
          entityType: 'comparator_commission',
          entityId: row.id,
          details: { comparator: row.comparatorKey, effectiveFrom, rateBp: row.rateBp, fixedCents: row.fixedCents },
        },
        tx,
      );
    });
  }

  /**
   * One booking's exception: a rate (basis points) or an amount (cents), or neither to go back to the comparator's
   * rate. Only a comparator's booking.
   */
  public async setOverride(
    actor: AuthenticatedStaff,
    id: string,
    body: { rateBp?: unknown; amountCents?: unknown },
  ): Promise<{ id: string; commission: Commission | null }> {
    if (!can(actor.role, 'revenue:view')) throw forbidden();
    const rateBp = body.rateBp ?? null;
    const amountCents = body.amountCents ?? null;
    const fields: Record<string, string> = {};
    if (rateBp !== null && (typeof rateBp !== 'number' || !Number.isInteger(rateBp) || rateBp < 0 || rateBp > MAX_RATE_BP))
      fields.rateBp = 'rate_range';
    if (amountCents !== null && (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 0 || amountCents > 10000000))
      fields.amountCents = 'invalid_amount';
    if (rateBp !== null && amountCents !== null) fields.amountCents = 'rate_or_amount';
    if (Object.keys(fields).length) throw new ValidationException(fields);

    const before = await prisma.reservation.findFirst({ where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] } });
    if (!before) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    if (!isComparatorChannel(before.channel) || !comparatorKey(before.channelDetail))
      throw new HttpException(httpStatus.BAD_REQUEST, 'Only a comparator booking has a comparator commission', 'not_comparator');

    const after = await prisma.$transaction(async tx => {
      const updated = await tx.reservation.update({
        where: { id },
        data: { commissionOverrideBp: rateBp as number | null, commissionOverrideCents: amountCents as number | null },
      });
      await this.audit.record(
        actor,
        {
          action: 'reservation.updated',
          entityType: 'reservation',
          entityId: id,
          details: {
            commissionOverride: {
              from: { rateBp: before.commissionOverrideBp, amountCents: before.commissionOverrideCents },
              to: { rateBp, amountCents },
            },
          },
        },
        tx,
      );
      return updated;
    });
    const parking = await this.parkings.getPrimary(actor);
    const [commission] = await this.of(actor.operatorId, parking.timezone, [after]);
    return { id, commission };
  }
}
