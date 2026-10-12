import { fr } from "./fr";
import { formatShortEuros } from "./money";
import type { NightFee, NightRule } from "./types";

/**
 * Night fees on the site (direction B, 12/10/2026): only in the price detail. The API folds them into every total
 * (`priceCents`), so result cards, map pins, sorting and filters need nothing; the price lines show where they come
 * from (« Frais de nuit · dépôt à 23:30 ») and the parking's rule under them. The site never computes a fee: it
 * reads the offer's or the booking's (frozen at booking) and the parking's rule as the API sends them.
 */

/** A piece of the « Frais de nuit · dépôt à 23:30 » label: words, or an hour (drawn in the hours' mono face). */
export type NightFeePart = { text: string } | { hour: string };

/** Anything priced by the API: an offer of a search or a parking page, or a booking. */
interface Priced {
  priceCents: number | null;
  basePriceCents?: number | null;
  nightFee?: NightFee | null;
}

/** The night fee a stay pays, or null when it pays none (or the API is older than night fees). */
export function chargedNightFee(fee: NightFee | null | undefined): NightFee | null {
  return fee && fee.totalCents > 0 ? fee : null;
}

/** True when this offer can be booked and its total includes a night fee (« frais de nuit compris » on the results). */
export function hasNightFee(offer: Priced & { available: boolean }): boolean {
  return offer.available && offer.priceCents !== null && chargedNightFee(offer.nightFee) !== null;
}

/**
 * The price grid's part of a total, printed on « Forfait N jours »: the API's `basePriceCents`, else (older API)
 * the total less its night fee. Null when the stay has no price.
 */
export function basePriceOf(priced: Priced): number | null {
  if (priced.priceCents === null) return null;
  if (typeof priced.basePriceCents === "number") return priced.basePriceCents;
  return priced.priceCents - (chargedNightFee(priced.nightFee)?.totalCents ?? 0);
}

/** "2026-10-13T23:30" -> "23:30". */
function hourOf(local: string): string {
  return local.slice(11, 16);
}

/**
 * The label of a stay's night fee line, in pieces: « Frais de nuit · dépôt à 23:30 », « … · retour à 05:30 » or
 * « … · dépôt à 22:30 et retour à 05:30 », from the ends the fee was charged for and the booked local hours.
 * Null when the stay pays no night fee.
 */
export function nightFeeParts(fee: NightFee | null | undefined, arrivalAt: string, returnAt: string): NightFeePart[] | null {
  const charged = chargedNightFee(fee);
  if (!charged) return null;
  const dropOff = charged.arrivalCents > 0;
  const pickUp = charged.returnCents > 0;
  if (!dropOff && !pickUp) return [{ text: fr.parking.nightFee }];
  const parts: NightFeePart[] = [{ text: `${fr.parking.nightFee} · ` }];
  if (dropOff) parts.push({ text: `${fr.parking.nightFeeDropOff} ` }, { hour: hourOf(arrivalAt) });
  if (dropOff && pickUp) parts.push({ text: ` ${fr.parking.nightFeeAnd} ` });
  if (pickUp) parts.push({ text: `${fr.parking.nightFeeReturn} ` }, { hour: hourOf(returnAt) });
  return parts;
}

/** The same label as plain text (screen readers, tests). */
export function nightFeeLabel(fee: NightFee | null | undefined, arrivalAt: string, returnAt: string): string | null {
  const parts = nightFeeParts(fee, arrivalAt, returnAt);
  return parts ? parts.map(p => ("hour" in p ? p.hour : p.text)).join("") : null;
}

/**
 * The parking's rule, under its price lines: « Ce parking ajoute 15 € pour un dépôt ou un retour entre 22:00 et
 * 06:00. » (one amount for both ends), « … 15 € pour un dépôt et 10 € pour un retour … » (two amounts), or one end
 * only. Null when the parking charges no night fee.
 */
export function nightRuleSentence(rule: NightRule | null | undefined): string | null {
  if (!rule) return null;
  const dropOff = rule.arrivalFeeCents ?? 0;
  const pickUp = rule.returnFeeCents ?? 0;
  if (dropOff <= 0 && pickUp <= 0) return null;
  const p = fr.parking;
  const fees =
    dropOff > 0 && pickUp > 0
      ? dropOff === pickUp
        ? p.nightRuleSame(formatShortEuros(dropOff))
        : p.nightRuleEach(formatShortEuros(dropOff), formatShortEuros(pickUp))
      : dropOff > 0
        ? p.nightRuleDropOff(formatShortEuros(dropOff))
        : p.nightRuleReturn(formatShortEuros(pickUp));
  return p.nightRule(fees, rule.start, rule.end);
}
