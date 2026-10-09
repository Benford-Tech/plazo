/**
 * L-A (08/10/2026): when no importer recognises a forwarded email, Claude reads it. Pure side: the
 * instructions, the answer's schema, and the conversion of an answer into a `ParsedBooking` the
 * import pipeline already understands. The call itself lives in `EmailReadingService`.
 */
import { fullName } from './staff-name';
import type { ParsedBooking } from './importers/types';

export const EMAIL_KINDS = ['booking', 'modification', 'cancellation', 'other'] as const;
export type EmailKind = (typeof EMAIL_KINDS)[number];

/** Claude's answer, as the schema below constrains it. */
export interface EmailReading {
  kind: EmailKind;
  provider: string | null;
  externalReference: string | null;
  arrivalAt: string | null;
  returnAt: string | null;
  customerName: string | null;
  /** 09/10/2026: the first and the last name apart, when the email tells them apart. */
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  plate: string | null;
  returnFlight: string | null;
  departureFlight: string | null;
  passengers: number | null;
  priceCents: number | null;
  confidence: number;
  summary: string;
}

/** What is kept on the inbound row (`InboundEmail.reading`) for the pro space. */
export interface ReadingMeta {
  kind: EmailKind;
  provider: string | null;
  confidence: number;
  summary: string;
  model: string;
}

/** Below this confidence a booking is not created by itself: it waits in "À vérifier", prefilled. */
export const MIN_CONFIDENCE = 0.7;
/** The email handed to Claude is cut here: a confirmation is short, a long tail is quoted history. */
export const READING_TEXT_MAX_CHARS = 12000;
/** A plausible number of travellers; beyond, the value is dropped (staff see the email anyway). */
const MAX_PASSENGERS = 9;

const nullable = (schema: Record<string, unknown>) => ({ anyOf: [schema, { type: 'null' }] });

export const EMAIL_READING_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'kind',
    'provider',
    'externalReference',
    'arrivalAt',
    'returnAt',
    'customerName',
    'customerFirstName',
    'customerLastName',
    'customerPhone',
    'customerEmail',
    'plate',
    'returnFlight',
    'departureFlight',
    'passengers',
    'priceCents',
    'confidence',
    'summary',
  ],
  properties: {
    kind: { type: 'string', enum: [...EMAIL_KINDS] },
    provider: nullable({ type: 'string' }),
    externalReference: nullable({ type: 'string' }),
    arrivalAt: nullable({ type: 'string' }),
    returnAt: nullable({ type: 'string' }),
    customerName: nullable({ type: 'string' }),
    customerFirstName: nullable({ type: 'string' }),
    customerLastName: nullable({ type: 'string' }),
    customerPhone: nullable({ type: 'string' }),
    customerEmail: nullable({ type: 'string' }),
    plate: nullable({ type: 'string' }),
    returnFlight: nullable({ type: 'string' }),
    departureFlight: nullable({ type: 'string' }),
    passengers: nullable({ type: 'integer' }),
    priceCents: nullable({ type: 'integer' }),
    confidence: { type: 'number' },
    summary: { type: 'string' },
  },
};

/** The instructions: the parking's timezone fixes the local times, today's date disambiguates years. */
export function emailReadingPrompt(options: { timezone: string; today: string }): string {
  return `You read emails forwarded by a French airport car park operator (shuttle parking near the airport) to its booking tool.
Each email was forwarded from the operator's mailbox: it may be wrapped in a "Forwarded message" / "Message transféré" header
(ignore the forwarding header, read the original message). It may come from a booking platform or comparator (Parkos, Onepark,
ParkVia, Allopark, Blablapark, Travelcar, MyParking, Gopark, Zenpark, Parkos…), from the operator's own website form, or from a
customer writing directly.

First classify the email:
- "booking": a confirmed new reservation of a parking space (a booking confirmation, a "new booking" notification, an order).
- "modification": a change to a reservation that already exists (new dates, flight, vehicle, passengers).
- "cancellation": a reservation that is cancelled or refunded.
- "other": anything else (a question, a reply, a review request, an invoice or statement, a newsletter or marketing, a copy of the
  operator's own confirmation sent to a customer, a mail provider's forwarding confirmation, a reminder of a booking already made).

Then extract the reservation's fields exactly as the email states them. Never invent a value: null when the email does not say.
- arrivalAt: when the customer drops the car at the car park; returnAt: when they come back for it. Both as local times of the
  car park (timezone ${options.timezone}) in the form "YYYY-MM-DDTHH:mm". French dates such as "12 juillet 2026 à 06h30" become
  "2026-07-12T06:30". Today is ${options.today}; a date without a year is the next occurrence. When the time of day is not given,
  answer null for that field.
- customerName: first name and last name of the traveller.
- customerFirstName, customerLastName: the traveller's first name and last name apart, only when the email tells them apart
  (separate "Prénom" and "Nom" fields, or a last name plainly written in capitals as in "Marie DUPONT"); otherwise null for both.
- customerPhone: the traveller's phone number as written, with its country code when present.
- customerEmail: the traveller's email address (not the platform's).
- plate: the vehicle's registration number as written (for example "AB-123-CD").
- returnFlight, departureFlight: the flight numbers (for example "AF1234"), or null.
- passengers: the number of people travelling, as an integer.
- priceCents: the price of the parking stay in euro cents as an integer (189,90 € becomes 18990), or null. When the email
  shows a booking fee the platform keeps apart from the parking's price ("Coût de réservation", "frais de réservation",
  "frais de service"), leave that fee out: the parking's price, not the grand total.
- provider: a short name of the source: the platform's name ("Parkos", "Onepark"…), "Site du parking" for the operator's own
  website form, "Client" for a customer writing directly, or null when unknown.
- externalReference: the platform's booking reference as written, or null.
- confidence: between 0 and 1, how sure you are of the kind and of the fields above; lower it when a date, a name, a phone or
  a plate is ambiguous or guessed from context.
- summary: one short sentence in French for the operator, for example "Réservation Parkos de Marie Dupont du 12 au 19 juillet".`;
}

/** The email as handed to Claude: sender and subject first, the text cut at READING_TEXT_MAX_CHARS. */
export function emailReadingInput(email: { from: string | null; fromName?: string | null; subject: string | null; text: string }): string {
  const from = [email.fromName?.trim(), email.from?.trim()].filter(Boolean).join(' ') || '(unknown)';
  return `From: ${from}\nSubject: ${email.subject?.trim() || '(none)'}\n\n${email.text.slice(0, READING_TEXT_MAX_CHARS)}`;
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

const clean = (value: string | null | undefined, max = 200): string | undefined => {
  const trimmed = value?.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, max) : undefined;
};

const localDateTime = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed || !LOCAL_DATETIME.test(trimmed)) return undefined;
  // A calendar check: Date.parse would roll "2026-02-30" over to March.
  const [y, m, d, h, mi] = trimmed.split(/[-T:]/).map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, h, mi));
  const valid = date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d && h < 24 && mi < 60;
  return valid ? trimmed : undefined;
};

/** "+33 6 12 34 56 78", "06.12.34.56.78" → digits with the leading "+" kept. */
export function cleanPhone(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  // "+33 (0)6…": the bracketed trunk prefix goes with the country code.
  const digits = trimmed
    .replace(/\(0\)/g, '')
    .replace(/[^\d+]/g, '')
    .replace(/(?!^)\+/g, '');
  return digits.replace(/\D/g, '').length >= 6 ? digits.slice(0, 30) : undefined;
}

/** "ab 123 cd" → "AB-123-CD" for a French plate; other formats are upper-cased and kept. */
export function cleanPlate(value: string | null | undefined): string | undefined {
  const upper = value?.trim().toUpperCase().replace(/\s+/g, ' ');
  if (!upper) return undefined;
  const french = /^([A-Z]{2})[\s-]?(\d{3})[\s-]?([A-Z]{2})$/.exec(upper);
  if (french) return `${french[1]}-${french[2]}-${french[3]}`;
  const compact = upper.replace(/[^A-Z0-9-]/g, '');
  return compact.length >= 4 ? compact.slice(0, 20) : undefined;
}

const flight = (value: string | null | undefined): string | undefined => {
  const upper = value?.trim().toUpperCase().replace(/\s+/g, '');
  return upper && /^[A-Z0-9]{2,3}\d{1,4}[A-Z]?$/.test(upper) ? upper : undefined;
};

/**
 * Claude's answer as the import pipeline expects it. Values that do not pass a sanity check are
 * dropped (left for the staff), never corrected: a wrong booking costs more than a missing field.
 */
export function toParsedBooking(reading: EmailReading): ParsedBooking {
  const arrivalAt = localDateTime(reading.arrivalAt);
  let returnAt = localDateTime(reading.returnAt);
  if (arrivalAt && returnAt && returnAt <= arrivalAt) returnAt = undefined;
  const passengers =
    Number.isInteger(reading.passengers) && reading.passengers! > 0 && reading.passengers! <= MAX_PASSENGERS ? reading.passengers! : undefined;
  const priceCents = Number.isInteger(reading.priceCents) && reading.priceCents! >= 0 ? reading.priceCents! : undefined;
  const email = clean(reading.customerEmail, 200)?.toLowerCase();
  const booking: ParsedBooking = { provider: clean(reading.provider, 60) ?? 'E-mail' };
  const set = <K extends keyof ParsedBooking>(key: K, value: ParsedBooking[K] | undefined) => {
    if (value !== undefined) booking[key] = value;
  };
  set('externalReference', clean(reading.externalReference, 60));
  set('arrivalAt', arrivalAt);
  set('returnAt', returnAt);
  // First and last name apart (09/10/2026) only as a pair; the display name is rebuilt from them when Claude left it out.
  const first = clean(reading.customerFirstName, 60);
  const last = clean(reading.customerLastName, 60);
  set('customerName', clean(reading.customerName, 120) ?? (first && last ? fullName(first, last) : undefined));
  if (first && last) {
    set('customerFirstName', first);
    set('customerLastName', last);
  }
  set('customerPhone', cleanPhone(reading.customerPhone));
  set('customerEmail', email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined);
  set('plate', cleanPlate(reading.plate));
  set('returnFlight', flight(reading.returnFlight));
  set('departureFlight', flight(reading.departureFlight));
  set('passengers', passengers);
  set('priceCents', priceCents);
  return booking;
}

/** The answer, checked field by field: a malformed one (wrong kind, confidence out of range…) is refused. */
export function readingOf(value: unknown): EmailReading | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!EMAIL_KINDS.includes(v.kind as EmailKind)) return null;
  const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);
  const int = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) ? x : null);
  const confidence = typeof v.confidence === 'number' && Number.isFinite(v.confidence) ? Math.min(1, Math.max(0, v.confidence)) : 0;
  return {
    kind: v.kind as EmailKind,
    provider: str(v.provider),
    externalReference: str(v.externalReference),
    arrivalAt: str(v.arrivalAt),
    returnAt: str(v.returnAt),
    customerName: str(v.customerName),
    customerFirstName: str(v.customerFirstName),
    customerLastName: str(v.customerLastName),
    customerPhone: str(v.customerPhone),
    customerEmail: str(v.customerEmail),
    plate: str(v.plate),
    returnFlight: str(v.returnFlight),
    departureFlight: str(v.departureFlight),
    passengers: int(v.passengers),
    priceCents: int(v.priceCents),
    confidence,
    summary: (str(v.summary) ?? '').trim().slice(0, 300),
  };
}
