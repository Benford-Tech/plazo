import { Handover, PaymentMethod, ReservationChannel, ReservationStatus } from '@/database';
import { importedPaymentMethod } from './payment-method';
import { KNOWN_COMPARATORS } from './comparator-commission';
import { cleanNamePart, CustomerNames, customerNamesOf } from './customer-name';
import { formatFlight, importedPlate, plateKey } from './reservation';
import { exceedsCalendarDays, parseInstant } from './time';

/**
 * 28/10/2026 (« je veux importer des anciennes réservations dans plazo et avoir un aperçu avant de valider », direction
 * A, « avec les réservations à venir aussi »): the rows of a spreadsheet the manager drops in, read cell by cell. The
 * browser only splits the file into cells and says which column holds what (`ImportField`); everything else is read
 * here, so the preview and the import tell the same thing.
 */

export const IMPORT_FIELDS = [
  'name',
  'firstName',
  'lastName',
  'phone',
  'email',
  'plate',
  'arrivalDate',
  'arrivalTime',
  'returnDate',
  'returnTime',
  'returnFlight',
  'departureFlight',
  'passengers',
  'price',
  'channel',
  'reference',
  'status',
  'bookedAt',
  'vehicle',
  'notes',
  'handover',
  'commission',
  'payment',
  'destination',
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

/** One row as the browser sends it: its line in the file and the text of each column it mapped. */
export type ImportRowInput = { line: number } & Partial<Record<ImportField, string>>;

/** A file import holds 2 000 rows at most (one JSON body under the 1 MB limit). */
export const MAX_IMPORT_ROWS = 2000;
/** A stay of an imported file: a year at most (the staff's form stops at 90 days, an old long stay may be longer). */
export const MAX_IMPORTED_STAY_DAYS = 366;
/** Hour given to a date without a time: drop-off in the morning, return at the end of the day (as the mockup said). */
export const DEFAULT_ARRIVAL_TIME = '08:00';
export const DEFAULT_RETURN_TIME = '18:00';

/** Why a row cannot be imported. */
export type ImportError =
  'name_missing' | 'arrival_missing' | 'arrival_invalid' | 'return_missing' | 'return_invalid' | 'return_before_arrival' | 'stay_too_long';

/** What is imported anyway but worth a look (« À vérifier »). */
export type ImportWarning =
  | 'no_phone'
  | 'plate_unreadable'
  | 'flight_unreadable'
  | 'price_unreadable'
  | 'passengers_unreadable'
  | 'booked_at_unreadable'
  | 'full_night'
  | 'handover_unreadable'
  | 'commission_unreadable'
  | 'payment_unreadable';

export interface ImportedBooking extends CustomerNames {
  customerPhone: string;
  customerEmail: string | null;
  plate: string;
  plateKey: string;
  arrivalAt: Date;
  returnAt: Date;
  status: ReservationStatus;
  channel: ReservationChannel;
  channelDetail: string | null;
  externalReference: string | null;
  priceCents: number | null;
  passengers: number;
  returnFlight: string | null;
  departureFlight: string | null;
  vehicleModel: string | null;
  notes: string | null;
  /** Shuttle, or valet at the terminal (the file's « Service » column, 29/10/2026). */
  handover: Handover;
  /** The comparator's commission in cents as the file gives it (its exact amount), for a comparator's booking only. */
  commissionOverrideCents: number | null;
  paymentMethod: PaymentMethod | null;
  /** 29/10/2026: the file's « Destination » as written, matched to a shuttle stop by the service (`withDestinations`). */
  destination: string | null;
  stopId: string | null;
  /** When the booking was made (the file's « réservée le »), null when the file does not say. */
  bookedAt: Date | null;
  /** Whether the stay is over, under way or to come at the time of the import. */
  timing: 'past' | 'current' | 'future';
}

export type ReadRow = { line: number; errors: ImportError[]; warnings: ImportWarning[]; booking: ImportedBooking | null };

const text = (value: string | undefined) => (value ?? '').replace(/ /g, ' ').trim();
const pad = (n: number) => String(n).padStart(2, '0');

interface DateParts {
  y: number;
  m: number;
  d: number;
  time?: string;
}

/** An Excel serial date (days since 30/12/1899, the fraction the time), as a spreadsheet's cell gives it. */
function serialDate(value: number): DateParts | null {
  if (!(value >= 20000 && value <= 80000)) return null;
  const ms = Math.round((value - 25569) * 86400) * 1000;
  const date = new Date(ms);
  const time = value % 1 ? `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}` : undefined;
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate(), time };
}

const MONTHS: Record<string, number> = {
  janv: 1,
  jan: 1,
  fevr: 2,
  fev: 2,
  mars: 3,
  avr: 4,
  mai: 5,
  juin: 6,
  juil: 7,
  aout: 8,
  sept: 9,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * A time of day: « 07:30 », « 7h30 », « 7h », « 07:30:00 », « 7.30 » never (a decimal), an Excel fraction of a day
 * (« 0.3125 »). Null when unreadable.
 */
export function parseImportTime(raw: string | undefined): string | null {
  const value = text(raw);
  if (!value) return null;
  if (/^0?[.,]\d+$/.test(value) || value === '0') {
    const minutes = Math.round(Number(value.replace(',', '.')) * 1440);
    if (minutes >= 1440) return null;
    return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  }
  const m = /^(\d{1,2})\s*(?:[:h]\s*(\d{2})?(?::\d{2})?)?$/i.exec(value);
  if (!m || (!value.includes(':') && !/h/i.test(value))) return null;
  const h = Number(m[1]);
  const mi = Number(m[2] ?? 0);
  if (h > 23 || mi > 59) return null;
  return `${pad(h)}:${pad(mi)}`;
}

/**
 * A date, with or without its time: « 03/09/2025 », « 3/9/25 », « 03-09-2025 », « 03.09.2025 », « 2025-09-03 »,
 * « 2025-09-03T07:30:00 », « 03/09/2025 07:30 », « 3 sept. 2025 », an Excel serial (« 45903.3125 »). Days before months
 * (French files). Null when unreadable.
 */
/** Day first (« 20/11/2026 », French) or month first (« 11/20/2026 », an American export). */
export type DateOrder = 'dmy' | 'mdy';

/**
 * The order of the file's numeric dates (29/10/2026: an export read « 12/10/2026 » as 12 October when it meant 10 December):
 * month first only when some date can only be month first (« 11/20/2026 ») and none can only be day first (« 20/11/2026 »).
 */
export function dateOrderOf(values: (string | undefined)[]): DateOrder {
  let dayFirst = 0;
  let monthFirst = 0;
  for (const raw of values) {
    const numeric = /^(\d{1,2})[/.-](\d{1,2})[/.-](?:\d{2}|\d{4})(?:\s|,|$)/.exec(text(raw));
    if (!numeric) continue;
    if (Number(numeric[1]) > 12) dayFirst += 1;
    if (Number(numeric[2]) > 12) monthFirst += 1;
  }
  return monthFirst > 0 && dayFirst === 0 ? 'mdy' : 'dmy';
}

export function parseImportDate(raw: string | undefined, order: DateOrder = 'dmy'): DateParts | null {
  const value = text(raw);
  if (!value) return null;
  if (/^\d+(?:[.,]\d+)?$/.test(value)) return serialDate(Number(value.replace(',', '.')));
  let parts: DateParts | null = null;
  let rest = '';
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(.*))?$/.exec(value);
  const fr = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})(?:[\s,]+(?:à\s*)?(.*))?$/i.exec(value);
  const words = /^(?:[a-zé]+\.?\s+)?(\d{1,2})(?:er)?\s+([a-zéû]+)\.?\s+(\d{4})(?:[\s,]+(?:à\s*)?(.*))?$/i.exec(value);
  if (iso) {
    parts = { y: Number(iso[1]), m: Number(iso[2]), d: Number(iso[3]) };
    rest = iso[4] ?? '';
  } else if (fr) {
    const y = Number(fr[3]);
    const [day, month] = order === 'mdy' ? [fr[2], fr[1]] : [fr[1], fr[2]];
    parts = { y: fr[3].length === 2 ? 2000 + y : y, m: Number(month), d: Number(day) };
    rest = fr[4] ?? '';
  } else if (words) {
    const month = MONTHS[fold(words[2]).slice(0, 4)] ?? MONTHS[fold(words[2]).slice(0, 3)];
    if (!month) return null;
    parts = { y: Number(words[3]), m: month, d: Number(words[1]) };
    rest = words[4] ?? '';
  }
  if (!parts) return null;
  if (parts.m < 1 || parts.m > 12 || parts.d < 1 || parts.d > new Date(Date.UTC(parts.y, parts.m, 0)).getUTCDate()) return null;
  if (parts.y < 2000 || parts.y > 2100) return null;
  // « 2025-09-03T07:30:00.000Z » from an export: the wall clock is kept (the file speaks the parking's time).
  const timeText = rest.replace(/(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/, '').trim();
  if (timeText) {
    const time = parseImportTime(timeText);
    if (!time) return null;
    parts.time = time;
  }
  return parts;
}

/** An amount in euros: « 54 », « 54,00 € », « 54.5 », « 1 234,50 », « EUR 54 ». Null when empty, 'invalid' otherwise. */
export function parseImportPrice(raw: string | undefined): number | null | 'invalid' {
  const value = text(raw)
    .replace(/€|eur(?:os?)?|ttc/gi, '')
    .replace(/[\s']/g, '');
  if (!value) return null;
  let number = value;
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(number)) number = number.replace(/\./g, '');
  number = number.replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(number)) return 'invalid';
  const cents = Math.round(Number(number) * 100);
  return cents <= 10_000_000 ? cents : 'invalid';
}

/**
 * A phone number as typed in the file: spaces and dots kept out, a French mobile that Excel read as a number (« 612345678 »,
 * the 0 dropped) given its 0 back. '' when empty.
 */
export function importedPhone(raw: string | undefined): string {
  const value = text(raw);
  if (!value) return '';
  const digits = value.replace(/[^\d+]/g, '');
  if (/^[1-9]\d{8}$/.test(digits)) return `0${digits}`;
  return digits.length >= 6 ? digits : value.slice(0, 30);
}

const CHANNEL_WORDS: { channel: ReservationChannel; words: RegExp }[] = [
  { channel: 'phone', words: /^(t[eé]l([eé]phone)?|tel\.?|appel|phone)$/i },
  { channel: 'counter', words: /^(comptoir|sur place|guichet|accueil|direct)$/i },
  { channel: 'website', words: /^(site( internet| web| du parking)?|web|internet|en ligne)$/i },
];

/**
 * The channel a row names: a known comparator (« allopark », « Onepark.fr »), the phone, the counter or the parking's
 * site; another name stays a comparator by that name; nothing is the file import itself.
 */
export function importedChannel(raw: string | undefined): { channel: ReservationChannel; channelDetail: string | null } {
  const value = cleanNamePart(raw);
  if (!value) return { channel: 'import', channelDetail: null };
  const key = fold(value).replace(/[^a-z0-9]/g, '');
  const comparator = KNOWN_COMPARATORS.find(c => key.includes(fold(c).replace(/[^a-z0-9]/g, '')));
  if (comparator) return { channel: 'aggregator', channelDetail: comparator };
  const known = CHANNEL_WORDS.find(c => c.words.test(value));
  if (known) return { channel: known.channel, channelDetail: null };
  return { channel: 'aggregator', channelDetail: value.slice(0, 40) };
}

/** A status the file says itself (cancelled, not come); null: read from the dates. */
export function importedStatus(raw: string | undefined): 'cancelled' | 'no_show' | null {
  const value = fold(text(raw));
  if (!value) return null;
  if (/annul|cancel|rembours/.test(value)) return 'cancelled';
  if (/non[\s-]?venu|no[\s-]?show|absent|pas venu/.test(value)) return 'no_show';
  return null;
}

function instantOf(date: DateParts, time: string, timeZone: string): Date | null {
  return parseInstant(`${date.y}-${pad(date.m)}-${pad(date.d)}T${time}`, timeZone);
}

/** One row read: its booking, or why it cannot be imported; what is worth a look on the side. */
/**
 * The handover a row names (29/10/2026, « Service » : Voiturier / Parking) : valet at the terminal, else the shuttle. Null when
 * the cell says something else (the shuttle is kept, with a warning).
 */
export function importedHandover(raw: string | undefined): Handover | null {
  const value = text(raw);
  if (!value) return 'shuttle';
  if (/voiturier|valet|terminal|jockey/i.test(value)) return 'valet';
  if (/\b(parking|navette|shuttle|standard|classique|non|aucun)\b/i.test(value)) return 'shuttle';
  return null;
}

export function readImportRow(row: ImportRowInput, timeZone: string, now: Date, order: DateOrder = 'dmy'): ReadRow {
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];

  const names = customerNamesOf(
    text(row.firstName) || text(row.lastName) ? { customerFirstName: row.firstName, customerLastName: row.lastName } : { customerName: row.name },
  );
  if (!names.customerName) errors.push('name_missing');

  const stayEnd = (dateRaw: string | undefined, timeRaw: string | undefined, fallback: string, side: 'arrival' | 'return') => {
    if (!text(dateRaw)) {
      errors.push(side === 'arrival' ? 'arrival_missing' : 'return_missing');
      return null;
    }
    const date = parseImportDate(dateRaw, order);
    const time = text(timeRaw) ? parseImportTime(timeRaw) : (date?.time ?? fallback);
    const instant = date && time ? instantOf(date, time, timeZone) : null;
    if (!instant) errors.push(side === 'arrival' ? 'arrival_invalid' : 'return_invalid');
    return instant;
  };
  const arrivalAt = stayEnd(row.arrivalDate, row.arrivalTime, DEFAULT_ARRIVAL_TIME, 'arrival');
  const returnAt = stayEnd(row.returnDate, row.returnTime, DEFAULT_RETURN_TIME, 'return');
  if (arrivalAt && returnAt) {
    if (returnAt <= arrivalAt) errors.push('return_before_arrival');
    else if (exceedsCalendarDays(arrivalAt, returnAt, timeZone, MAX_IMPORTED_STAY_DAYS)) errors.push('stay_too_long');
  }
  if (errors.length || !arrivalAt || !returnAt) return { line: row.line, errors, warnings, booking: null };

  const timing = returnAt <= now ? 'past' : arrivalAt <= now ? 'current' : 'future';
  const explicit = importedStatus(row.status);
  const status: ReservationStatus = explicit ?? (timing === 'past' ? 'returned' : timing === 'current' ? 'arrived' : 'upcoming');

  const customerPhone = importedPhone(row.phone);
  if (!customerPhone && timing !== 'past' && !explicit) warnings.push('no_phone');

  const plateRaw = text(row.plate);
  const plate = plateRaw ? (importedPlate(plateRaw) ?? '') : '';
  if (plateRaw && !plate) warnings.push('plate_unreadable');

  const unreadableFlights: string[] = [];
  const flight = (raw: string | undefined, label: string) => {
    const value = text(raw);
    if (!value) return null;
    // 29/10/2026 (« Vol / Train »): a train is never a flight (« TGV 6612 » would read as one): it goes to the notes.
    if (TRAIN.test(value)) {
      unreadableFlights.push(`Train indiqué dans le fichier : ${value.slice(0, 40)}`);
      return null;
    }
    const formatted = formatFlight(value);
    if (!formatted) {
      unreadableFlights.push(`${label} indiqué dans le fichier : ${value.slice(0, 40)} (numéro non reconnu)`);
      if (!warnings.includes('flight_unreadable')) warnings.push('flight_unreadable');
    }
    return formatted;
  };
  const returnFlight = flight(row.returnFlight, 'Vol retour');
  const departureFlight = flight(row.departureFlight, 'Vol aller');

  const price = parseImportPrice(row.price);
  if (price === 'invalid') warnings.push('price_unreadable');

  let passengers = 1;
  if (text(row.passengers)) {
    const n = Number(text(row.passengers).replace(/\s*(pers(onnes?)?\.?|pax|passagers?)$/i, ''));
    if (Number.isInteger(n) && n >= 1 && n <= 9) passengers = n;
    else warnings.push('passengers_unreadable');
  }

  let bookedAt: Date | null = null;
  if (text(row.bookedAt)) {
    const date = parseImportDate(row.bookedAt, order);
    bookedAt = date ? instantOf(date, date.time ?? '12:00', timeZone) : null;
    if (!bookedAt) warnings.push('booked_at_unreadable');
    else if (bookedAt > now) bookedAt = now;
  }

  const handover = importedHandover(row.handover);
  if (!handover) warnings.push('handover_unreadable');
  const channel = importedChannel(row.channel);
  // A comparator's commission only (the base refuses it on a phone or counter booking).
  const commission = parseImportPrice(row.commission);
  if (commission === 'invalid') warnings.push('commission_unreadable');
  const payment = importedPaymentMethod(row.payment);
  if (payment === 'invalid') warnings.push('payment_unreadable');
  const commissionOverrideCents =
    typeof commission === 'number' && (channel.channel === 'aggregator' || channel.channel === 'import') ? commission : null;

  const email = text(row.email).toLowerCase();
  const notes = [text(row.notes).slice(0, 1000), ...unreadableFlights].filter(Boolean).join('\n');

  return {
    line: row.line,
    errors,
    warnings,
    booking: {
      ...names,
      customerPhone,
      customerEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 200) : null,
      plate,
      plateKey: plateKey(plate),
      arrivalAt,
      returnAt,
      status,
      ...channel,
      externalReference: text(row.reference).toUpperCase().slice(0, 60) || null,
      priceCents: typeof price === 'number' ? price : null,
      passengers,
      returnFlight,
      departureFlight,
      vehicleModel: text(row.vehicle).slice(0, 40) || null,
      notes: notes || null,
      handover: handover ?? 'shuttle',
      commissionOverrideCents,
      paymentMethod: payment === 'invalid' ? null : payment,
      destination: text(row.destination).slice(0, 80) || null,
      stopId: null,
      bookedAt,
      timing,
    },
  };
}

/** A train number or name (« TGV 6612 », « Ouigo 7803 », « TER 17512 »), never read as a flight. */
const TRAIN = /\b(tgv|train|sncf|ouigo|inoui|ter|intercit[eé]s?|eurostar|thalys|lyria|frecciarossa|renfe|trenitalia)\b/i;

const foldName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Words that name the airport itself: the shuttle's built-in stop, no stop to set. */
const AIRPORT = /\b(aeroport|airport|aerogare|terminal|t1|lys|saint exupery|st exupery)\b/;

/**
 * 29/10/2026 (« il manque … destination »): the file's « Destination » as the booking's shuttle stop (« Gare TGV »), the
 * airport left as the default; anything else (the traveller's own destination, « Lisbonne ») goes to the notes.
 */
export function withDestinations<T extends { booking: ImportedBooking | null }>(rows: T[], stops: { id: string; name: string }[]): T[] {
  const named = stops.map(s => ({ id: s.id, key: foldName(s.name) })).filter(s => s.key);
  return rows.map(row => {
    const b = row.booking;
    if (!b?.destination) return row;
    const key = foldName(b.destination);
    const stop = key ? named.find(s => s.key === key || s.key.includes(key) || key.includes(s.key)) : undefined;
    if (stop) return { ...row, booking: { ...b, stopId: stop.id } };
    if (!key || AIRPORT.test(key)) return row;
    const line = `Destination indiquée dans le fichier : ${b.destination}`;
    return { ...row, booking: { ...b, notes: [b.notes, line].filter(Boolean).join('\n').slice(0, 1000) } };
  });
}
