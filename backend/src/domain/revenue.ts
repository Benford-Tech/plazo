/**
 * CA-B + CA-A (09/10/2026, « additionner le CA des réservations »): the revenue of a period. Pure: the service reads
 * the bookings, this adds them up. A booking counts on its local arrival day (or the day it was booked) with the
 * amount it carries (`priceCents`: paid on Plazo, read from a comparator's email, typed by the staff); one without
 * an amount is counted apart, never as zero.
 */
import { PaymentMethod, ReservationChannel } from '@/database';
import { isDirectBooking } from './direct-booking';
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

/**
 * 12/11/2026 (« Payé au parking »): a service the team added to a booking, paid at the parking (or « Au retour »): no
 * commission. It counts on its booking's arrival day, or on the day it was added when counting by booking day.
 */
export interface RevenueExtra {
  arrivalAt: Date;
  createdAt: Date;
  priceCents: number;
  /** Null: « À payer au retour », not paid yet. */
  paymentMethod: PaymentMethod | null;
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
  /**
   * 02/11/2026: the bookings made with the parking itself (phone, counter, its own website: `isDirectBooking`), with
   * no commission; `totalCents` out of the report's `totalCents`.
   */
  direct: { count: number; totalCents: number };
  /** 29/10/2026 (« Payé par »): the amounts by payment method, the largest first; `method` null: not said. */
  byPaymentMethod: { method: PaidBy | null; count: number; totalCents: number }[];
  byDay: { date: string; count: number; totalCents: number; netCents: number }[];
  /**
   * 12/11/2026: the services added by the team and paid at the parking, inside `totalCents`, `netCents`, `byDay` and
   * `byPaymentMethod` (never in `count`, the averages or `byChannel`, which are the bookings'); `toCollect`: « Au retour ».
   */
  parkingExtras: { count: number; totalCents: number; toCollectCount: number; toCollectCents: number };
  /** 12/11/2026 (B): the supplements the team applied (late arrival, night, breakdown…), in `totalCents` too. */
  surcharges: { count: number; totalCents: number };
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
  parkingExtras: readonly RevenueExtra[] = [],
  surchargeItems: readonly RevenueExtra[] = [],
): RevenueReport {
  const { from, to, basis, timeZone } = period;
  const inPeriod = bookings.filter(b => {
    const day = revenueDay(b, basis, timeZone);
    return day >= from && day <= to;
  });
  const extras = parkingExtras.filter(e => {
    const day = revenueDay(e, basis, timeZone);
    return day >= from && day <= to;
  });
  const surcharges = surchargeItems.filter(e => {
    const day = revenueDay(e, basis, timeZone);
    return day >= from && day <= to;
  });
  const surchargesCents = surcharges.reduce((sum, e) => sum + e.priceCents, 0);
  const extrasCents = extras.reduce((sum, e) => sum + e.priceCents, 0);
  const toCollect = extras.filter(e => e.paymentMethod === null);
  const priced = inPeriod.filter((b): b is RevenueBooking & { priceCents: number } => b.priceCents !== null);
  const bookingsCents = priced.reduce((sum, b) => sum + b.priceCents, 0);
  const totalCents = bookingsCents + extrasCents + surchargesCents;
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
  for (const e of [...extras, ...surcharges]) {
    const line = methods.get(e.paymentMethod) ?? { method: e.paymentMethod, count: 0, totalCents: 0 };
    line.count += 1;
    line.totalCents += e.priceCents;
    methods.set(e.paymentMethod, line);
  }

  const perDay = new Map(daysOf(from, to).map(date => [date, { date, count: 0, totalCents: 0, netCents: 0 }]));
  for (const b of priced) {
    const line = perDay.get(revenueDay(b, basis, timeZone))!;
    line.count += 1;
    line.totalCents += b.priceCents;
    line.netCents += b.priceCents - fee(b);
  }
  for (const e of [...extras, ...surcharges]) {
    const line = perDay.get(revenueDay(e, basis, timeZone))!;
    line.totalCents += e.priceCents;
    line.netCents += e.priceCents;
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
    averageCents: priced.length ? Math.round(bookingsCents / priced.length) : null,
    averageDays: priced.length ? Math.round((days / priced.length) * 10) / 10 : null,
    withoutAmount: inPeriod.length - priced.length,
    byChannel: [...channels.values()].sort((a, b) => b.totalCents - a.totalCents || b.count - a.count),
    direct: priced
      .filter(b => isDirectBooking(b.channel))
      .reduce((sum, b) => ({ count: sum.count + 1, totalCents: sum.totalCents + b.priceCents }), { count: 0, totalCents: 0 }),
    // Not said comes last, whatever its amount.
    byPaymentMethod: [...methods.values()].sort(
      (a, b) => Number(a.method === null) - Number(b.method === null) || b.totalCents - a.totalCents || b.count - a.count,
    ),
    byDay: [...perDay.values()],
    parkingExtras: {
      count: extras.length,
      totalCents: extrasCents,
      toCollectCount: toCollect.length,
      toCollectCents: toCollect.reduce((sum, e) => sum + e.priceCents, 0),
    },
    surcharges: { count: surcharges.length, totalCents: surchargesCents },
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
  parkingExtras: readonly RevenueExtra[] = [],
): RevenueMonth[] {
  return months.map(m => {
    const r = revenueReport(bookings, { from: m.from, to: m.to, basis, timeZone }, parkingExtras);
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

/**
 * « Quelles plateformes vous rapportent » (12/11/2026, statistics B, maquettes https://claude.ai/artifact/6kXrPDgyh5r71S8KwcRAHi):
 * over the months shown, each channel's bookings with an amount, revenue, commission, net, net per booking and its net
 * month by month (the oldest first), the largest net first. Bookings only: the services and supplements paid at the
 * parking belong to no channel.
 */
export interface ChannelProfit {
  channel: ReservationChannel;
  /** A comparator's name (« Allopark »), null for the other channels. */
  detail: string | null;
  count: number;
  totalCents: number;
  commissionCents: number;
  netCents: number;
  netPerBookingCents: number | null;
  /** One net per month of `months`. */
  monthlyNetCents: number[];
}

export function channelProfits(
  bookings: RevenueBooking[],
  months: { month: string; from: string; to: string }[],
  basis: RevenueBasis,
  timeZone: string,
): ChannelProfit[] {
  const lines = new Map<string, ChannelProfit>();
  const first = months[0]?.from ?? '';
  const last = months[months.length - 1]?.to ?? '';
  for (const b of bookings) {
    if (b.priceCents === null) continue;
    const day = revenueDay(b, basis, timeZone);
    if (day < first || day > last) continue;
    const index = months.findIndex(m => day >= m.from && day <= m.to);
    if (index < 0) continue;
    const group = channelGroup(b);
    const line =
      lines.get(group.key) ??
      ({
        channel: group.channel,
        detail: group.detail,
        count: 0,
        totalCents: 0,
        commissionCents: 0,
        netCents: 0,
        netPerBookingCents: null,
        monthlyNetCents: months.map(() => 0),
      } as ChannelProfit);
    const fee = b.commissionCents ?? 0;
    line.count += 1;
    line.totalCents += b.priceCents;
    line.commissionCents += fee;
    line.netCents += b.priceCents - fee;
    line.monthlyNetCents[index] += b.priceCents - fee;
    lines.set(group.key, line);
  }
  return [...lines.values()]
    .map(line => ({ ...line, netPerBookingCents: line.count ? Math.round(line.netCents / line.count) : null }))
    .sort((a, b) => b.netCents - a.netCents || b.count - a.count);
}
