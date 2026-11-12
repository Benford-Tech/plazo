import { createHmac, timingSafeEqual } from 'crypto';

/**
 * « Plazo envoie par WhatsApp », SMS en repli (03/11/2026): the pure rules of the WhatsApp messages to travellers, sent
 * from Plazo's WhatsApp Business number through Meta's Cloud API.
 */

/** The traveller messages that go by WhatsApp first; the others (tests, signature codes) stay SMS. */
export const WHATSAPP_KINDS = ['booking_confirmed', 'booking_reminder', 'flight_landed'] as const;
export const isWhatsappKind = (kind: string) => (WHATSAPP_KINDS as readonly string[]).includes(kind);

/** A message Meta has not delivered after this long falls back to SMS (the traveller has no WhatsApp, or no network). */
export const WHATSAPP_FALLBACK_AFTER_MS = 5 * 60 * 1000;
/** The fallback text is never kept longer than this: past it, an SMS would come too late to help. */
export const WHATSAPP_TEXT_TTL_MS = 2 * 60 * 60 * 1000;
/** Rows (number, status, no text) are purged after this many days. */
export const WHATSAPP_RETENTION_DAYS = 30;

export type WhatsappStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'fallback';

/**
 * A template variable: Meta refuses new lines, tabs and runs of spaces in a parameter, so the SMS text is put on one line
 * (its line breaks become « · » between sentences). Cut to `max` characters.
 */
export function whatsappParam(text: string, max = 900): string {
  const line = text
    .split(/\r?\n+/)
    .map(part => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' · ');
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line || '-';
}

/**
 * The common template `plazo_message` as the traveller reads it (12/11/2026, shown in the WhatsApp inbox): « Message de
 * {{1}} pour votre réservation {{2}} : », the text on one line, then Plazo's thanks.
 */
export function genericMessageText(parking: string, reference: string, text: string): string {
  return `Message de ${parking} pour votre réservation ${reference} :\n${whatsappParam(text)}\nMerci d'avoir choisi votre parking avec Plazo.`;
}

/** Meta wants the number in international form without « + »: +33612345678 → 33612345678. */
export const whatsappRecipient = (e164: string) => e164.replace(/^\+/, '');

/** The webhook's signature: X-Hub-Signature-256 = « sha256= » + HMAC-SHA256 of the raw body with the app secret. */
export function validWhatsappSignature(raw: Buffer, header: string | undefined, appSecret: string): boolean {
  if (!appSecret || !header?.startsWith('sha256=')) return false;
  const expected = Buffer.from(createHmac('sha256', appSecret).update(raw).digest('hex'), 'utf8');
  const given = Buffer.from(header.slice(7), 'utf8');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export interface WhatsappStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  errorCode: string | null;
}

/** The status updates of a webhook delivery (entry[].changes[].value.statuses[]); incoming messages are left aside. */
export function statusUpdatesOf(payload: unknown): WhatsappStatusUpdate[] {
  const updates: WhatsappStatusUpdate[] = [];
  const entries = (payload as any)?.entry;
  if (!Array.isArray(entries)) return updates;
  for (const entry of entries) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      for (const status of Array.isArray(change?.value?.statuses) ? change.value.statuses : []) {
        const id = typeof status?.id === 'string' ? status.id : '';
        const value = status?.status;
        if (!id || !['sent', 'delivered', 'read', 'failed'].includes(value)) continue;
        const code = Array.isArray(status.errors) ? status.errors[0]?.code : undefined;
        updates.push({ id, status: value, errorCode: code === undefined || code === null ? null : `meta_${String(code).slice(0, 20)}` });
      }
    }
  }
  return updates;
}

const RANK: Record<WhatsappStatus, number> = { sent: 0, delivered: 1, read: 2, failed: 1, fallback: 3 };

/**
 * The status a message takes on an update: only forward (Meta's deliveries can arrive out of order), a failure only
 * before delivery, nothing after the SMS fallback.
 */
export function nextWhatsappStatus(current: WhatsappStatus, incoming: WhatsappStatusUpdate['status']): WhatsappStatus {
  if (current === 'fallback' || current === 'failed') return current;
  if (incoming === 'failed') return current === 'sent' ? 'failed' : current;
  return RANK[incoming] > RANK[current] ? incoming : current;
}

/**
 * 09/11/2026: the variables of the day-before template ({{1}} to {{16}}), in their order: the text approved by Meta reads
 * « Bonsoir {{1}}, Suite à votre réservation {{2}}, … le {{3}} à {{4}} (véhicule {{5}}) … {{6}} … {{7}}, {{8}} … le {{9}}
 * (vol {{10}}) … {{11}} {{12}} … ({{13}}) … {{14}} … {{15}} … {{16}} ».
 */
export const REMINDER_TEMPLATE_VARIABLES = [
  'prénom',
  'référence',
  'date',
  'heure',
  'plaque',
  'lien',
  'parking',
  'adresse',
  'retour',
  'vol',
  'rendez-vous',
  'consignes',
  'navette',
  'services',
  'téléphone',
  'parking',
] as const;

/**
 * 11/11/2026 (« le message de la veille doit se baser sur le modèle défini chez Meta », choice B): the body of the
 * day-before template as approved by Meta (plazo_rappel_veille, apl_rappel_veille), word for word; with WhatsApp on, the
 * fallback SMS is this text too, so the traveller reads the same message whichever channel carries it. To change it, the
 * template is approved again at Meta first, then this text follows.
 */
export const REMINDER_TEMPLATE_BODY = [
  'Bonsoir {{1}},',
  '',
  'Suite à votre réservation {{2}}, nous vous confirmons votre prise en charge le {{3}} à {{4}} (véhicule {{5}}).',
  '',
  "📲 Votre réservation dans l'app Plazo : {{6}}",
  'Navette en direct, rendez-vous au retour et vos documents.',
  '',
  '📍 Adresse du parking : {{7}}, {{8}}',
  "🔑 Remise des clés à l'arrivée",
  '',
  '🛬 Votre retour le {{9}} (vol {{10}}) :',
  "Envoyez-nous un message à l'atterrissage, puis une fois sorti(e) de l'aéroport.",
  '📍 Point de rendez-vous : {{11}}',
  '{{12}}',
  'Nous venons vous chercher en navette ({{13}}).',
  '',
  '✨ Services sur demande : {{14}}',
  '',
  '📞 Parking : {{15}}',
  '',
  'À demain,',
  '{{16}}',
  "Merci d'avoir choisi votre parking avec Plazo.",
].join('\n');

/**
 * 11/11/2026 (« variabilise au max… c'est un message générique »): Plazo's generic day-before template, from APL Parking
 * Lyon's own message, every detail of the parking a variable (17 values, the parking's name twice).
 */
export const GENERIC_REMINDER_TEMPLATE = 'plazo_message_veille';
export const GENERIC_REMINDER_VARIABLES = [
  'prénom',
  'référence',
  'date',
  'heure',
  'plaque',
  'parking',
  'adresse',
  'horaires',
  'rendez-vous',
  'consignes',
  'gps',
  'navette',
  'conditions',
  'services',
  'téléphone',
  'chauffeur',
  'parking',
] as const;
export const GENERIC_REMINDER_BODY = [
  'Bonsoir {{1}},',
  '',
  'Suite à votre réservation {{2}}, nous vous confirmons votre prise en charge le {{3}} à {{4}} (véhicule {{5}}).',
  '',
  '📍 Adresse du parking :',
  '{{6}}',
  '{{7}}',
  '',
  "🔑 Remise des clés à l'arrivée",
  '',
  '🚗 Accès : {{8}}',
  '',
  '🔑 Pour votre retour (navette) :',
  'Merci de nous envoyer 2 messages :',
  "• À l'atterrissage",
  "• Une fois sorti(e) de l'aéroport",
  '',
  '📍 Point de rendez-vous pour le retour : {{9}}',
  '{{10}}',
  'Coordonnées GPS : {{11}}',
  '',
  'Nous vous récupérons ensuite rapidement (navette {{12}}).',
  '',
  "📸 La photo de l'entrée du parking est en haut de ce message.",
  '',
  '⏱️ Conditions : {{13}}',
  '',
  '✨ Services sur demande : {{14}}',
  '',
  '📞 Service client (réservations et informations) : {{15}}',
  '🚐 Chauffeur, le jour de votre rendez-vous : {{16}}',
  '',
  'Cordialement,',
  '{{17}}',
  "Merci d'avoir choisi votre parking avec Plazo.",
].join('\n');

type ReminderVariable = (typeof REMINDER_TEMPLATE_VARIABLES)[number] | (typeof GENERIC_REMINDER_VARIABLES)[number];

/** The order of a day-before template's numbered variables: the generic one's, else the 16 of the first templates. */
export function reminderLayout(name: string | null | undefined): readonly ReminderVariable[] {
  return name === GENERIC_REMINDER_TEMPLATE ? GENERIC_REMINDER_VARIABLES : REMINDER_TEMPLATE_VARIABLES;
}

/** Plazo's copy of a day-before template's body, when Meta's cannot be read. */
export function reminderBodyCopy(name: string | null | undefined): string {
  return name === GENERIC_REMINDER_TEMPLATE ? GENERIC_REMINDER_BODY : REMINDER_TEMPLATE_BODY;
}

/**
 * The template's body with the day-before variables' names (« Bonsoir {prénom}, … »), as the page and the SMS read it:
 * the body read at Meta (11/11/2026), else Plazo's copy; the numbers follow the template's own order.
 */
export function reminderTemplateText(body?: string | null, name?: string | null): string {
  const layout = reminderLayout(name);
  return (body ?? reminderBodyCopy(name)).replace(/\{\{(\d+)\}\}/g, (whole, n: string) => {
    const variable = layout[Number(n) - 1];
    return variable ? `{${variable}}` : whole;
  });
}

/** The parameters of a day-before template, in its order: each on one line, never empty (Meta refuses it: « - »). */
export function reminderTemplateParams(values: Record<ReminderVariable, string>, name?: string | null): string[] {
  const long = new Set(['consignes', 'services', 'conditions']);
  return reminderLayout(name).map(key => whatsappParam(values[key] ?? '', long.has(key) ? 400 : 200));
}

/**
 * The header photo of the day-before message (10/11/2026): the message is about tomorrow's drop-off, so the parking's own
 * photo (the first of its listing: its entrance) comes first; the photo of the return meeting point only when the listing
 * has none. Null when neither is at an https address.
 */
export function reminderImage(listingPhotos: string[] | null | undefined, returnMeetingPhotoUrl: string | null | undefined): string | null {
  return whatsappImage(listingPhotos?.[0]) ?? whatsappImage(returnMeetingPhotoUrl);
}

/** A photo Meta can fetch for an image header: an https address (JPEG or PNG, 5 MB at most, checked by Meta). */
export function whatsappImage(url: string | null | undefined): string | null {
  const value = url?.trim();
  return value && /^https:\/\/\S+$/i.test(value) ? value : null;
}

/**
 * A parking's own template (09/11/2026, APL Parking Lyon's day-before message with the photo of its entrance): for one
 * operator and one message kind, Plazo sends this approved template instead of `plazo_message`, with an image header
 * when `image` is given and the body variables in `params` order. Read from WHATSAPP_TEMPLATES (JSON array, no secret);
 * `operator` is the operator's id or the slug of its inbound address (<slug>@plazo.fr).
 */
export const TEMPLATE_PARAMS = ['firstName', 'arrivalDate', 'arrivalTime', 'parking', 'reference', 'text'] as const;
export type TemplateParam = (typeof TEMPLATE_PARAMS)[number];

export interface WhatsappTemplateRule {
  operator: string;
  kind: string;
  name: string;
  language: string | null;
  image: string | null;
  params: TemplateParam[];
}

/** The rules of WHATSAPP_TEMPLATES; a malformed entry is left out (the message then goes with `plazo_message`). */
export function parseTemplateRules(raw: string): WhatsappTemplateRule[] {
  if (!raw.trim()) return [];
  let list: unknown;
  try {
    list = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(list)) return [];
  const rules: WhatsappTemplateRule[] = [];
  for (const item of list) {
    const operator = typeof item?.operator === 'string' ? item.operator.trim() : '';
    const kind = typeof item?.kind === 'string' ? item.kind.trim() : '';
    const name = typeof item?.name === 'string' ? item.name.trim() : '';
    const params = Array.isArray(item?.params) ? item.params : [];
    const image = typeof item?.image === 'string' && /^https:\/\/\S+$/.test(item.image.trim()) ? item.image.trim() : null;
    if (!operator || !isWhatsappKind(kind) || !/^[a-z0-9_]{1,512}$/.test(name)) continue;
    if (!params.every((p: unknown) => (TEMPLATE_PARAMS as readonly unknown[]).includes(p))) continue;
    const language = typeof item?.language === 'string' && item.language.trim() ? item.language.trim() : null;
    rules.push({ operator, kind, name, language, image, params });
  }
  return rules;
}

/** The rule of this operator (by id or inbound slug) for this kind, if any. */
export function templateRuleFor(
  rules: WhatsappTemplateRule[],
  operator: { id: string; inboundSlug: string | null },
  kind: string,
): WhatsappTemplateRule | null {
  return rules.find(r => r.kind === kind && (r.operator === operator.id || (!!operator.inboundSlug && r.operator === operator.inboundSlug))) ?? null;
}

/** « mardi 10 novembre », local to the parking. */
export function arrivalDateLabel(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone, weekday: 'long', day: 'numeric', month: 'long' }).format(at);
}

/** « 06:30 », local to the parking. */
export function arrivalTimeLabel(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(at);
}
