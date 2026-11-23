import { createHash } from 'crypto';
import { localDate } from './time';
import { whatsappParam } from './whatsapp';

/**
 * 23/11/2026 (« envoyer des messages WhatsApp pour inviter à utiliser Plazo lorsqu'on ne connaît pas le mail », maquette 1,
 * « envoyé à la réservation »): the WhatsApp invitation to install the app, for a booking of another channel whose
 * traveller's email is unknown (the welcome email covers the others). One Meta template (category Marketing): image header,
 * three body values, a fixed footer and a URL button whose suffix is the short link's code.
 */
export const INVITE_KIND = 'app_invite';

/** One invitation per number and operator in this time. */
export const INVITE_REPEAT_MS = 365 * 86400000;

export type InviteOutcome = 'sent' | 'repeat' | 'opted_out' | 'has_email' | 'no_phone' | 'off' | 'failed';

/** The approved body, word for word (to change only with the template at Meta). {{1}} first name, {{2}} parking, {{3}} stay. */
export const INVITE_BODY = [
  'Bonjour {{1}}, votre place au *{{2}}* est réservée {{3}}.',
  '',
  "Avec l'app Plazo, gratuite :",
  '• votre réservation toujours sous la main, sans chercher le mail ;',
  "• votre navette suivie en direct, à l'aller comme au retour ;",
  "• votre voiture retrouvée dès l'atterrissage.",
].join('\n');
export const INVITE_FOOTER = 'Répondez STOP pour ne plus en recevoir.';
export const INVITE_BUTTON = 'Installer Plazo';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const day = (iso: string) => `${Number(iso.slice(8, 10)) === 1 ? '1er' : Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;

/** « du 20 au 27 novembre », « du 28 novembre au 3 décembre », « pour le 20 novembre » (parking's local days). */
export function stayLabel(arrivalAt: Date, returnAt: Date, timeZone: string): string {
  const a = localDate(arrivalAt, timeZone);
  const r = localDate(returnAt, timeZone);
  if (a === r) return `pour le ${day(a)}`;
  const from = a.slice(0, 7) === r.slice(0, 7) ? day(a).split(' ')[0] : day(a);
  return `du ${from} au ${day(r)}`;
}

export function inviteParams(fields: { firstName: string; parking: string; stay: string }): string[] {
  return [whatsappParam(fields.firstName || 'Madame, Monsieur', 60), whatsappParam(fields.parking, 80), fields.stay];
}

/** The text the traveller reads (kept with the sent message, shown in the team's inbox). */
export function inviteText(params: string[]): string {
  return INVITE_BODY.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1] ?? '').replace(/\*/g, '');
}

/** « STOP », « Stop. », « stop pub »: the traveller wants no more of these messages. */
export const isStop = (text: string | null | undefined) => /^\s*(stop|arr[eê]t(er|ez)?|d[ée]sabonn\w*|unsubscribe)\b/i.test(text ?? '');

export const phoneHash = (e164: string) => createHash('sha256').update(e164.replace(/\D/g, '')).digest('hex');

/** Not at night: between 07:00 and 21:00 at the parking (a later booking gets it in the morning). */
export function inviteHour(now: Date, timeZone: string): boolean {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now));
  return hour >= 7 && hour < 21;
}
