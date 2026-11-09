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

/** The 16 parameters of the day-before template: each on one line, never empty (Meta refuses it: « - »). */
export function reminderTemplateParams(values: Record<(typeof REMINDER_TEMPLATE_VARIABLES)[number], string>): string[] {
  return REMINDER_TEMPLATE_VARIABLES.map(key => whatsappParam(values[key] ?? '', key === 'consignes' || key === 'services' ? 400 : 200));
}

/** A photo Meta can fetch for an image header: an https address (JPEG or PNG, 5 MB at most, checked by Meta). */
export function whatsappImage(url: string | null | undefined): string | null {
  const value = url?.trim();
  return value && /^https:\/\/\S+$/i.test(value) ? value : null;
}
