import type { NightFee, NightRule, NightSettings, PricingTier } from "./types";

// Mirrors backend/src/domain/pricing.ts: packages "up to N days", then a price per extra day.
export function quoteCents(tiers: PricingTier[], extraDayPriceCents: number | null, days: number): number | null {
  if (days < 1) return null;
  const covering = tiers.filter(t => t.days >= days);
  if (covering.length) return Math.min(...covering.map(t => t.priceCents));
  if (!tiers.length || extraDayPriceCents === null) return null;
  const longest = tiers.reduce((a, b) => (b.days > a.days ? b : a));
  return longest.priceCents + (days - longest.days) * extraDayPriceCents;
}

/** Which rule priced a stay, for the simulation column. */
export function quoteReason(tiers: PricingTier[], extraDayPriceCents: number | null, days: number): { kind: "tier"; days: number } | { kind: "extra"; base: number; extra: number } | null {
  const covering = tiers.filter(t => t.days >= days);
  if (covering.length) {
    const best = covering.reduce((a, b) => (b.priceCents < a.priceCents || (b.priceCents === a.priceCents && b.days < a.days) ? b : a));
    return { kind: "tier", days: best.days };
  }
  if (!tiers.length || extraDayPriceCents === null) return null;
  const longest = tiers.reduce((a, b) => (b.days > a.days ? b : a));
  return { kind: "extra", base: longest.days, extra: days - longest.days };
}

// ---- Night fees (12/10/2026), mirrors backend/src/domain/night-fees.ts --------------------------------------------

/** "HH:mm", 00:00 to 23:59. */
export const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
/** Highest fee a parking may set, in cents (1 000 €). */
export const MAX_NIGHT_FEE_CENTS = 100000;

/** The times offered for the window: every half hour, 00:00 to 23:30. */
export const NIGHT_TIMES: string[] = Array.from({ length: 48 }, (_, i) => fromMinutes(i * 30));

function toMinutes(hhmm: string): number {
  return Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
}

function fromMinutes(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** `hhmm` moved by `minutes`, around the clock ("23:30" + 60 -> "00:30"). */
export const addMinutes = (hhmm: string, minutes: number): string => fromMinutes(toMinutes(hhmm) + minutes);

/** True when the local time `hhmm` falls in [start, end), the window wrapping past midnight when start > end. */
export function inNightWindow(hhmm: string, start: string, end: string): boolean {
  if (!HHMM_RE.test(hhmm) || !HHMM_RE.test(start) || !HHMM_RE.test(end) || start === end) return false;
  return start < end ? hhmm >= start && hhmm < end : hhmm >= start || hhmm < end;
}

const positive = (cents: number | null | undefined): number => (typeof cents === "number" && Number.isInteger(cents) && cents > 0 ? cents : 0);

/** The rule a parking applies, or null when switched off, incomplete or free on both sides. */
export function nightRule(settings: NightSettings | null | undefined): NightRule | null {
  if (!settings?.enabled || !settings.start || !settings.end) return null;
  if (!HHMM_RE.test(settings.start) || !HHMM_RE.test(settings.end) || settings.start === settings.end) return null;
  const arrival = positive(settings.arrivalFeeCents);
  const ret = positive(settings.returnFeeCents);
  if (!arrival && !ret) return null;
  return { start: settings.start, end: settings.end, arrivalFeeCents: arrival || null, returnFeeCents: ret || null };
}

/** The fees of a stay from its local drop-off and return times ("HH:mm"); null when it pays none. */
export function nightFees(rule: NightRule | null, arrivalHHmm: string | null, returnHHmm: string | null): NightFee | null {
  if (!rule) return null;
  const arrivalCents = arrivalHHmm && inNightWindow(arrivalHHmm, rule.start, rule.end) ? (rule.arrivalFeeCents ?? 0) : 0;
  const returnCents = returnHHmm && inNightWindow(returnHHmm, rule.start, rule.end) ? (rule.returnFeeCents ?? 0) : 0;
  const totalCents = arrivalCents + returnCents;
  return totalCents > 0 ? { arrivalCents, returnCents, totalCents } : null;
}

/** The fees a reservation was charged, read from its snapshot (never recomputed); null when none. */
export function nightFeeOf(reservation: { nightArrivalFeeCents?: number | null; nightReturnFeeCents?: number | null }): NightFee | null {
  const arrivalCents = positive(reservation.nightArrivalFeeCents);
  const returnCents = positive(reservation.nightReturnFeeCents);
  const totalCents = arrivalCents + returnCents;
  return totalCents > 0 ? { arrivalCents, returnCents, totalCents } : null;
}

/** A simulated night stay of « Ce que paie le voyageur »: billable days and the local times that fall at night. */
export interface NightExample {
  key: "arrival" | "return" | "both";
  days: number;
  arrival: string | null;
  return: string | null;
}

/**
 * Three stays priced with the rule, derived from its window: 3 days with a drop-off 1 h 30 after the start, 7 days
 * with a return 30 min before the end, 7 days with both (drop-off 30 min after the start). The times stay inside a
 * short window; a stay whose side pays nothing is left out.
 */
export function nightExamples(rule: NightRule | null): NightExample[] {
  if (!rule) return [];
  const length = (((toMinutes(rule.end) - toMinutes(rule.start)) % 1440) + 1440) % 1440;
  const late = addMinutes(rule.start, Math.max(0, Math.min(90, length - 30)));
  const early = addMinutes(rule.start, Math.max(0, Math.min(30, length - 30)));
  const beforeEnd = addMinutes(rule.end, -Math.min(30, length));
  const examples: NightExample[] = [];
  if (rule.arrivalFeeCents) examples.push({ key: "arrival", days: 3, arrival: late, return: null });
  if (rule.returnFeeCents) examples.push({ key: "return", days: 7, arrival: null, return: beforeEnd });
  if (rule.arrivalFeeCents && rule.returnFeeCents) examples.push({ key: "both", days: 7, arrival: early, return: beforeEnd });
  return examples;
}

/** The night settings as typed in « Mes tarifs ». */
export type NightForm = { enabled: boolean; start: string; end: string; arrivalFee: string; returnFee: string };

export const DEFAULT_NIGHT_START = "22:00";
export const DEFAULT_NIGHT_END = "06:00";

export function toNightForm(night: NightSettings | null | undefined): NightForm {
  return {
    enabled: night?.enabled ?? false,
    start: night?.start ?? DEFAULT_NIGHT_START,
    end: night?.end ?? DEFAULT_NIGHT_END,
    arrivalFee: night?.arrivalFeeCents != null ? centsToInput(night.arrivalFeeCents) : "",
    returnFee: night?.returnFeeCents != null ? centsToInput(night.returnFeeCents) : "",
  };
}

/** Field errors of the night form (codes of fr.plazo.nightErrors). */
export type NightFormErrors = Partial<Record<"end" | "arrivalFee" | "returnFee", "same_time" | "invalid_fee" | "fee_required">>;

/** A typed fee: null when empty, undefined when invalid (not an amount, or above 1 000 €). */
function parseFee(value: string): number | null | undefined {
  if (!value.trim()) return null;
  const cents = parseEuros(value);
  return cents !== null && cents <= MAX_NIGHT_FEE_CENTS ? cents : undefined;
}

/**
 * Checks the night form as the server does (`validateNightSettings`): switched on, the start and the end differ and
 * at least one fee is above 0. Switched off nothing blocks: the valid values are sent and kept, an invalid fee is
 * cleared. `settings` is what PUT /internal/pricing receives, null while an error remains.
 */
export function parseNightForm(form: NightForm): { settings: NightSettings | null; errors: NightFormErrors } {
  const errors: NightFormErrors = {};
  const arrival = parseFee(form.arrivalFee);
  const ret = parseFee(form.returnFee);
  const start = HHMM_RE.test(form.start) ? form.start : null;
  const end = HHMM_RE.test(form.end) ? form.end : null;
  if (form.enabled) {
    if (start === end) errors.end = "same_time";
    if (arrival === undefined) errors.arrivalFee = "invalid_fee";
    if (ret === undefined) errors.returnFee = "invalid_fee";
    if (arrival !== undefined && ret !== undefined && !arrival && !ret) {
      errors.arrivalFee = "fee_required";
      errors.returnFee = "fee_required";
    }
  }
  if (Object.keys(errors).length) return { settings: null, errors };
  return { settings: { enabled: form.enabled, start, end, arrivalFeeCents: arrival ?? null, returnFeeCents: ret ?? null }, errors };
}

export const euros = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** "34,99" / "34.99" / "34" -> 3499; null when not a valid amount. */
export function parseEuros(value: string): number | null {
  const normalized = value.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}

/**
 * 10/10/2026: the amount of a booking paid online on Plazo is what the traveller paid: the staff never change it (as
 * `isPriceLocked` on the server).
 */
export function isPriceLocked(booking: { channel: string; paymentStatus?: string | null; chargedCents?: number | null }): boolean {
  return booking.channel === "plazo" || booking.paymentStatus != null || booking.chargedCents != null;
}

/** 3499 -> "34,99" for an input field. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** A pricing grid row as typed in the form. */
export type Row = { days: string; price: string };

export function parseDays(value: string): number | null {
  const n = Number(value.trim());
  return Number.isInteger(n) && n >= 1 && n <= 90 ? n : null;
}

/** Rows that parse; invalid ones are flagged in the grid and left out of the simulation. */
export function parseRows(rows: Row[]): { tiers: PricingTier[]; valid: boolean } {
  const tiers: PricingTier[] = [];
  let valid = true;
  for (const r of rows) {
    const days = parseDays(r.days);
    const priceCents = parseEuros(r.price);
    if (days === null || priceCents === null) valid = false;
    else tiers.push({ days, priceCents });
  }
  return { tiers, valid };
}
