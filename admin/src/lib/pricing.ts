import type { PricingTier } from "./types";

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

export const euros = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

/** "34,99" / "34.99" / "34" -> 3499; null when not a valid amount. */
export function parseEuros(value: string): number | null {
  const normalized = value.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
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
