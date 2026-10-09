import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Prisma, ReservationChannel } from '@/database';
import { can } from '@/domain/roles';
import {
  MAX_REVENUE_DAYS,
  REVENUE_BASES,
  RevenueBasis,
  RevenueBooking,
  revenueCsv,
  revenueDay,
  revenueReport,
  RevenueReport,
} from '@/domain/revenue';
import { addDays, DATE_RE, dayBounds, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { ParkingService } from './parking.service';
import { STAFF_VISIBLE } from './reservation.service';

const forbidden = () => new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
const fieldError = (field: string, code: string) => new ValidationException({ [field]: code });

/** Bookings without an amount listed for completion on the page, the most recent first. */
const MISSING_LIMIT = 50;

export interface RevenueQuery {
  from?: unknown;
  to?: unknown;
  basis?: unknown;
}

export interface RevenuePeriod {
  from: string;
  to: string;
  basis: RevenueBasis;
}

export interface RevenuePage extends RevenueReport {
  timezone: string;
  /** Bookings of the period without an amount, to complete (at most 50). */
  missing: { id: string; reference: string; customerName: string; arrivalAt: string; channel: ReservationChannel; detail: string | null }[];
}

export interface RevenueSummary {
  /** Local date the figures stop at. */
  today: string;
  month: { from: string; to: string; totalCents: number; count: number; withoutAmount: number };
  todayCents: number;
  weekCents: number;
}

/** The CSV's names of the channels (the pro space translates the API's codes itself). */
const CHANNEL_LABELS: Record<ReservationChannel, string> = {
  plazo: 'Plazo',
  website: 'Site du parking',
  phone: 'Téléphone',
  counter: 'Comptoir',
  aggregator: 'Comparateur',
  import: 'Import',
};

const SELECT = {
  id: true,
  reference: true,
  customerName: true,
  plate: true,
  arrivalAt: true,
  returnAt: true,
  createdAt: true,
  channel: true,
  channelDetail: true,
  priceCents: true,
} satisfies Prisma.ReservationSelect;

/**
 * CA-B + CA-A (09/10/2026): the revenue of the operator's bookings, for the managers: a period's report (page
 * « Chiffre d'affaires »), the dashboard's tile, the CSV, and the amount staff add to a booking that has none.
 */
@Service()
export class RevenueService {
  public parkings = Container.get(ParkingService);
  public audit = Container.get(AuditService);

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw forbidden();
  }

  /** The period asked for, checked: two local dates at most a year apart, counted by arrival unless told otherwise. */
  public period(query: RevenueQuery): RevenuePeriod {
    const from = typeof query.from === 'string' ? query.from : '';
    const to = typeof query.to === 'string' ? query.to : '';
    if (!DATE_RE.test(from)) throw fieldError('from', 'invalid_date');
    if (!DATE_RE.test(to) || to < from) throw fieldError('to', 'invalid_date');
    if (to > addDays(from, MAX_REVENUE_DAYS - 1)) throw fieldError('to', 'range_too_long');
    const basis = query.basis === undefined || query.basis === '' ? 'arrival' : query.basis;
    if (!REVENUE_BASES.includes(basis as RevenueBasis)) throw fieldError('basis', 'invalid_basis');
    return { from, to, basis: basis as RevenueBasis };
  }

  /** Bookings that count: seen by staff, not cancelled, their arrival (or booking) instant inside the local days. */
  private async bookings(actor: AuthenticatedStaff, period: RevenuePeriod, timeZone: string) {
    const start = dayBounds(period.from, timeZone).start;
    const end = dayBounds(period.to, timeZone).end;
    const field = period.basis === 'arrival' ? 'arrivalAt' : 'createdAt';
    return prisma.reservation.findMany({
      where: { operatorId: actor.operatorId, AND: [STAFF_VISIBLE], status: { not: 'cancelled' }, [field]: { gte: start, lt: end } },
      select: SELECT,
    });
  }

  public async report(actor: AuthenticatedStaff, query: RevenueQuery): Promise<RevenuePage> {
    this.require(actor, 'revenue:view');
    const period = this.period(query);
    const parking = await this.parkings.getPrimary(actor);
    const bookings = await this.bookings(actor, period, parking.timezone);
    const report = revenueReport(bookings as RevenueBooking[], { ...period, timeZone: parking.timezone });
    const missing = bookings
      .filter(b => b.priceCents === null)
      .sort((a, b) => b.arrivalAt.getTime() - a.arrivalAt.getTime())
      .slice(0, MISSING_LIMIT)
      .map(b => ({
        id: b.id,
        reference: b.reference,
        customerName: b.customerName,
        arrivalAt: b.arrivalAt.toISOString(),
        channel: b.channel,
        detail: b.channel === 'aggregator' || b.channel === 'import' ? b.channelDetail : null,
      }));
    return { ...report, timezone: parking.timezone, missing };
  }

  /** The dashboard's tile: this month, today and the last 7 days, by arrival. */
  public async summary(actor: AuthenticatedStaff, now: Date = new Date()): Promise<RevenueSummary> {
    this.require(actor, 'revenue:view');
    const parking = await this.parkings.getPrimary(actor);
    const timeZone = parking.timezone;
    const today = localDate(now, timeZone);
    const monthStart = `${today.slice(0, 7)}-01`;
    const monthEnd = addDays(`${addDays(monthStart, 32).slice(0, 7)}-01`, -1);
    const weekStart = addDays(today, -6);
    const from = weekStart < monthStart ? weekStart : monthStart;
    const bookings = (await this.bookings(actor, { from, to: monthEnd, basis: 'arrival' }, timeZone)) as RevenueBooking[];
    const month = revenueReport(bookings, { from: monthStart, to: monthEnd, basis: 'arrival', timeZone });
    const sumOf = (first: string, last: string) =>
      bookings.reduce((sum, b) => {
        const day = revenueDay(b, 'arrival', timeZone);
        return day >= first && day <= last && b.priceCents !== null ? sum + b.priceCents : sum;
      }, 0);
    return {
      today,
      month: { from: monthStart, to: monthEnd, totalCents: month.totalCents, count: month.count, withoutAmount: month.withoutAmount },
      todayCents: sumOf(today, today),
      weekCents: sumOf(weekStart, today),
    };
  }

  /** The period's bookings as a CSV (with or without an amount), for the accountant. */
  public async csv(actor: AuthenticatedStaff, query: RevenueQuery): Promise<{ filename: string; body: string }> {
    this.require(actor, 'revenue:view');
    const period = this.period(query);
    const parking = await this.parkings.getPrimary(actor);
    const bookings = await this.bookings(actor, period, parking.timezone);
    const body = revenueCsv(
      bookings as (RevenueBooking & { plate: string })[],
      { ...period, timeZone: parking.timezone },
      (channel, detail) => detail ?? CHANNEL_LABELS[channel],
    );
    return { filename: `chiffre-affaires_${period.from}_${period.to}.csv`, body };
  }

  /**
   * The amount of a booking that has none, or a corrected one (any status but cancelled); never a Plazo booking's,
   * which is what the traveller paid.
   */
  public async setPrice(actor: AuthenticatedStaff, id: string, priceCents: number | null): Promise<{ id: string; priceCents: number | null }> {
    this.require(actor, 'reservations:manage');
    const before = await prisma.reservation.findFirst({ where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] } });
    if (!before) throw notFound();
    if (before.channel === 'plazo') throw fieldError('priceCents', 'price_locked');
    if (before.status === 'cancelled') throw new HttpException(httpStatus.BAD_REQUEST, 'This reservation is cancelled', 'reservation_closed');
    const after = await prisma.$transaction(async tx => {
      const updated = await tx.reservation.update({ where: { id }, data: { priceCents } });
      await this.audit.record(
        actor,
        {
          action: 'reservation.updated',
          entityType: 'reservation',
          entityId: id,
          details: { priceCents: { from: before.priceCents, to: priceCents } },
        },
        tx,
      );
      return updated;
    });
    return { id: after.id, priceCents: after.priceCents };
  }
}
