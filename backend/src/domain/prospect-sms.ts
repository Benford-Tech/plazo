/**
 * Prospecting SMS (19/11/2026, « pouvoir envoyer un sms de prospection », choix C): one text sent to the prospects chosen
 * with the filters of Plateforme › Prospection, each with its own variables. Through Brevo, as Plazo, mobiles only (the
 * countries of smsRecipient), in the emails' window (Monday to Friday, 09:00 to 18:00 in Paris), under a daily cap.
 */
import { smsLength } from './day-before-sms';
import { smsRecipient } from './phone';
import { ProspectStatusName, unknownVariables } from './prospecting';

/** Three SMS at most (GSM-7: 459 characters). */
export const PROSPECT_SMS_MAX_SEGMENTS = 3;
export const PROSPECT_SMS_MAX_LENGTH = 480;
/** SMS that may leave a day (Paris), every send counted. */
export const PROSPECT_SMS_DAILY_CAP = 200;
/** Prospects in one send. */
export const PROSPECT_SMS_MAX_IDS = 500;
/** A prospect gets one prospecting SMS a week at most. */
export const PROSPECT_SMS_GAP_DAYS = 7;

export const DEFAULT_PROSPECT_SMS =
  "Bonjour, c'est Joanny de Plazo. Plazo Pro range les réservations des comparateurs, la navette et les clés de {parking} dans une seule app. Démo : {lien_demo}";

export type SmsSkipReason = 'unsubscribed' | 'no_phone' | 'not_mobile' | 'recent' | 'closed';

export interface SmsCandidate {
  phone: string | null;
  status: ProspectStatusName;
  lastSmsAt: Date | null;
  suppressed: boolean;
}

/** The number to send to, or why this prospect gets no SMS. */
export function smsTarget(prospect: SmsCandidate, now: Date): { to: string } | { skip: SmsSkipReason } {
  if (prospect.suppressed || prospect.status === 'unsubscribed') return { skip: 'unsubscribed' };
  if (prospect.status === 'not_interested') return { skip: 'closed' };
  if (!prospect.phone?.trim()) return { skip: 'no_phone' };
  const to = smsRecipient(prospect.phone);
  if (!to) return { skip: 'not_mobile' };
  if (prospect.lastSmsAt && now.getTime() - prospect.lastSmsAt.getTime() < PROSPECT_SMS_GAP_DAYS * 86400000) return { skip: 'recent' };
  return { to };
}

/** The text as typed: required, the known variables only, three SMS at most once filled with a sample. */
export function validateSmsText(text: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof text !== 'string' || !text.trim()) return { ok: false, error: 'required' };
  const value = text.trim().replace(/\r\n?/g, '\n');
  if (value.length > PROSPECT_SMS_MAX_LENGTH) return { ok: false, error: 'too_long' };
  if (unknownVariables(value).length) return { ok: false, error: 'unknown_variable' };
  return { ok: true, value };
}

/** Whether a filled text fits in the allowed number of SMS. */
export function smsFits(filled: string): boolean {
  return smsLength(filled).segments <= PROSPECT_SMS_MAX_SEGMENTS;
}
