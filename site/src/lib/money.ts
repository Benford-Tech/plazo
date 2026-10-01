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
