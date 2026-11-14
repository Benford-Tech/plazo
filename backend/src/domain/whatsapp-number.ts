import { createHmac } from 'crypto';

/**
 * 14/11/2026 (« Un compte WhatsApp Business par parking », chemin 1): each parking may get its own WhatsApp number on
 * Benford Tech's WhatsApp Business account. The display name is always « Plazo » (« le nom affiché est toujours Plazo »);
 * Meta bills Benford Tech. Messages leave from the parking's number only once it is `active`; any other state keeps
 * Plazo's number, as before.
 */
export const WHATSAPP_NUMBER_STATUSES = ['requested', 'added', 'code_sent', 'registered', 'active', 'paused'] as const;
export type WhatsappNumberStatus = (typeof WHATSAPP_NUMBER_STATUSES)[number];

/** The display name every parking's number carries. */
export const WHATSAPP_DISPLAY_NAME = 'Plazo';

/** Country calling codes Plazo's parkings use (France first), longest first so « 352 » wins over « 35 ». */
const COUNTRY_CODES = [
  '420',
  '352',
  '351',
  '353',
  '358',
  '372',
  '33',
  '32',
  '41',
  '49',
  '43',
  '34',
  '39',
  '44',
  '31',
  '48',
  '40',
  '36',
  '30',
  '45',
  '46',
  '47',
  '1',
];

/**
 * A number as Meta wants it to add it: its country code and national digits. French numbers may be typed nationally
 * (« 06 39 98 12 40 »); any other one with its « + » or « 00 ». Null when it cannot be read.
 */
export function splitPhone(raw: string): { cc: string; national: string; e164: string } | null {
  let digits = raw.replace(/\(0\)/g, '').replace(/[\s.()/-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^0[1-9]\d{8}$/.test(digits)) digits = `+33${digits.slice(1)}`;
  if (!/^\+\d{8,15}$/.test(digits)) return null;
  const all = digits.slice(1);
  const cc = COUNTRY_CODES.find(code => all.startsWith(code));
  if (!cc) return null;
  const national = all.slice(cc.length).replace(/^0/, '');
  if (national.length < 6) return null;
  return { cc, national, e164: `+${cc}${national}` };
}

/**
 * The six-digit two-step PIN Meta asks when a number is registered: derived from SECRET_KEY and the number's id, so the
 * same PIN is found again (re-registration) without being stored anywhere.
 */
export function registrationPin(secret: string, phoneNumberId: string): string {
  const digest = createHmac('sha256', secret).update(`whatsapp-pin:${phoneNumberId}`).digest();
  return String(digest.readUInt32BE(0) % 1_000_000).padStart(6, '0');
}

/** Meta lets a number send once its display name is approved (or needs no review) and the number is connected. */
export function readyToSend(meta: { nameStatus: string | null; metaStatus: string | null }): boolean {
  const name = (meta.nameStatus ?? '').toUpperCase();
  const status = (meta.metaStatus ?? '').toUpperCase();
  return (name === 'APPROVED' || name === 'AVAILABLE_WITHOUT_REVIEW') && (status === 'CONNECTED' || status === '');
}

/** The state after Meta's view was read: a registered number becomes active when ready; nothing else moves by itself. */
export function statusAfterCheck(
  current: WhatsappNumberStatus,
  meta: { nameStatus: string | null; metaStatus: string | null },
): WhatsappNumberStatus {
  if (current === 'registered' && readyToSend(meta)) return 'active';
  return current;
}
