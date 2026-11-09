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

/** Our webhook ids at the gateway (a POST with the same id replaces it): one per event, at most 36 characters. */
export function smsWebhookId(event: SmsWebhookEvent): string {
  return `plazo-${event.replace('sms:', '')}`;
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
