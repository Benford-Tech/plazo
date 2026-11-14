import { createHmac, timingSafeEqual } from 'crypto';

/**
 * 09/11/2026 (« faudrait communiquer avec sms gateway »): the SMS app tells Plazo itself when an SMS left the phone,
 * reached the traveller or failed (webhooks of capcom6/android-sms-gateway), instead of Plazo asking every 15 minutes.
 * The Cloud server does not sign its deliveries (its `signing_key` is for the local server only), so each operator has
 * its own secret address: /public/sms-gateway/webhook/<operatorId>.<check>, check = HMAC of SECRET_KEY on the id.
 * Plazo never trusts the body alone: it reads the message's state again at the gateway when it answers.
 */

export const SMS_WEBHOOK_EVENTS = ['sms:sent', 'sms:delivered', 'sms:failed'] as const;
export type SmsWebhookEvent = (typeof SMS_WEBHOOK_EVENTS)[number];

/**
 * 14/11/2026 (« faudrait que les sms écrits au numéro du parking arrivent sur la messagerie de Plazo »): the phone also
 * tells Plazo of each SMS it receives, which lands in the parking's « Messages ».
 */
export const SMS_RECEIVED_EVENT = 'sms:received';
/**
 * 14/11/2026 (« souvent le téléphone est marqué comme hors ligne alors que non »): the app's own ping, sent by the phone
 * every 5 minutes, also reaches Plazo, so that a phone the gateway saw late is still known to be alive.
 */
export const SMS_PING_EVENT = 'system:ping';
/** Every event Plazo registers at the gateway. */
export const SMS_REGISTERED_EVENTS = [...SMS_WEBHOOK_EVENTS, SMS_RECEIVED_EVENT, SMS_PING_EVENT] as const;
export type SmsRegisteredEvent = (typeof SMS_REGISTERED_EVENTS)[number];

/** Our webhook ids at the gateway (a POST with the same id replaces it): one per event, at most 36 characters. */
export function smsWebhookId(event: SmsRegisteredEvent): string {
  return `plazo-${event.replace(/^(sms|system):/, '')}`;
}

/** A call of the phone for one of our events (a sign of life, whatever the event). */
export function isGatewayEvent(body: unknown): boolean {
  if (!body || typeof body !== 'object') return false;
  return (SMS_REGISTERED_EVENTS as readonly string[]).includes((body as Record<string, unknown>).event as string);
}

const CHECK_LENGTH = 24;

function check(operatorId: string, secretKey: string): string {
  return createHmac('sha256', secretKey).update(`plazo-sms-webhook-v1:${operatorId}`).digest('base64url').slice(0, CHECK_LENGTH);
}

export function smsWebhookToken(operatorId: string, secretKey: string): string {
  return `${operatorId}.${check(operatorId, secretKey)}`;
}

/** The operator a token belongs to, or null when it is not one of ours. */
export function operatorOfSmsWebhookToken(token: string, secretKey: string): string | null {
  if (!secretKey || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const operatorId = token.slice(0, dot);
  if (!/^[a-z0-9]{10,40}$/i.test(operatorId)) return null;
  const expected = Buffer.from(check(operatorId, secretKey));
  const received = Buffer.from(token.slice(dot + 1));
  return expected.length === received.length && timingSafeEqual(expected, received) ? operatorId : null;
}

export interface SmsWebhookDelivery {
  event: SmsWebhookEvent;
  messageId: string;
}

/** The event and the message it is about, or null for anything else (pings, received SMS, a malformed body). */
export function parseSmsWebhook(body: unknown): SmsWebhookDelivery | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as Record<string, any>;
  const event = data.event;
  if (!SMS_WEBHOOK_EVENTS.includes(event)) return null;
  const messageId = data.payload?.messageId ?? data.payload?.id;
  if (typeof messageId !== 'string' || !messageId || messageId.length > 100) return null;
  return { event, messageId };
}

/** An SMS the parking's phone received. */
export interface ReceivedSms {
  /** The gateway's id of the message (Plazo stores it once). */
  messageId: string;
  /** The sender, as the phone gives it (« +33612345678 »). */
  from: string;
  text: string;
  at: Date;
}

/** The longest SMS text kept (a long SMS arrives as one message). */
export const RECEIVED_SMS_MAX_LENGTH = 4096;

/** An `sms:received` event, or null for anything else. */
export function parseReceivedSms(body: unknown, now = new Date()): ReceivedSms | null {
  if (!body || typeof body !== 'object') return null;
  const data = body as Record<string, any>;
  if (data.event !== SMS_RECEIVED_EVENT) return null;
  const payload = data.payload;
  if (!payload || typeof payload !== 'object') return null;
  const id = payload.messageId ?? payload.id ?? data.id;
  const from = payload.phoneNumber ?? payload.sender ?? payload.from;
  const text = payload.message ?? payload.text;
  if (typeof id !== 'string' || !id || id.length > 100) return null;
  if (typeof from !== 'string' || !/^\+?\d[\d\s().-]{5,24}$/.test(from.trim())) return null;
  if (typeof text !== 'string' || !text.trim()) return null;
  const received = typeof payload.receivedAt === 'string' ? new Date(payload.receivedAt) : null;
  const at = received && !Number.isNaN(received.getTime()) && received.getTime() <= now.getTime() + 5 * 60000 ? received : now;
  return { messageId: id, from: from.trim(), text: text.replace(/\r\n?/g, '\n').trim().slice(0, RECEIVED_SMS_MAX_LENGTH), at };
}
