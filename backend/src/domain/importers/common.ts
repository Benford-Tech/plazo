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

/**
 * A plate: the French "AB-123-CD" (dashes or spaces optional), else one token of letters, digits and dashes with at least
 * one digit (15/10/2026: a plate cell left blank let the next label be read as the plate, « ENTR », « MARQUE », « PRIX »;
 * a placeholder such as « Inconnue » or « XX-XXX-XX » is no plate either).
 */
export const PLATE = /[A-Z]{2}[- ]?\d{3}[- ]?[A-Z]{2}(?![A-Z0-9])|(?=[A-Z0-9-]*\d)[A-Z0-9][A-Z0-9-]{2,10}[A-Z0-9](?![A-Z0-9])/;

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

/**
 * A subject about a cancellation or a refund, whatever its wording: Allopark's subjects only (they are known; a subject
 * of another comparator is read by SUBJECT_CANCELLATION_STRICT, which never takes « annulation gratuite » for one).
 */
export const SUBJECT_CANCELLATION = /\b(annul|rembours|cancel|refund)/i;
/**
 * 16/10/2026 (« analyser sans passer par Claude »): another comparator's subject about a cancellation or a refund
 * (« Annulation de réservation 5900001 », « Réservation PM… annulée », « Booking cancelled »); never a confirmation's
 * « Annulation gratuite ».
 */
export const SUBJECT_CANCELLATION_STRICT =
  /^\s*(?:annulation|remboursement|cancellation|refund)\b(?!\s+gratuite?s?\b|\s+free\b)|\b(?:annul[ée]e?s?|rembours[ée]e?s?|cancell?ed|refunded)\b/i;
/**
 * 10/10/2026 (« C'est une modification »): a subject about a change of the booking (« Modification de votre réservation
 * AL-… », « Votre réservation AL-… a été modifiée », « Changement de dates », « Booking AL-… changed »). 10/10/2026
 * (relecture): never « Modifiez votre réservation », « modifiable » nor « Modifier » (an invitation, not a change).
 */
export const SUBJECT_CHANGE = /\b(?:modification\b|modifi[ée]e?s?(?!\w)|changement\b|changed\b|amended\b|amendment\b)/i;
/** A comparator's booking reference that a heading or a cancellation names (Allopark's « AL-… », ParkMundo's « PM… »). */
const NAMED_REFERENCE = String.raw`(?:AL-\d{6,}|PM\d{6,})`;
/**
 * A cancellation in the text, the reference or other words in between (« Votre réservation AL-884880719 a été annulée »,
 * « Annulation AL-… », « Your booking AL-… was cancelled »), which isCancellation (words side by side) misses; never a
 * confirmation's « votre réservation peut être annulée », « booking can be cancelled » or (16/10/2026) « non
 * remboursable si annulée ». 10/10/2026 (relecture): also in the active voice (« Nous avons annulé votre réservation
 * AL-… suite à votre demande de changement de dates », « We have cancelled your booking », « Votre demande d'annulation
 * a bien été prise en compte »), which must never pass for a change. 16/10/2026: moved here from Allopark's page, for
 * every comparator (a Onepark « Une réservation Onepark a été annulée » or a ParkMundo « Votre réservation PM… a été
 * annulée » that keep the booking's table were read as new bookings).
 */
export const TEXT_CANCELLATION = [
  /r[ée]servation\b(?:(?!\bpeu[tv]|\bpourr|\bsera|\bsi\b)[^\n.]){0,60}?\b(annul[ée]e|rembours[ée]e)\b/i,
  /\bbooking\b(?:(?!\bcan\b|\bmay\b|\bwill\b|\bif\b)[^\n.]){0,60}?\b(cancell?ed|refunded)\b/i,
  new RegExp(String.raw`\b(annulation|remboursement|cancellation|refund)\b[^\n.]{0,40}?\b${NAMED_REFERENCE}`, 'i'),
  /\b(?:avons|avez|a|ont)\s+(?:bien\s+)?(?:annul|rembours)[ée]/i,
  /\b(?:we|you)(?:\s+have|'ve|’ve)?\s+(?:now\s+)?(?:cancell?ed|refunded)\b/i,
  /\bcancell?ed\s+(?:your|the|this)\s+(?:booking|reservation)\b/i,
  /\bannulation\b[^\n.]{0,40}?\b(?:a|ont)\s+(?:bien\s+)?été\s+(?:prise?s?\s+en\s+compte|confirm[ée]e?s?|effectu[ée]e?s?|enregistr[ée]e?s?|accept[ée]e?s?)/i,
  /\bcancellation\b[^\n.]{0,40}?\b(?:has|have)\s+been\s+(?:confirmed|processed|accepted|registered)\b/i,
];
/**
 * 10/10/2026 (« C'est une modification »): a change in the text, said as done (« Votre réservation AL-… a été
 * modifiée », « Modification de réservation AL-… » as a heading, « Vos nouvelles dates : … », « Les dates de votre
 * réservation ont été modifiées », « Votre changement de dates a été pris en compte », « Your booking AL-… has been
 * changed »). 10/10/2026 (relecture): never what a confirmation or a reminder says of a change to come (« votre
 * réservation peut être modifiée », « Annulation et changement de date gratuits », « Besoin de nouvelles dates ? »,
 * « Pour toute modification de votre réservation », « Modification gratuite… », « Keep your booking details updated »).
 * 16/10/2026: moved here from Allopark's page, for every comparator.
 */
export const TEXT_CHANGE = [
  /r[ée]servation\b(?:(?!\bpeu[tv]|\bpourr|\bsera)[^\n.]){0,60}?\bmodifi[ée]e\b/i,
  /\bbooking\b(?:(?!\bcan\b|\bmay\b|\bwill\b)[^\n.]){0,60}?\b(modified|changed|amended)\b/i,
  new RegExp(
    String.raw`^[ \t]*(?:(?:objet|subject)\s*:\s*)?(?:modification|changement|amendment)\b(?:(?!\bgratuit|\bpossible|\bfree\b|\bpeu[tv]|\bpourr|\bsera|\bcan\b|\bmay\b|\bwill\b)[^\n.?]){0,40}?\b${NAMED_REFERENCE}`,
    'im',
  ),
  /\b(?:vos|your)\s+(?:nouvelles\s+dates|new\s+dates)\s*(?::|sont\b|are\b)/i,
  /\bdates?\b(?:(?!\bpeu[tv]|\bpourr|\bsera|\bsi\b|\bcan\b|\bmay\b|\bwill\b|\bif\b)[^\n.?]){0,40}?\b(?:ont|a|have|has)\s+(?:bien\s+)?(?:été|been)\s+(?:modifi[ée]e?s?|chang[ée]e?s?|changed|modified|updated|amended)/i,
  /\b(?:changement|modification|change)\s+(?:de|des|of)\s+(?:vos\s+|your\s+)?dates?\b[^\n.?]{0,40}?\b(?:a|est|has|is)\s+(?:bien\s+)?(?:été\s+|been\s+)?(?:pris\s+en\s+compte|confirm[ée]e?|effectu[ée]e?|enregistr[ée]e?|confirmed|applied|processed)/i,
];

/** 16/10/2026: a cancellation or a refund said in a text, side by side (isCancellation) or with words in between. */
export function cancellationIn(text: string): boolean {
  return isCancellation(text) || TEXT_CANCELLATION.some(pattern => pattern.test(text));
}

/**
 * 16/10/2026: a change said as done in a text (TEXT_CHANGE); never isChange's words side by side, which are also a
 * confirmation's « Pour toute modification de votre réservation, contactez… ».
 */
export function changeIn(text: string): boolean {
  return TEXT_CHANGE.some(pattern => pattern.test(text));
}
