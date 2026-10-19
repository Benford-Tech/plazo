/**
 * What each comparator takes (19/10/2026, « paramétrer le taux de commission de chaque comparateur »): the API counts in
 * basis points (1800 = 18 %), the pro space types and shows percentages.
 */

/** « 18 % », « 17,5 % ». */
export function formatRate(bp: number): string {
  return `${(bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

/** « 17,5 » for 1750: what the field shows. */
export function rateToInput(bp: number): string {
  return (bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2, useGrouping: false });
}

/** « 17,5 », « 18 » or « 18 % » → basis points; null when it is not a percentage from 0 to 100. */
export function parsePercent(value: string): number | null {
  const text = value.replace(/\s|%/g, "").replace(",", ".");
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(text)) return null;
  const bp = Math.round(Number(text) * 100);
  return bp <= 10000 ? bp : null;
}

/** « 1 oct. 2026 » for a local date. */
export function dayLabel(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
}
