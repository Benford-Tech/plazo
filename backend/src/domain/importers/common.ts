const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  janv: 1,
  fevr: 2,
  avr: 4,
  juil: 7,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "1 octobre 2026", "08:30" -> "2026-10-01T08:30" (local wall-clock time). */
export function frenchDateTime(day: string, month: string, year: string, hour: string, minute: string): string | undefined {
  const m = MONTHS[stripAccents(month.toLowerCase()).replace('.', '')];
  if (!m) return undefined;
  const pad = (n: string | number) => String(n).padStart(2, '0');
  return `${year}-${pad(m)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** "34,99" or "1 234,50" -> 3499 / 123450. */
export function euroCents(amount: string): number | undefined {
  const cleaned = amount.replace(/[\s  ]/g, '').replace(',', '.');
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
}

/**
 * Value printed on the line after a form label ("Numéro de plaque du véhicule*" then "GK-318-PX").
 * Empty when the next line is another label: in a customer email the form fields are often blank.
 */
export function valueAfterLabel(lines: string[], label: RegExp, otherLabels: RegExp[]): string | undefined {
  const index = lines.findIndex(line => label.test(line));
  if (index < 0) return undefined;
  const next = lines[index + 1]?.trim();
  if (!next || otherLabels.some(l => l.test(next))) return undefined;
  return next;
}

/** Every run of whitespace as one space: a label and its value read alike on one line or two, or in table cells. */
export function flatten(text: string): string {
  return text.replace(/[\s\u00a0\u202f]+/g, ' ').trim();
}

/** "15/10/2026", "12:00" (or "12h00") -> "2026-10-15T12:00" (local wall-clock time). */
export function numericDateTime(date: string, time: string): string | undefined {
  const d = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(date.trim());
  const t = /^(\d{1,2})[:h](\d{2})$/.exec(time.trim());
  if (!d || !t) return undefined;
  const pad = (n: string) => n.padStart(2, '0');
  return `${d[3]}-${pad(d[2])}-${pad(d[1])}T${pad(t[1])}:${t[2]}`;
}

/** Amount printed after a label, "Montant de la réservation : 45,00 €" or "Total € 31,99" -> cents. */
export function amountAfter(flat: string, label: RegExp): number | undefined {
  const match = new RegExp(`${label.source}\\s*:?\\s*(?:€\\s*)?(\\d[\\d\\s]*,\\d{2})`, label.flags.replace('g', '')).exec(flat);
  return match ? euroCents(match[1]) : undefined;
}

/** A phone number of the traveller: digits in groups, never running into a date that follows ("+33680736807 15/10/2026"). */
export const PHONE = /\+?\d[\d .]{7,18}\d(?![\d/])/;

/** A plate: the French "AB-123-CD" (dashes or spaces optional), else one token of letters, digits and dashes. */
export const PLATE = /[A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2}(?![A-Z0-9])|[A-Z0-9][A-Z0-9-]{2,10}[A-Z0-9](?![A-Z0-9])/;

/** The word "Nom" alone: never the end of "Prénom" (JavaScript's \\b treats "é" as a boundary). */
export const NOM = /(?<![A-Za-zÀ-ÿ])Nom(?![A-Za-zÀ-ÿ])/;

/** A 2- or 3-character airline code then the flight number: "EJU4315", "SN3587", "U2 4315". */
export const FLIGHT = /[A-Z][A-Z0-9]{1,2} ?\d{1,5}[A-Z]?/;

/**
 * A comparator's email about a booking cancelled or changed: never read as a new booking (Claude classifies it, and
 * nothing is created). The confirmations themselves mention "annulation gratuite", which is not enough.
 */
export function isCancellationOrChange(text: string): boolean {
  return isCancellation(text) || isChange(text);
}

/**
 * 10/10/2026 (« C'est une modification »): the two halves of isCancellationOrChange, apart. A cancellation (« Votre
 * réservation a été annulée », « Annulation de votre réservation », « booking cancelled »).
 */
export function isCancellation(text: string): boolean {
  return /\b(r[ée]servation (a [ée]t[ée] |est )?annul[ée]e|annulation de (votre|la) r[ée]servation|booking (has been )?(cancelled|canceled))\b/i.test(
    text,
  );
}

/** 10/10/2026: a change of a booking (« Votre réservation a été modifiée », « Modification de votre réservation », « booking modified »). */
export function isChange(text: string): boolean {
  return /\b(r[ée]servation (a [ée]t[ée] |est )?modifi[ée]e|modification de (votre|la) r[ée]servation|booking (has been )?modified)\b/i.test(text);
}
