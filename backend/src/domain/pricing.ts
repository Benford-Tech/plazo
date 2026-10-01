import { addDays, localDate } from './time';

export interface Tier {
  days: number;
  priceCents: number;
}

/**
 * Billable days of a stay: every local calendar day touched, arrival and return days included
 * (Allopark example: 1 Oct 08:30 → 3 Oct 17:00 = 3 days).
 */
export function billableDays(arrivalAt: Date, returnAt: Date, timeZone: string): number {
  const first = localDate(arrivalAt, timeZone);
  const last = localDate(returnAt, timeZone);
  let days = 1;
  for (let d = first; d < last; d = addDays(d, 1)) days += 1;
  return days;
}

/**
 * Packages are "up to N days": a stay of D days costs the cheapest package covering it. Beyond the
 * longest package, each extra day costs `extraDayPriceCents`. Returns null when the grid cannot price
 * the stay (no package long enough and no extra-day price).
 */
export function quoteCents(tiers: Tier[], extraDayPriceCents: number | null, days: number): number | null {
  if (days < 1) return null;
  const covering = tiers.filter(t => t.days >= days);
  if (covering.length) return Math.min(...covering.map(t => t.priceCents));
  if (!tiers.length || extraDayPriceCents === null) return null;
  const longest = tiers.reduce((a, b) => (b.days > a.days ? b : a));
  return longest.priceCents + (days - longest.days) * extraDayPriceCents;
}

/** Plazo's share of a payment, rounded to the cent; the operator receives the rest. */
export function splitPayment(totalCents: number, commissionBps: number): { commissionCents: number; operatorCents: number } {
  const commissionCents = Math.round((totalCents * commissionBps) / 10000);
  return { commissionCents, operatorCents: totalCents - commissionCents };
}
