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
/** 23/11/2026: VAT the comparator adds to its commission, 50 % at most (in basis points). */
export const MAX_VAT_BP = 5000;

/** The VAT on a commission excluding tax, rounded to the cent. */
export const vatOn = (amountCents: number, vatBp: number): number => Math.round((amountCents * vatBp) / MAX_RATE_BP);

/** The comparators of the client n°1, offered before their first mail arrives. */
export const KNOWN_COMPARATORS = ['Allopark', 'Onepark', 'Parclick', 'ParkMundo', 'ParkVia', 'Park Hit'];

export interface CommissionRate {
  comparatorKey: string;
  label: string;
  rateBp: number;
  fixedCents: number;
  /** 23/11/2026 (« pour certain contract il y'a une TVA », choix A): VAT added to the commission, 0 = none. */
  vatBp?: number;
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
  /** What the comparator takes, VAT included (the net is the price minus this); null without a price. */
  amountCents: number | null;
  /** 23/11/2026: the VAT inside `amountCents` (recoverable for a parking liable to VAT), 0 when none. */
  vatCents: number | null;
  vatBp: number;
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
  const rate = rateOn(rates, key, localDate(booking.createdAt, timeZone));
  // The VAT is the comparator's (its row on the booking's day), also over a booking's own exception: the exception
  // changes the commission, not the comparator's invoice.
  const vatBp = rate?.vatBp ?? 0;
  const done = (
    source: Commission['source'],
    excl: number | null,
    extra: Pick<Commission, 'rateBp' | 'fixedCents' | 'effectiveFrom'>,
  ): Commission => {
    const vat = excl === null || price === null ? null : Math.min(vatOn(excl, vatBp), price - excl);
    const amount = excl === null || vat === null ? null : excl + vat;
    return {
      comparator,
      source,
      ...extra,
      amountCents: amount,
      vatCents: vat,
      vatBp,
      netCents: price === null || amount === null ? null : price - amount,
    };
  };

  if (booking.commissionOverrideCents !== null)
    return done('override', price === null ? null : Math.min(price, booking.commissionOverrideCents), {
      rateBp: null,
      fixedCents: 0,
      effectiveFrom: null,
    });
  if (booking.commissionOverrideBp !== null)
    return done('override', price === null ? null : commissionAmount(price, booking.commissionOverrideBp, 0), {
      rateBp: booking.commissionOverrideBp,
      fixedCents: 0,
      effectiveFrom: null,
    });
  if (!rate)
    return {
      comparator,
      source: 'none',
      rateBp: null,
      fixedCents: 0,
      amountCents: price === null ? null : 0,
      vatCents: price === null ? null : 0,
      vatBp: 0,
      netCents: price,
      effectiveFrom: null,
    };
  return done('rate', price === null ? null : commissionAmount(price, rate.rateBp, rate.fixedCents), {
    rateBp: rate.rateBp,
    fixedCents: rate.fixedCents,
    effectiveFrom: rate.effectiveFrom,
  });
}

/** « 17,5 » or 17.5 (a percentage) → 1750 basis points; null when it is not one. */
export function percentToBp(value: unknown): number | null {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim().replace(',', '.') : '';
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const bp = Math.round(Number(text) * 100);
  return bp <= MAX_RATE_BP ? bp : null;
}

/** `vatBp` null: not sent (the revenue page's rate field), the VAT in force that day stays. */
export type RateInput = { label: string; rateBp: number; fixedCents: number; vatBp: number | null; effectiveFrom: string };

/** A comparator's rate as sent by the pro space: `{ label, rateBp, fixedCents, effectiveFrom }`, errors by field. */
export function validateRate(input: {
  label?: unknown;
  rateBp?: unknown;
  fixedCents?: unknown;
  vatBp?: unknown;
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
  const vatBp = input.vatBp === undefined ? null : input.vatBp === null ? 0 : input.vatBp;
  if (vatBp !== null) {
    if (typeof vatBp !== 'number' || !Number.isInteger(vatBp)) fields.vatBp = 'integer';
    else if (vatBp < 0 || vatBp > MAX_VAT_BP) fields.vatBp = 'vat_range';
  }
  const effectiveFrom = typeof input.effectiveFrom === 'string' ? input.effectiveFrom : '';
  if (!DATE_RE.test(effectiveFrom) || Number.isNaN(Date.parse(`${effectiveFrom}T00:00:00Z`))) fields.effectiveFrom = 'invalid_date';
  if (Object.keys(fields).length) return { ok: false, fields };
  return { ok: true, value: { label, rateBp: rateBp as number, fixedCents: fixedCents as number, vatBp: vatBp as number | null, effectiveFrom } };
}
