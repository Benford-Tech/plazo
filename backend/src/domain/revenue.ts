/**
 * CA-B + CA-A (09/10/2026, « additionner le CA des réservations »): the revenue of a period. Pure: the service reads
 * the bookings, this adds them up. A booking counts on its local arrival day (or the day it was booked) with the
 * amount it carries (`priceCents`: paid on Plazo, read from a comparator's email, typed by the staff); one without
 * an amount is counted apart, never as zero.
 */
import { ReservationChannel } from '@/database';
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
}

/** One line of « Par canal »: a channel, and for comparators their name (« Allopark », « Onepark »…). */
export interface RevenueChannel {
  channel: ReservationChannel;
  detail: string | null;
  count: number;
  totalCents: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  basis: RevenueBasis;
  totalCents: number;
  /** Bookings with an amount. */
  count: number;
  averageCents: number | null;
  /** Average billable days of the bookings counted. */
  averageDays: number | null;
  /** Bookings of the period without an amount: not counted. */
  withoutAmount: number;
  byChannel: RevenueChannel[];
  byDay: { date: string; count: number; totalCents: number }[];
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

  const channels = new Map<string, RevenueChannel>();
  for (const b of priced) {
    const group = channelGroup(b);
    const line = channels.get(group.key) ?? { channel: group.channel, detail: group.detail, count: 0, totalCents: 0 };
    line.count += 1;
    line.totalCents += b.priceCents;
    channels.set(group.key, line);
  }

  const perDay = new Map(daysOf(from, to).map(date => [date, { date, count: 0, totalCents: 0 }]));
  for (const b of priced) {
    const line = perDay.get(revenueDay(b, basis, timeZone))!;
    line.count += 1;
    line.totalCents += b.priceCents;
  }

  const days = priced.reduce((sum, b) => sum + billableDays(b.arrivalAt, b.returnAt, timeZone), 0);
  return {
    from,
    to,
    basis,
    totalCents,
    count: priced.length,
    averageCents: priced.length ? Math.round(totalCents / priced.length) : null,
    averageDays: priced.length ? Math.round((days / priced.length) * 10) / 10 : null,
    withoutAmount: inPeriod.length - priced.length,
    byChannel: [...channels.values()].sort((a, b) => b.totalCents - a.totalCents || b.count - a.count),
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
  const header = ['Référence', 'Réservée le', 'Arrivée', 'Retour', 'Canal', 'Client', 'Plaque', 'Montant (€)'];
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
    ]
      .map(csvCell)
      .join(';'),
  );
  return `﻿${[header.join(';'), ...lines].join('\r\n')}\r\n`;
}
