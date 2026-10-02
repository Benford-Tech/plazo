const NBSP = " ";
const NARROW_NBSP = " ";

/**
 * 5500 -> "55,00 €", 123456 -> "1 234,56 €" (French typography, built by hand so that the server and
 * every browser print exactly the same string).
 */
export function formatEuros(cents: number): string {
  const negative = cents < 0;
  const abs = Math.round(Math.abs(cents));
  const euros = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP);
  const rest = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${euros},${rest}${NBSP}€`;
}

/** Whole euros for filters and slider bounds: 12000 -> "120 €". */
export function formatWholeEuros(cents: number): string {
  return `${Math.round(cents / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NBSP)}${NBSP}€`;
}

/** Short price of a map pill: whole euros when exact ("45 €"), else with cents ("34,99 €"). */
export function formatShortEuros(cents: number): string {
  return cents % 100 === 0 ? formatWholeEuros(cents) : formatEuros(cents);
}
