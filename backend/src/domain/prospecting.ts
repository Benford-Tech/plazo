import { createHash } from 'crypto';
import { EmailMessage } from './booking-messages';
import { addDays, localDate, localDateTime, parseInstant } from './time';

/**
 * Prospection (Plateforme › Prospection, 18/10/2026, choix « A avec les relances de B »): the pure rules. A sequence of
 * three emails (first contact, follow-up, last message) with variables, sent Monday to Friday from 09:00 to 18:00
 * (Europe/Paris), at most `dailyCap` a day; a reply, an interest or an unsubscription stops it for good.
 */

export const PROSPECTING_TZ = 'Europe/Paris';
export const WINDOW_START = '09:00';
export const WINDOW_END = '18:00';
export const DEFAULT_DAILY_CAP = 50;
export const MAX_DAILY_CAP = 300;
/** Prospects are deleted this long after the last contact (or their creation when never contacted): CNIL, B2B. */
export const RETENTION_YEARS = 3;
/** Brevo refusals in a row on the same step before the follow-ups stop. */
export const MAX_FAILED_ATTEMPTS = 3;
/** A failed send is tried again this much later (inside the window). */
export const RETRY_AFTER_MINUTES = 60;
export const MAX_IMPORT_ROWS = 2000;

export type ProspectStatusName = 'to_contact' | 'contacted' | 'replied' | 'interested' | 'not_interested' | 'unsubscribed';
export const PROSPECT_STATUSES: ProspectStatusName[] = ['to_contact', 'contacted', 'replied', 'interested', 'not_interested', 'unsubscribed'];
/** Statuses that end the sequence: nothing is ever sent to them again. */
export const CLOSED_STATUSES: ProspectStatusName[] = ['replied', 'interested', 'not_interested', 'unsubscribed'];
export const isClosed = (status: ProspectStatusName): boolean => CLOSED_STATUSES.includes(status);

// ---- The sequence --------------------------------------------------------------------------------------------------

export interface SequenceStep {
  step: 1 | 2 | 3;
  enabled: boolean;
  /** Days after the first contact (J0); 0 for the first step. */
  delayDays: number;
  subject: string;
  body: string;
}

export const VARIABLES = ['prénom', 'nom', 'parking', 'aéroport', 'ville'] as const;
export type VariableName = (typeof VARIABLES)[number];
export type TemplateValues = Record<VariableName, string>;

/** Plazo's own texts, until the platform admin writes theirs (« Modifier les mails »). */
export function defaultSteps(productName: string): SequenceStep[] {
  return [
    {
      step: 1,
      enabled: true,
      delayDays: 0,
      subject: '{prénom}, vos réservations des comparateurs au même endroit',
      body:
        'Bonjour {prénom},\n\n' +
        `Je vous écris au sujet de {parking}, près de l'aéroport {aéroport}. ${productName} réunit dans un seul outil les réservations ` +
        'de vos comparateurs (lues dans leurs mails de confirmation), le plan de votre parking et la navette du retour, ' +
        'avec le suivi des vols.\n\n' +
        `Vos clients peuvent aussi réserver et payer en ligne sur ${productName}.\n\n` +
        'Auriez-vous quinze minutes cette semaine pour que je vous le montre ?\n\n' +
        'Bien à vous,',
    },
    {
      step: 2,
      enabled: true,
      delayDays: 4,
      subject: 'Re : vos réservations au même endroit',
      body:
        'Bonjour {prénom},\n\n' +
        `Je me permets de revenir vers vous : ${productName} aide les parkings comme {parking} à ne plus recopier ` +
        "les réservations des comparateurs et à savoir à l'avance quand partir chercher chaque client au retour.\n\n" +
        'Un court échange vous conviendrait-il ?\n\n' +
        'Bien à vous,',
    },
    {
      step: 3,
      enabled: true,
      delayDays: 10,
      subject: 'Une démonstration de 15 minutes ?',
      body:
        'Bonjour {prénom},\n\n' +
        'Ce sera mon dernier message. Si le sujet vous intéresse un jour, il suffit de répondre à ce mail : je vous montrerai ' +
        `${productName} sur l'exemple de {parking}.\n\n` +
        'Bonne continuation,',
    },
  ];
}

const VARIABLE_RE = /\{([^{}\s]{1,20})\}/g;
const ALIASES: Record<string, VariableName> = {
  prénom: 'prénom',
  prenom: 'prénom',
  nom: 'nom',
  parking: 'parking',
  aéroport: 'aéroport',
  aeroport: 'aéroport',
  ville: 'ville',
};

/** The variables of a text that Plazo does not know (refused when the sequence is saved). */
export function unknownVariables(text: string): string[] {
  const unknown = new Set<string>();
  for (const match of text.matchAll(VARIABLE_RE)) {
    if (!ALIASES[match[1].toLowerCase()]) unknown.add(match[0]);
  }
  return [...unknown];
}

/**
 * Replaces the variables. An empty value leaves no stray mark behind: « Bonjour {prénom}, » without a first name gives
 * « Bonjour, ». Unknown variables stay as typed.
 */
export function renderTemplate(text: string, values: TemplateValues): string {
  const filled = text.replace(VARIABLE_RE, (whole, name: string) => {
    const key = ALIASES[name.toLowerCase()];
    return key ? values[key].trim() : whole;
  });
  return filled
    .split('\n')
    .map(line => line.replace(/[ \t]{2,}/g, ' ').replace(/ +,/g, ','))
    .join('\n');
}

/** A subject: one line, no punctuation left at its start by an empty variable, capital first letter. */
export function renderSubject(text: string, values: TemplateValues): string {
  const line = renderTemplate(text.replace(/[\r\n]+/g, ' '), values)
    .replace(/^[\s,;:.–-]+/, '')
    .trim();
  return line.charAt(0).toUpperCase() + line.slice(1);
}

export interface ProspectForTemplate {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  town: string | null;
  airportCode: string | null;
}

export function templateValues(prospect: ProspectForTemplate, airportName: string | null): TemplateValues {
  return {
    prénom: prospect.contactFirstName ?? '',
    nom: prospect.contactLastName ?? '',
    parking: prospect.companyName,
    aéroport: airportName ?? prospect.airportCode ?? '',
    ville: prospect.town ?? '',
  };
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export interface Publisher {
  name: string;
  legalForm: string;
  address: string;
  registration: string;
}

/** « Benford Tech, société par actions simplifiée, 910 729 102 RCS Vienne, 29 chemin des Collines… » (empty parts left out). */
export function publisherLine(company: Publisher): string {
  return [company.name, company.legalForm, company.registration, company.address].filter(Boolean).join(', ');
}

/**
 * The email itself: the step's text with its variables, then the footer every message carries (who writes, why the
 * reader gets it, how to never hear from Plazo again). The body is plain text; the HTML is that text, escaped.
 */
export function prospectEmail(input: {
  productName: string;
  company: Publisher;
  senderName: string;
  step: Pick<SequenceStep, 'subject' | 'body'>;
  values: TemplateValues;
  unsubscribeUrl: string;
}): EmailMessage {
  const subject = renderSubject(input.step.subject, input.values);
  const body = renderTemplate(input.step.body, input.values).trim();
  const signature = input.senderName.trim();
  const publisher = publisherLine(input.company);
  const why =
    `Vous recevez ce message à l'adresse professionnelle de ${input.values.parking}, parce que ${input.productName} ` +
    "s'adresse aux parkings proches des aéroports.";
  const who = publisher ? `${input.productName} est édité par ${publisher}.` : '';
  const stop = `Ne plus recevoir de messages de ${input.productName}`;

  const text = [body, signature, '--', why, who, `${stop} : ${input.unsubscribeUrl}`].filter(Boolean).join('\n\n');

  const paragraphs = body
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 14px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  const html =
    '<!doctype html><html lang="fr"><body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#1A1D1A">' +
    `<div style="max-width:600px">${paragraphs}` +
    (signature ? `<p style="margin:0 0 14px">${escapeHtml(signature)}</p>` : '') +
    '<hr style="border:0;border-top:1px solid #E4E6E2;margin:24px 0 12px">' +
    `<p style="margin:0 0 8px;font-size:12px;color:#6B7280">${escapeHtml(why)}${who ? ` ${escapeHtml(who)}` : ''}</p>` +
    `<p style="margin:0;font-size:12px"><a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#1E5E2E">${escapeHtml(stop)}</a></p>` +
    '</div></body></html>';
  return { subject, text, html };
}

// ---- Validation ----------------------------------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@<>(),;:"[\]]+@[^\s@<>(),;:"[\]]+\.[^\s@<>(),;:"[\]]{2,}$/;

export interface ProspectInput {
  companyName?: unknown;
  contactFirstName?: unknown;
  contactLastName?: unknown;
  email?: unknown;
  town?: unknown;
  airportCode?: unknown;
  phone?: unknown;
  notes?: unknown;
}

export interface ProspectFields {
  companyName: string;
  contactFirstName: string | null;
  contactLastName: string | null;
  email: string;
  town: string | null;
  airportCode: string | null;
  phone: string | null;
  notes: string | null;
}

const LIMITS: Record<keyof ProspectFields, number> = {
  companyName: 120,
  contactFirstName: 60,
  contactLastName: 60,
  email: 254,
  town: 80,
  airportCode: 10,
  phone: 30,
  notes: 1000,
};

export const normalizeProspectEmail = (email: string): string => email.trim().toLowerCase();

/** sha256 of the lower-cased address: the opt-out list keeps no address in clear. */
export function suppressionHash(email: string): string {
  return createHash('sha256').update(normalizeProspectEmail(email)).digest('hex');
}

/**
 * Checks one prospect, typed or from a CSV row (shared by the form, the import and its preview). `partial`: an update,
 * where an absent field stays as it is. Field codes: required, too_long, invalid_email, invalid_airport, invalid.
 */
export function validateProspect(
  input: ProspectInput,
  partial = false,
): { ok: true; value: Partial<ProspectFields> } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const value: Partial<ProspectFields> = {};
  const text = (key: keyof ProspectFields, required: boolean) => {
    const raw = input[key];
    if (raw === undefined && partial) return;
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      fields[key] = 'invalid';
      return;
    }
    // Notes keep their lines; every other field is one line.
    const clean = key === 'notes' ? (raw ?? '').trim() : (raw ?? '').replace(/\s+/g, ' ').trim();
    if (!clean) {
      if (required) fields[key] = 'required';
      else (value as Record<string, string | null>)[key] = null;
      return;
    }
    if (clean.length > LIMITS[key]) {
      fields[key] = 'too_long';
      return;
    }
    (value as Record<string, string | null>)[key] = clean;
  };
  text('companyName', true);
  text('contactFirstName', false);
  text('contactLastName', false);
  text('email', true);
  text('town', false);
  text('airportCode', false);
  text('phone', false);
  text('notes', false);
  if (typeof value.email === 'string') {
    value.email = normalizeProspectEmail(value.email);
    if (!EMAIL_RE.test(value.email)) fields.email = 'invalid_email';
  }
  if (typeof value.airportCode === 'string') {
    value.airportCode = value.airportCode.toUpperCase();
    if (!/^[A-Z]{3}$/.test(value.airportCode)) fields.airportCode = 'invalid_airport';
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, value };
}

/**
 * Checks the three steps and the daily cap of « Modifier les mails ». The first step is always on and leaves at J0;
 * the follow-ups come later, in order. Field codes as `steps.2.delayDays`: required, too_long, unknown_variable,
 * delay_range, delay_order; `dailyCap`: cap_range.
 */
export function validateSequence(
  steps: unknown,
  dailyCap: unknown,
): { ok: true; steps: SequenceStep[]; dailyCap: number } | { ok: false; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  if (!Number.isInteger(dailyCap) || (dailyCap as number) < 1 || (dailyCap as number) > MAX_DAILY_CAP) fields.dailyCap = 'cap_range';
  if (!Array.isArray(steps) || steps.length !== 3) {
    fields.steps = 'invalid';
    return { ok: false, fields };
  }
  const clean: SequenceStep[] = [];
  steps.forEach((raw, index) => {
    const n = (index + 1) as 1 | 2 | 3;
    const key = (field: string) => `steps.${n}.${field}`;
    const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const subject = typeof item.subject === 'string' ? item.subject.replace(/[\r\n]+/g, ' ').trim() : '';
    const body = typeof item.body === 'string' ? item.body.replace(/\r\n?/g, '\n').trim() : '';
    if (!subject) fields[key('subject')] = 'required';
    else if (subject.length > 150) fields[key('subject')] = 'too_long';
    else if (unknownVariables(subject).length) fields[key('subject')] = 'unknown_variable';
    if (!body) fields[key('body')] = 'required';
    else if (body.length > 5000) fields[key('body')] = 'too_long';
    else if (unknownVariables(body).length) fields[key('body')] = 'unknown_variable';
    const enabled = n === 1 ? true : item.enabled !== false;
    const delayDays = n === 1 ? 0 : item.delayDays;
    if (n > 1 && (!Number.isInteger(delayDays) || (delayDays as number) < 1 || (delayDays as number) > 90)) fields[key('delayDays')] = 'delay_range';
    clean.push({ step: n, enabled, delayDays: Number(delayDays), subject, body });
  });
  if (
    !fields['steps.2.delayDays'] &&
    !fields['steps.3.delayDays'] &&
    clean[1].enabled &&
    clean[2].enabled &&
    clean[2].delayDays <= clean[1].delayDays
  ) {
    fields['steps.3.delayDays'] = 'delay_order';
  }
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, steps: clean, dailyCap: dailyCap as number };
}

/** The steps saved in the database, or Plazo's texts when the value is missing or damaged. */
export function stepsOf(stored: unknown, productName: string): SequenceStep[] {
  const checked = validateSequence(stored, DEFAULT_DAILY_CAP);
  return checked.ok ? checked.steps : defaultSteps(productName);
}

// ---- When to send --------------------------------------------------------------------------------------------------

/** ISO weekday of a local date: 1 Monday … 7 Sunday. */
function isoWeekday(date: string): number {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Whether emails may leave at this instant: Monday to Friday, 09:00 to 18:00 in Paris. */
export function inSendingWindow(now: Date): boolean {
  const local = localDateTime(now, PROSPECTING_TZ);
  const time = local.slice(11);
  return isoWeekday(local.slice(0, 10)) <= 5 && time >= WINDOW_START && time < WINDOW_END;
}

/** The instant itself when inside the window, else the next opening (09:00 of the next working day). */
export function nextWindowStart(instant: Date): Date {
  if (inSendingWindow(instant)) return instant;
  const local = localDateTime(instant, PROSPECTING_TZ);
  let date = local.slice(0, 10);
  if (local.slice(11) >= WINDOW_START) date = addDays(date, 1);
  while (isoWeekday(date) > 5) date = addDays(date, 1);
  return parseInstant(`${date}T${WINDOW_START}`, PROSPECTING_TZ)!;
}

/** The next step to send after `sentStep` (0: none sent yet), skipping the steps turned off; null when the sequence is over. */
export function nextStep(steps: SequenceStep[], sentStep: number): SequenceStep | null {
  return steps.find(s => s.step > sentStep && s.enabled) ?? null;
}

/**
 * When a follow-up is due: `delayDays` after the first contact (J0), at the same local time, moved into the window.
 * Never before `notBefore` (the last send plus a day: a sequence edited after the fact does not send two emails at once).
 */
export function followUpDueAt(firstContactedAt: Date, delayDays: number, notBefore: Date): Date {
  const local = localDateTime(firstContactedAt, PROSPECTING_TZ);
  const due = parseInstant(`${addDays(local.slice(0, 10), delayDays)}${local.slice(10)}`, PROSPECTING_TZ)!;
  return nextWindowStart(due.getTime() < notBefore.getTime() ? notBefore : due);
}

/** Start of today in Paris: the daily cap counts the emails sent since then. */
export function capDayStart(now: Date): Date {
  return parseInstant(`${localDate(now, PROSPECTING_TZ)}T00:00`, PROSPECTING_TZ)!;
}

/** How many more emails may leave today. */
export function remainingToday(dailyCap: number, sentToday: number): number {
  return Math.max(0, dailyCap - sentToday);
}

/** The cut-off of the retention: a prospect last contacted (or created, if never contacted) before it is deleted. */
export function retentionCutoff(now: Date): Date {
  const cutoff = new Date(now);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS);
  return cutoff;
}
