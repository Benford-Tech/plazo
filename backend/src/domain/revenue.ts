/**
 * CA-B + CA-A (09/10/2026, « additionner le CA des réservations »): the revenue of a period. Pure: the service reads
 * the bookings, this adds them up. A booking counts on its local arrival day (or the day it was booked) with the
 * amount it carries (`priceCents`: paid on Plazo, read from a comparator's email, typed by the staff); one without
 * an amount is counted apart, never as zero.
 */
import { PaymentMethod, ReservationChannel } from '@/database';
import { PAID_BY_LABELS, PaidBy, paidBy } from './payment-method';
import { billableDays } from './pricing';
import { addDays, localDate } from './time';

export type RevenueBasis = 'arrival' | 'booked';
export const REVENUE_BASES: RevenueBasis[] = ['arrival', 'booked'];

/** Longest period one report covers: a year and a day. */
export const MAX_REVENUE_DAYS = 366;

export interface RevenueBooking {
  id: string;
  reference: string;
  customerName: string;
  arrivalAt: Date;
  returnAt: Date;
  createdAt: Date;
  channel: ReservationChannel;
  channelDetail: string | null;
  priceCents: number | null;
  /** 29/10/2026 (« Payé par »): how it was paid; absent or null: not said. */
  paymentMethod?: PaymentMethod | null;
  /** What the comparator takes (19/10/2026), 0 when none: the service works it out (`commissionOf`). */
  commissionCents?: number | null;
}

/** One line of « Par canal »: a channel, and for comparators their name (« Allopark », « Onepark »…). */
export interface RevenueChannel {
  channel: ReservationChannel;
  detail: string | null;
  count: number;
  totalCents: number;
  /** What the comparator took from these bookings, and what the operator keeps. */
  commissionCents: number;
  netCents: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  basis: RevenueBasis;
  totalCents: number;
  /** What the comparators took from the bookings counted (19/10/2026), and what the operator keeps. */
  commissionCents: number;
  netCents: number;
  /** Bookings with an amount. */
  count: number;
  averageCents: number | null;
  /** Average billable days of the bookings counted. */
  averageDays: number | null;
  /** Bookings of the period without an amount: not counted. */
  withoutAmount: number;
  byChannel: RevenueChannel[];
  /** 29/10/2026 (« Payé par »): the amounts by payment method, the largest first; `method` null: not said. */
  byPaymentMethod: { method: PaidBy | null; count: number; totalCents: number }[];
  byDay: { date: string; count: number; totalCents: number; netCents: number }[];
}

/** Every local date from `from` to `to`, both included. */
export function daysOf(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return days;
}

/** The local day a booking counts on. */
export function revenueDay(booking: Pick<RevenueBooking, 'arrivalAt' | 'createdAt'>, basis: RevenueBasis, timeZone: string): string {
  return localDate(basis === 'arrival' ? booking.arrivalAt : booking.createdAt, timeZone);
}

/** A comparator's bookings are grouped by its name (any case and spacing), the other channels by channel. */
function channelGroup(booking: Pick<RevenueBooking, 'channel' | 'channelDetail'>): {
  key: string;
  channel: ReservationChannel;
  detail: string | null;
} {
  const named = booking.channel === 'aggregator' || booking.channel === 'import';
  const detail = named ? booking.channelDetail?.replace(/\s+/g, ' ').trim() || null : null;
  return { key: `${booking.channel}:${detail?.toLowerCase() ?? ''}`, channel: booking.channel, detail };
}

export function revenueReport(
  bookings: RevenueBooking[],
  period: { from: string; to: string; basis: RevenueBasis; timeZone: string },
): RevenueReport {
  const { from, to, basis, timeZone } = period;
  const inPeriod = bookings.filter(b => {
    const day = revenueDay(b, basis, timeZone);
    return day >= from && day <= to;
  });
  const priced = inPeriod.filter((b): b is RevenueBooking & { priceCents: number } => b.priceCents !== null);
  const totalCents = priced.reduce((sum, b) => sum + b.priceCents, 0);
  const fee = (b: RevenueBooking) => b.commissionCents ?? 0;
  const commissionCents = priced.reduce((sum, b) => sum + fee(b), 0);

  const channels = new Map<string, RevenueChannel>();
  for (const b of priced) {
    const group = channelGroup(b);
    const line = channels.get(group.key) ?? {
      channel: group.channel,
      detail: group.detail,
      count: 0,
      totalCents: 0,
      commissionCents: 0,
      netCents: 0,
    };
    line.count += 1;
    line.totalCents += b.priceCents;
    line.commissionCents += fee(b);
    line.netCents += b.priceCents - fee(b);
    channels.set(group.key, line);
  }

  const methods = new Map<PaidBy | null, { method: PaidBy | null; count: number; totalCents: number }>();
  for (const b of priced) {
    const method = paidBy({ channel: b.channel, paymentMethod: b.paymentMethod ?? null });
    const line = methods.get(method) ?? { method, count: 0, totalCents: 0 };
    line.count += 1;
    line.totalCents += b.priceCents;
    methods.set(method, line);
  }

  const perDay = new Map(daysOf(from, to).map(date => [date, { date, count: 0, totalCents: 0, netCents: 0 }]));
  for (const b of priced) {
    const line = perDay.get(revenueDay(b, basis, timeZone))!;
    line.count += 1;
    line.totalCents += b.priceCents;
    line.netCents += b.priceCents - fee(b);
  }

  const days = priced.reduce((sum, b) => sum + billableDays(b.arrivalAt, b.returnAt, timeZone), 0);
  return {
    from,
    to,
    basis,
    totalCents,
    commissionCents,
    netCents: totalCents - commissionCents,
    count: priced.length,
    averageCents: priced.length ? Math.round(totalCents / priced.length) : null,
    averageDays: priced.length ? Math.round((days / priced.length) * 10) / 10 : null,
    withoutAmount: inPeriod.length - priced.length,
    byChannel: [...channels.values()].sort((a, b) => b.totalCents - a.totalCents || b.count - a.count),
    // Not said comes last, whatever its amount.
    byPaymentMethod: [...methods.values()].sort(
      (a, b) => Number(a.method === null) - Number(b.method === null) || b.totalCents - a.totalCents || b.count - a.count,
    ),
    byDay: [...perDay.values()],
  };
}

/** « 1 234,50 » for the CSV (French spreadsheets read the comma as the decimal separator). */
function csvAmount(cents: number | null): string {
  return cents === null ? '' : (cents / 100).toFixed(2).replace('.', ',');
}

function csvCell(value: string): string {
  return /[";\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function paidByLabel(b: RevenueBooking): string {
  const method = paidBy({ channel: b.channel, paymentMethod: b.paymentMethod ?? null });
  return method ? PAID_BY_LABELS[method] : '';
}

/** The bookings of a report as a CSV a spreadsheet opens as is: « ; » separated, UTF-8 with its BOM. */
export function revenueCsv(
  bookings: (RevenueBooking & { plate: string })[],
  period: { from: string; to: string; basis: RevenueBasis; timeZone: string },
  channelLabel: (channel: ReservationChannel, detail: string | null) => string,
): string {
  const { from, to, basis, timeZone } = period;
  const local = (d: Date) => localDate(d, timeZone);
  const rows = bookings
    .filter(b => {
      const day = revenueDay(b, basis, timeZone);
      return day >= from && day <= to;
    })
    .sort((a, b) => revenueDay(a, basis, timeZone).localeCompare(revenueDay(b, basis, timeZone)) || a.reference.localeCompare(b.reference));
  const header = [
    'Référence',
    'Réservée le',
    'Arrivée',
    'Retour',
    'Canal',
    'Client',
    'Plaque',
    'Montant (€)',
    'Payé par',
    'Commission (€)',
    'Net (€)',
  ];
  const lines = rows.map(b =>
    [
      b.reference,
      local(b.createdAt),
      local(b.arrivalAt),
      local(b.returnAt),
      channelLabel(b.channel, channelGroup(b).detail),
      b.customerName,
      b.plate,
      csvAmount(b.priceCents),
      paidByLabel(b),
      csvAmount(b.priceCents === null ? null : (b.commissionCents ?? 0)),
      csvAmount(b.priceCents === null ? null : b.priceCents - (b.commissionCents ?? 0)),
    ]
      .map(csvCell)
      .join(';'),
  );
  return `﻿${[header.join(';'), ...lines].join('\r\n')}\r\n`;
}

/** One month of « Mois par mois » (01/11/2026, choice B): its figures, like a report's total. */
export interface RevenueMonth {
  /** « YYYY-MM ». */
  month: string;
  from: string;
  to: string;
  totalCents: number;
  commissionCents: number;
  netCents: number;
  count: number;
  withoutAmount: number;
}

/** The last local day of the month that holds `day`. */
export function lastDayOfMonth(day: string): string {
  return addDays(`${addDays(`${day.slice(0, 7)}-01`, 32).slice(0, 7)}-01`, -1);
}

/** The `count` months ending with `lastMonth` (« YYYY-MM »), the oldest first. */
export function monthsEndingWith(lastMonth: string, count: number): { month: string; from: string; to: string }[] {
  const months: { month: string; from: string; to: string }[] = [];
  let first = `${lastMonth}-01`;
  for (let i = 0; i < count; i++) {
    months.unshift({ month: first.slice(0, 7), from: first, to: lastDayOfMonth(first) });
    first = `${addDays(first, -1).slice(0, 7)}-01`;
  }
  return months;
}

/** « Mois par mois »: each month's report figures, counted as `revenueReport` counts them. */
export function revenueByMonth(
  bookings: RevenueBooking[],
  months: { month: string; from: string; to: string }[],
  basis: RevenueBasis,
  timeZone: string,
): RevenueMonth[] {
  return months.map(m => {
    const r = revenueReport(bookings, { from: m.from, to: m.to, basis, timeZone });
    return {
      month: m.month,
      from: m.from,
      to: m.to,
      totalCents: r.totalCents,
      commissionCents: r.commissionCents,
      netCents: r.netCents,
      count: r.count,
      withoutAmount: r.withoutAmount,
    };
  });
}
