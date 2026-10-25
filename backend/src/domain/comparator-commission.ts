/**
 * What each comparator takes (19/10/2026, « paramétrer le taux de commission de chaque comparateur », choice « les 3 »):
 * a rate and a fixed amount per booking, set per comparator from a local day on, and a booking's own exception. Pure:
 * the services read the rows and the bookings, this works out the commission and what the operator keeps.
 */
import { ReservationChannel } from '@/database';
import { DATE_RE, localDate } from './time';

/** 100 % in basis points. */
export const MAX_RATE_BP = 10000;
/** 1 000 € per booking at most. */
export const MAX_FIXED_CENTS = 100000;

/** The comparators of the client n°1, offered before their first mail arrives. */
export const KNOWN_COMPARATORS = ['Allopark', 'Onepark', 'Parclick', 'ParkMundo', 'ParkVia', 'Park Hit'];

export interface CommissionRate {
  comparatorKey: string;
  label: string;
  rateBp: number;
  fixedCents: number;
  /** Local « YYYY-MM-DD ». */
  effectiveFrom: string;
}

export interface CommissionBooking {
  channel: ReservationChannel;
  channelDetail: string | null;
  priceCents: number | null;
  createdAt: Date;
  commissionOverrideBp: number | null;
  commissionOverrideCents: number | null;
}

export interface Commission {
  /** The comparator's name as on the booking (« Allopark »). */
  comparator: string;
  /** Where the figure comes from: the booking's own exception, the comparator's rate, or nothing set yet. */
  source: 'override' | 'rate' | 'none';
  rateBp: number | null;
  fixedCents: number;
  /** Null without a price. */
  amountCents: number | null;
  netCents: number | null;
  /** The rate's first day, for « Taux du 1 oct. ». */
  effectiveFrom: string | null;
}

/** A comparator's bookings carry its name; the other channels have no comparator. */
export function isComparatorChannel(channel: ReservationChannel): boolean {
  return channel === 'aggregator' || channel === 'import';
}

/** « allopark » for « Allopark », «  Park  Mundo » → « park mundo »; null for no name. */
export function comparatorKey(name: string | null | undefined): string | null {
  const key = (name ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  return key || null;
}

/** The comparator's row in force on a local day: the latest that starts on or before it. */
export function rateOn(rates: CommissionRate[], key: string, day: string): CommissionRate | null {
  let found: CommissionRate | null = null;
  for (const rate of rates) {
    if (rate.comparatorKey !== key || rate.effectiveFrom > day) continue;
    if (!found || rate.effectiveFrom > found.effectiveFrom) found = rate;
  }
  return found;
}

/** The rate's part of a price, rounded to the cent, plus the fixed amount; never more than the price. */
export function commissionAmount(priceCents: number, rateBp: number, fixedCents: number): number {
  return Math.min(priceCents, Math.round((priceCents * rateBp) / MAX_RATE_BP) + fixedCents);
}

/**
 * A booking's commission: its exception if it has one, else its comparator's rate on the day it was made (a rate
 * changed later never moves it). Null for a booking that is not a comparator's.
 */
export function commissionOf(booking: CommissionBooking, rates: CommissionRate[], timeZone: string): Commission | null {
  if (!isComparatorChannel(booking.channel)) return null;
  const key = comparatorKey(booking.channelDetail);
  if (!key) return null;
  const comparator = booking.channelDetail!.replace(/\s+/g, ' ').trim();
  const price = booking.priceCents;
  const net = (amount: number | null) => (price === null || amount === null ? null : price - amount);

  if (booking.commissionOverrideCents !== null) {
    const amount = price === null ? null : Math.min(price, booking.commissionOverrideCents);
    return { comparator, source: 'override', rateBp: null, fixedCents: 0, amountCents: amount, netCents: net(amount), effectiveFrom: null };
  }
  if (booking.commissionOverrideBp !== null) {
    const amount = price === null ? null : commissionAmount(price, booking.commissionOverrideBp, 0);
    return {
      comparator,
      source: 'override',
      rateBp: booking.commissionOverrideBp,
      fixedCents: 0,
      amountCents: amount,
      netCents: net(amount),
      effectiveFrom: null,
    };
  }
  const rate = rateOn(rates, key, localDate(booking.createdAt, timeZone));
  if (!rate)
    return { comparator, source: 'none', rateBp: null, fixedCents: 0, amountCents: price === null ? null : 0, netCents: price, effectiveFrom: null };
  const amount = price === null ? null : commissionAmount(price, rate.rateBp, rate.fixedCents);
  return {
    comparator,
    source: 'rate',
    rateBp: rate.rateBp,
    fixedCents: rate.fixedCents,
    amountCents: amount,
    netCents: net(amount),
    effectiveFrom: rate.effectiveFrom,
  };
}

/** « 17,5 » or 17.5 (a percentage) → 1750 basis points; null when it is not one. */
export function percentToBp(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim().replace(',', '.') : '';
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const bp = Math.round(Number(text) * 100);
  return bp <= MAX_RATE_BP ? bp : null;
}

export type RateInput = { label: string; rateBp: number; fixedCents: number; effectiveFrom: string };

/** A comparator's rate as sent by the pro space: `{ label, rateBp, fixedCents, effectiveFrom }`, errors by field. */
export function validateRate(input: {
  label?: unknown;
  rateBp?: unknown;
  fixedCents?: unknown;
  effectiveFrom?: unknown;
}): { ok: true; value: RateInput } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const label = typeof input.label === 'string' ? input.label.replace(/\s+/g, ' ').trim() : '';
  if (!label) fields.label = 'required';
  else if (label.length > 60) fields.label = 'too_long';
  const rateBp = input.rateBp;
  if (typeof rateBp !== 'number' || !Number.isInteger(rateBp)) fields.rateBp = 'integer';
  else if (rateBp < 0 || rateBp > MAX_RATE_BP) fields.rateBp = 'rate_range';
  const fixedCents = input.fixedCents === undefined || input.fixedCents === null ? 0 : input.fixedCents;
  if (typeof fixedCents !== 'number' || !Number.isInteger(fixedCents)) fields.fixedCents = 'integer';
  else if (fixedCents < 0 || fixedCents > MAX_FIXED_CENTS) fields.fixedCents = 'fixed_range';
  const effectiveFrom = typeof input.effectiveFrom === 'string' ? input.effectiveFrom : '';
  if (!DATE_RE.test(effectiveFrom) || Number.isNaN(Date.parse(`${effectiveFrom}T00:00:00Z`))) fields.effectiveFrom = 'invalid_date';
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { label, rateBp: rateBp as number, fixedCents: fixedCents as number, effectiveFrom } };
}
