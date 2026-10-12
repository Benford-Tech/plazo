/**
 * Night fees (12/10/2026, « ajoute des frais de nuit pour les arrivées et départs en heure définie par le parking »,
 * direction B « Dans le détail du prix seulement »). One window per parking, the same every day, for drop-offs and
 * returns alike (e.g. 22:00 → 06:00): the start counts as night, the end does not, and it may cross midnight. A
 * drop-off booked in the window pays the « Dépôt de nuit » fee, a return booked in it the « Retour de nuit » fee; both
 * add up when both ends are at night. Computed on the hours booked (the parking's local wall clock) for Plazo bookings
 * only, frozen on the reservation, included in the total, and on top of the extra billable day a late arrival adds.
 * Pure functions.
 */

import { localDateTime } from './time';

/** "HH:mm", 00:00 to 23:59. */
export const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Highest fee a parking may set, in cents (1 000 €). */
export const MAX_NIGHT_FEE_CENTS = 100000;

/** A parking's night settings, as stored (and served to the pro space). */
export interface NightSettings {
  enabled: boolean;
  start: string | null;
  end: string | null;
  arrivalFeeCents: number | null;
  returnFeeCents: number | null;
}

/** The rule shown to travellers: null when it charges nothing. A side without a fee is null. */
export interface NightRule {
  start: string;
  end: string;
  arrivalFeeCents: number | null;
  returnFeeCents: number | null;
}

/** The fees of one stay, in cents (0 for an end that pays nothing); null when the stay pays none. */
export interface NightFee {
  arrivalCents: number;
  returnCents: number;
  totalCents: number;
}

/** The night columns of a parking. */
export interface ParkingNightColumns {
  nightFeeEnabled: boolean;
  nightStart: string | null;
  nightEnd: string | null;
  nightArrivalFeeCents: number | null;
  nightReturnFeeCents: number | null;
}

export function nightSettingsOf(parking: ParkingNightColumns): NightSettings {
  return {
    enabled: parking.nightFeeEnabled,
    start: parking.nightStart,
    end: parking.nightEnd,
    arrivalFeeCents: parking.nightArrivalFeeCents,
    returnFeeCents: parking.nightReturnFeeCents,
  };
}

/** True when the local time `hhmm` falls in [start, end), the window wrapping past midnight when start > end. */
export function inNightWindow(hhmm: string, start: string, end: string): boolean {
  if (!HHMM_RE.test(hhmm) || !HHMM_RE.test(start) || !HHMM_RE.test(end) || start === end) return false;
  return start < end ? hhmm >= start && hhmm < end : hhmm >= start || hhmm < end;
}

const positive = (cents: number | null | undefined): number => (typeof cents === 'number' && Number.isInteger(cents) && cents > 0 ? cents : 0);

/** The rule a parking applies, or null when switched off, incomplete or free on both sides. */
export function nightRule(settings: NightSettings | null | undefined): NightRule | null {
  if (!settings?.enabled || !settings.start || !settings.end) return null;
  if (!HHMM_RE.test(settings.start) || !HHMM_RE.test(settings.end) || settings.start === settings.end) return null;
  const arrival = positive(settings.arrivalFeeCents);
  const ret = positive(settings.returnFeeCents);
  if (!arrival && !ret) return null;
  return { start: settings.start, end: settings.end, arrivalFeeCents: arrival || null, returnFeeCents: ret || null };
}

/**
 * The fees of a stay from its local drop-off and return times ("HH:mm", or the API's "YYYY-MM-DDTHH:mm"): null when
 * the parking charges none or neither end falls in the window.
 */
export function nightFees(settings: NightSettings | null | undefined, arrivalHHmm: string, returnHHmm: string): NightFee | null {
  const rule = nightRule(settings);
  if (!rule) return null;
  const time = (value: string) => (value.length > 5 ? value.slice(11, 16) : value);
  const arrivalCents = inNightWindow(time(arrivalHHmm), rule.start, rule.end) ? (rule.arrivalFeeCents ?? 0) : 0;
  const returnCents = inNightWindow(time(returnHHmm), rule.start, rule.end) ? (rule.returnFeeCents ?? 0) : 0;
  const totalCents = arrivalCents + returnCents;
  return totalCents > 0 ? { arrivalCents, returnCents, totalCents } : null;
}

/** The fees of a stay given as instants, tested on the wall clock of the parking's time zone (DST-safe). */
export function nightFeesForStay(settings: NightSettings | null | undefined, arrivalAt: Date, returnAt: Date, timeZone: string): NightFee | null {
  if (!nightRule(settings)) return null;
  return nightFees(settings, localDateTime(arrivalAt, timeZone), localDateTime(returnAt, timeZone));
}

/** What a reservation stores of a stay's fees (frozen at booking): null for an end that pays nothing. */
export function nightSnapshot(fee: NightFee | null): { nightArrivalFeeCents: number | null; nightReturnFeeCents: number | null } {
  return { nightArrivalFeeCents: fee?.arrivalCents || null, nightReturnFeeCents: fee?.returnCents || null };
}

/** The fees a reservation was charged, read back from its snapshot (never recomputed); null when none. */
export function nightFeeOf(reservation: { nightArrivalFeeCents: number | null; nightReturnFeeCents: number | null }): NightFee | null {
  const arrivalCents = positive(reservation.nightArrivalFeeCents);
  const returnCents = positive(reservation.nightReturnFeeCents);
  const totalCents = arrivalCents + returnCents;
  return totalCents > 0 ? { arrivalCents, returnCents, totalCents } : null;
}

/** Field errors of the pro space's night settings (PUT /internal/pricing), keyed "night.start"… */
export type NightFieldErrors = Record<string, string>;

/**
 * Checks the night settings sent by the pro space. Formats are always checked (they are stored even while switched
 * off, so that switching back on restores them); switched on, the window needs a start and an end that differ
 * (`same_time`) and at least one fee above 0 (`fee_required`).
 */
export function validateNightSettings(input: unknown): { settings: NightSettings | null; errors: NightFieldErrors } {
  const errors: NightFieldErrors = {};
  if (input === null || typeof input !== 'object' || Array.isArray(input)) return { settings: null, errors: { night: 'invalid' } };
  const raw = input as Record<string, unknown>;

  if (typeof raw.enabled !== 'boolean') errors['night.enabled'] = raw.enabled === undefined || raw.enabled === null ? 'required' : 'invalid';
  const enabled = raw.enabled === true;

  const time = (key: 'start' | 'end'): string | null => {
    const value = raw[key];
    if (value === undefined || value === null || value === '') {
      if (enabled) errors[`night.${key}`] = 'required';
      return null;
    }
    if (typeof value !== 'string' || !HHMM_RE.test(value)) {
      errors[`night.${key}`] = 'invalid_time';
      return null;
    }
    return value;
  };
  const start = time('start');
  const end = time('end');

  const fee = (key: 'arrivalFeeCents' | 'returnFeeCents'): number | null => {
    const value = raw[key];
    if (value === undefined || value === null) return null;
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors[`night.${key}`] = 'integer';
      return null;
    }
    if (value < 0) errors[`night.${key}`] = 'min_0';
    else if (value > MAX_NIGHT_FEE_CENTS) errors[`night.${key}`] = 'too_large';
    return value;
  };
  const arrivalFeeCents = fee('arrivalFeeCents');
  const returnFeeCents = fee('returnFeeCents');

  if (enabled) {
    if (start && end && start === end) errors['night.end'] = 'same_time';
    const feeErrors = errors['night.arrivalFeeCents'] || errors['night.returnFeeCents'];
    if (!feeErrors && !((arrivalFeeCents ?? 0) > 0) && !((returnFeeCents ?? 0) > 0)) {
      errors['night.arrivalFeeCents'] = 'fee_required';
      errors['night.returnFeeCents'] = 'fee_required';
    }
  }
  if (Object.keys(errors).length) return { settings: null, errors };
  return { settings: { enabled, start, end, arrivalFeeCents, returnFeeCents }, errors };
}

/** The columns written for validated settings. */
export function nightColumns(settings: NightSettings): ParkingNightColumns {
  return {
    nightFeeEnabled: settings.enabled,
    nightStart: settings.start,
    nightEnd: settings.end,
    nightArrivalFeeCents: settings.arrivalFeeCents,
    nightReturnFeeCents: settings.returnFeeCents,
  };
}
