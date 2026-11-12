import { isGsm7 } from '@/domain/booking-messages';
import { CustomerNameFields, namesOfCustomer } from '@/domain/customer-name';
import { displayPhone } from '@/domain/phone';
import { addDays, dayBounds, localDate, localDateTime, parseInstant } from '@/domain/time';

/**
 * The day-before SMS (« SMS de la veille », S-A + S-B, 06/10/2026): each evening, the travellers who
 * drop their car off the next day receive the parking's own text. The parking chooses the usual time,
 * may move or pause one evening, and staff may leave a booking out. Pure rules, no database.
 */

export const DEFAULT_SEND_TIME = '18:00';
/** No reminder leaves between these local times: a late one waits for the morning. */
export const QUIET_FROM = '22:00';
export const QUIET_UNTIL = '07:00';
export const TEMPLATE_MAX_LENGTH = 2000;
/** The evenings the pro space shows: yesterday, tonight and the next five. */
export const BOARD_EVENINGS_BEFORE = 1;
export const BOARD_EVENINGS_AFTER = 5;

/** The times a parking may choose: every half hour from 16:00 to 21:30 (before the quiet hours). */
export const SEND_TIMES: readonly string[] = Array.from({ length: 12 }, (_, i) => {
  const minutes = 16 * 60 + i * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

/**
 * The variables of a text, as typed in it (accents optional), and what they stand for. 09/11/2026 (« variabilise au
 * maximum, c'est pour tous les parkings »): the parking's own details too, so that one text serves every parking.
 */
export const TEMPLATE_VARIABLES = [
  'prénom',
  'nom',
  'date',
  'heure',
  'plaque',
  'référence',
  'lien',
  'retour',
  'vol',
  'parking',
  'adresse',
  'téléphone',
  'rendez-vous',
  'consignes',
  'navette',
  'services',
  // 11/11/2026 (« variabilise au max »): the parking's opening hours, the meeting point's GPS, its conditions (night fees
  // included) and the driver's phone.
  'horaires',
  'gps',
  'conditions',
  'chauffeur',
] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Record<TemplateVariable, string>;

const ALIASES: Record<string, TemplateVariable> = {
  prenom: 'prénom',
  reference: 'référence',
  telephone: 'téléphone',
  tel: 'téléphone',
  'rendez vous': 'rendez-vous',
  rendezvous: 'rendez-vous',
  rdv: 'rendez-vous',
  'téléphone chauffeur': 'chauffeur',
  'telephone chauffeur': 'chauffeur',
  accès: 'horaires',
  acces: 'horaires',
};
// 09/11/2026 (« ce sont des doubles accolades »): {{prénom}} works as {prénom}.
const TOKEN_RE = /\{\{?\s*([^{}\s][^{}]{0,30}?)\s*\}\}?/g;

function variableOf(name: string): TemplateVariable | null {
  const key = name.toLowerCase();
  if ((TEMPLATE_VARIABLES as readonly string[]).includes(key)) return key as TemplateVariable;
  return ALIASES[key] ?? null;
}

/** The {…} of a text that are not variables, as typed (the editor and the API refuse them). */
export function unknownVariables(template: string): string[] {
  const unknown = new Set<string>();
  for (const match of template.matchAll(TOKEN_RE)) if (!variableOf(match[1])) unknown.add(match[0]);
  return [...unknown];
}

/** The text with its variables replaced; an empty value leaves no stray spaces at the end of a line. */
export function renderTemplate(template: string, values: TemplateValues): string {
  return template
    .replace(TOKEN_RE, (whole, name: string) => {
      const variable = variableOf(name);
      return variable ? values[variable] : whole;
    })
    .replace(/[ \t]+$/gm, '')
    .trim();
}

export interface SmsLength {
  encoding: 'gsm7' | 'unicode';
  characters: number;
  /** How many SMS the operator's phone or Brevo sends for it (long texts are split). */
  segments: number;
}

const GSM7_EXTENDED = new Set('^{}\\[~]|€');

/** GSM-7: 160 characters, or 153 per part; any other character (emoji, â, ’…): Unicode, 70 or 67 per part. */
export function smsLength(text: string): SmsLength {
  if (isGsm7(text)) {
    const characters = [...text].reduce((n, c) => n + (GSM7_EXTENDED.has(c) ? 2 : 1), 0);
    return { encoding: 'gsm7', characters, segments: characters <= 160 ? 1 : Math.ceil(characters / 153) };
  }
  // UTF-16 code units: an emoji counts twice.
  const characters = text.length;
  return { encoding: 'unicode', characters, segments: characters <= 70 ? 1 : Math.ceil(characters / 67) };
}

export interface TemplateContext {
  productName: string;
  parkingName: string;
  address: string | null;
  phone: string | null;
  shuttleMinutes: number | null;
  /** The traveller can answer the SMS (it leaves from the parking's own phone). */
  repliesReachParking: boolean;
}

/** Plazo's text, used until the parking writes its own (the reminder of B, 06/10/2026, with variables). */
export function defaultTemplate(ctx: TemplateContext): string {
  return (
    `${ctx.productName} : à demain ! Dépôt le {date} à {heure} à ${ctx.parkingName}${ctx.address ? `, ${ctx.address}` : ''}.` +
    (ctx.shuttleMinutes ? ` Navette ${ctx.shuttleMinutes} min jusqu'au terminal.` : '') +
    (ctx.phone ? ` Parking : ${ctx.phone}.` : '') +
    ' {lien}'
  );
}

/** The short text the editor offers when the parking's own is too long: the practical details stay behind the link. */
export function shortTemplate(ctx: TemplateContext): string {
  const contact = ctx.repliesReachParking ? ' Une modification ? Répondez à ce SMS.' : ctx.phone ? ` Une question ? ${ctx.phone}.` : '';
  return (
    `${ctx.parkingName} : bonjour {prénom}, à demain {heure} !${ctx.address ? ` ${ctx.address}.` : ''}` +
    ` Infos pratiques et retour : {lien}${contact}`
  );
}

export interface EveningRule {
  /** Local "HH:MM". */
  sendTime: string;
  paused: boolean;
}

/** The evening that reminds the travellers arriving at `arrivalAt`: the local day before. */
export function eveningOf(arrivalAt: Date, timeZone: string): string {
  return addDays(localDate(arrivalAt, timeZone), -1);
}

/** Out of the quiet hours: 22:00 or later moves to 07:00 the next morning, before 07:00 to 07:00. */
export function outOfQuietHours(instant: Date, timeZone: string): Date {
  const local = localDateTime(instant, timeZone);
  const time = local.slice(11);
  if (time >= QUIET_FROM) return parseInstant(`${addDays(local.slice(0, 10), 1)}T${QUIET_UNTIL}`, timeZone)!;
  if (time < QUIET_UNTIL) return parseInstant(`${local.slice(0, 10)}T${QUIET_UNTIL}`, timeZone)!;
  return instant;
}

export function inQuietHours(instant: Date, timeZone: string): boolean {
  return outOfQuietHours(instant, timeZone).getTime() !== instant.getTime();
}

export type NotDueReason = 'paused' | 'same_day' | 'too_late';

/**
 * When a booking's reminder leaves: at its evening's time, or as soon as it is booked when that is
 * later (out of the quiet hours); never for a booking made on the day of the drop-off, nor when that
 * moment is not before the drop-off.
 */
export function reminderDueAt(input: {
  arrivalAt: Date;
  createdAt: Date;
  timeZone: string;
  evening: EveningRule;
}): { at: Date } | { reason: NotDueReason } {
  const { arrivalAt, createdAt, timeZone, evening } = input;
  const day = localDate(arrivalAt, timeZone);
  if (createdAt >= dayBounds(day, timeZone).start) return { reason: 'same_day' };
  if (evening.paused) return { reason: 'paused' };
  const planned = parseInstant(`${addDays(day, -1)}T${evening.sendTime}`, timeZone)!;
  const at = outOfQuietHours(createdAt > planned ? createdAt : planned, timeZone);
  if (at >= arrivalAt) return { reason: 'too_late' };
  return { at };
}

interface ParkingForTemplate {
  name: string;
  address: string | null;
  shuttleTravelMinutes: number;
  listing: { title: string; contactPhone: string | null; shuttleMinutes: number | null } | null;
}

export function templateContextOf(productName: string, parking: ParkingForTemplate, repliesReachParking: boolean): TemplateContext {
  return {
    productName,
    parkingName: parking.listing?.title ?? parking.name,
    address: parking.address,
    phone: parking.listing?.contactPhone ?? null,
    shuttleMinutes: parking.listing?.shuttleMinutes ?? parking.shuttleTravelMinutes,
    repliesReachParking,
  };
}

/** The parking's details a text may name ({parking}, {adresse}…), the same for all its bookings. */
export interface ParkingValues {
  name: string;
  address: string | null;
  phone: string | null;
  meetingPoint: string | null;
  meetingInstructions: string | null;
  shuttleMinutes: number | null;
  /** The services for the car the parking offers (enabled, not archived), in their order. */
  services: { label: string; priceCents: number }[];
  /** 11/11/2026: the listing's opening hours, « 45.71984 N, 5.07674 E », the conditions on one line, the driver's phone. */
  hours: string | null;
  gps: string | null;
  conditions: string | null;
  driverPhone: string | null;
}

export const NO_PARKING_VALUES: ParkingValues = {
  name: '',
  address: null,
  phone: null,
  meetingPoint: null,
  meetingInstructions: null,
  shuttleMinutes: null,
  services: [],
  hours: null,
  gps: null,
  conditions: null,
  driverPhone: null,
};

/** « 45.71984 N, 5.07674 E » (5 decimals, about a metre). */
export function gpsLabel(point: { lat: number; lng: number } | null): string | null {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
  const lat = `${Math.abs(point.lat).toFixed(5)} ${point.lat >= 0 ? 'N' : 'S'}`;
  const lng = `${Math.abs(point.lng).toFixed(5)} ${point.lng >= 0 ? 'E' : 'O'}`;
  return `${lat}, ${lng}`;
}

/** « 10 € », « 12,50 € ». */
const eurosShort = (cents: number) => (cents % 100 === 0 ? `${cents / 100} €` : `${(cents / 100).toFixed(2).replace('.', ',')} €`);
const hourLabel = (hhmm: string) => (hhmm.endsWith(':00') ? `${Number(hhmm.slice(0, 2))}h` : hhmm.replace(':', 'h'));

/**
 * The parking's conditions on one line (Meta refuses a line break in a template's variable): one condition per line or per
 * bullet (« * », « • », « - » at a line start; an asterisk would also turn bold in WhatsApp), joined by « ; ». A list pasted
 * into a one-line field loses its line breaks but keeps its « * » markers, so those split too (12/11/2026).
 */
export function oneLineConditions(text: string | null | undefined): string | null {
  if (!text) return null;
  const parts = text
    .split(/\r?\n|[*•]+\s*/)
    .map(part =>
      part
        .replace(/^\s*[-·]\s+/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\s*[;,.]$/, ''),
    )
    .filter(Boolean);
  return parts.length ? parts.join(' ; ') : null;
}

const sameWindow = (text: string, window: string) =>
  text
    .toLowerCase()
    .replace(/(\d)\s+h/g, '$1h')
    .replace(/\s+/g, ' ')
    .includes(window);

/**
 * {conditions}: the night fees Plazo knows (« Prise en charge ou restitution entre 22h et 6h : supplément de 10 € ») then
 * the parking's own text, one line. When the parking already writes the same night window itself, only its words are kept.
 */
export function conditionsLabel(
  night: { start: string; end: string; arrivalFeeCents: number | null; returnFeeCents: number | null } | null,
  own: string | null,
): string | null {
  const parts: string[] = [];
  const text = oneLineConditions(own);
  if (night && !(text && sameWindow(text, `entre ${hourLabel(night.start)} et ${hourLabel(night.end)}`))) {
    const window = `entre ${hourLabel(night.start)} et ${hourLabel(night.end)}`;
    const a = night.arrivalFeeCents;
    const r = night.returnFeeCents;
    if (a && r && a === r) parts.push(`Prise en charge ou restitution ${window} : supplément de ${eurosShort(a)}`);
    else {
      if (a) parts.push(`Prise en charge ${window} : supplément de ${eurosShort(a)}`);
      if (r) parts.push(`Restitution ${window} : supplément de ${eurosShort(r)}`);
    }
  }
  if (text) parts.push(text);
  return parts.length ? parts.join(' ; ') : null;
}

interface ParkingForValues {
  name: string;
  address: string | null;
  shuttleTravelMinutes: number;
  returnMeetingLabel: string | null;
  returnMeetingInstructions: string | null;
  driverPhone?: string | null;
  travellerConditions?: string | null;
  listing: {
    title: string;
    contactPhone: string | null;
    shuttleMinutes: number | null;
    openingHours?: string | null;
    airport?: { name: string } | null;
  } | null;
}

/**
 * {parking} is the listing's title, {rendez-vous} the meeting point of the return, else the airport. 10/11/2026 (« il y a
 * le point de rendez-vous pour déposer la voiture et le point de rdv à l'aéroport/gare »): a booking served at one of the
 * parking's stops (gare TGV, hôtel…) is met there on the way back, so {rendez-vous} and {consignes} are that stop's.
 */
export function parkingValuesOf(
  parking: ParkingForValues,
  services: { label: string; priceCents: number }[],
  stop: { name: string; instructions: string | null; lat?: number; lng?: number } | null = null,
  extra: {
    meetingPoint?: { lat: number; lng: number } | null;
    night?: { start: string; end: string; arrivalFeeCents: number | null; returnFeeCents: number | null } | null;
    /** 11/11/2026 (« il manque le numéro du parking »): the parking's SMS phone, when the listing gives no phone. */
    senderPhone?: string | null;
  } = {},
): ParkingValues {
  return {
    name: parking.listing?.title ?? parking.name,
    address: parking.address,
    phone: parking.listing?.contactPhone?.trim() || (extra.senderPhone?.trim() ? displayPhone(extra.senderPhone) : null),
    meetingPoint: stop ? stop.name.trim() || null : parking.returnMeetingLabel?.trim() || parking.listing?.airport?.name || null,
    meetingInstructions: stop ? stop.instructions?.trim() || null : parking.returnMeetingInstructions?.trim() || null,
    shuttleMinutes: parking.listing?.shuttleMinutes ?? parking.shuttleTravelMinutes ?? null,
    services,
    hours: parking.listing?.openingHours?.trim() || null,
    gps: stop && stop.lat !== undefined && stop.lng !== undefined ? gpsLabel({ lat: stop.lat, lng: stop.lng }) : gpsLabel(extra.meetingPoint ?? null),
    conditions: conditionsLabel(extra.night ?? null, parking.travellerConditions ?? null),
    driverPhone: parking.driverPhone?.trim() || null,
  };
}

/** « 50 € », « 15,50 € ». */
function euros(cents: number): string {
  return cents % 100 === 0 ? `${cents / 100} €` : `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

const localDayAndTime = (instant: Date, timeZone: string) => {
  const local = localDateTime(instant, timeZone);
  const [year, month, day] = local.slice(0, 10).split('-');
  return { date: `${day}/${month}/${year}`, time: local.slice(11) };
};

/**
 * {prénom} and {nom}: the stored first and last name (09/10/2026), else "Camille Martin" split at its first space; the
 * date as 07/10/2026 and the time as 06:30, local to the parking. 09/11/2026: {retour} « 15/11/2026 à 09:30 », {vol},
 * and the parking's details; a detail the parking has not given is empty.
 */
export function valuesOf(
  reservation: CustomerNameFields & { arrivalAt: Date; plate: string; reference: string; returnAt?: Date | null; returnFlight?: string | null },
  timeZone: string,
  link: string | null,
  parking: ParkingValues = NO_PARKING_VALUES,
): TemplateValues {
  const { firstName: first, lastName: last } = namesOfCustomer(reservation);
  const arrival = localDayAndTime(reservation.arrivalAt, timeZone);
  const back = reservation.returnAt ? localDayAndTime(reservation.returnAt, timeZone) : null;
  return {
    prénom: first,
    nom: last,
    date: arrival.date,
    heure: arrival.time,
    plaque: reservation.plate,
    référence: reservation.reference,
    lien: link ?? '',
    retour: back ? `${back.date} à ${back.time}` : '',
    vol: reservation.returnFlight ?? '',
    parking: parking.name,
    adresse: parking.address ?? '',
    téléphone: parking.phone ?? '',
    'rendez-vous': parking.meetingPoint ?? '',
    consignes: parking.meetingInstructions ?? '',
    navette: parking.shuttleMinutes ? `${parking.shuttleMinutes} min` : '',
    services: parking.services.map(s => `${s.label} : ${euros(s.priceCents)}`).join(', '),
    horaires: parking.hours ?? '',
    gps: parking.gps ?? '',
    conditions: parking.conditions ?? '',
    chauffeur: parking.driverPhone ?? '',
  };
}

/**
 * A reminder planned the evening before that did not leave then (the scheduler was down) never leaves
 * on the drop-off day itself: "à demain" would be wrong. A late booking's reminder (07:00 that day) does.
 */
export function missedEvening(dueAt: Date, arrivalAt: Date, now: Date, timeZone: string): boolean {
  const day = localDate(arrivalAt, timeZone);
  return localDate(now, timeZone) === day && localDate(dueAt, timeZone) !== day;
}
