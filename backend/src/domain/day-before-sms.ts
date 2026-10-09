import { isGsm7 } from '@/domain/booking-messages';
import { CustomerNameFields, namesOfCustomer } from '@/domain/customer-name';
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

/** The variables of a text, as typed in it (accents optional), and what they stand for. */
export const TEMPLATE_VARIABLES = ['prénom', 'nom', 'date', 'heure', 'plaque', 'référence', 'lien'] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];
export type TemplateValues = Record<TemplateVariable, string>;

const ALIASES: Record<string, TemplateVariable> = { prenom: 'prénom', reference: 'référence' };
const TOKEN_RE = /\{\s*([^{}\s][^{}]{0,30}?)\s*\}/g;

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

/**
 * {prénom} and {nom}: the stored first and last name (09/10/2026), else "Camille Martin" split at its first space; the
 * date as 07/10/2026 and the time as 06:30, local to the parking.
 */
export function valuesOf(
  reservation: CustomerNameFields & { arrivalAt: Date; plate: string; reference: string },
  timeZone: string,
  link: string | null,
): TemplateValues {
  const { firstName: first, lastName: last } = namesOfCustomer(reservation);
  const local = localDateTime(reservation.arrivalAt, timeZone);
  const [year, month, day] = local.slice(0, 10).split('-');
  return {
    prénom: first,
    nom: last,
    date: `${day}/${month}/${year}`,
    heure: local.slice(11),
    plaque: reservation.plate,
    référence: reservation.reference,
    lien: link ?? '',
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
