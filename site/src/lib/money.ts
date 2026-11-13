import { currentDict } from "./i18n/runtime";

const NBSP = "\u00a0";

function groups(units: number): string {
  return units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, currentDict().money.group);
}

function withSymbol(amount: string): string {
  return currentDict().money.symbolFirst ? `€${amount}` : `${amount}${NBSP}€`;
}

/**
 * 5500 -> "55,00 €", 123456 -> "1 234,56 €" in French ("€1,234.56" in English): the language's typography
 * (dict.money), built by hand so that the server and every browser print exactly the same string.
 */
export function formatEuros(cents: number): string {
  const negative = cents < 0;
  const abs = Math.round(Math.abs(cents));
  const euros = groups(Math.floor(abs / 100));
  const rest = String(abs % 100).padStart(2, "0");
  return `${negative ? "-" : ""}${withSymbol(`${euros}${currentDict().money.decimal}${rest}`)}`;
}

/** Whole euros for filters and slider bounds: 12000 -> "120 €". */
export function formatWholeEuros(cents: number): string {
  return withSymbol(groups(Math.round(cents / 100)));
}

/** Short price of a map pill: whole euros when exact ("45 €"), else with cents ("34,99 €"). */
export function formatShortEuros(cents: number): string {
  return cents % 100 === 0 ? formatWholeEuros(cents) : formatEuros(cents);
}
