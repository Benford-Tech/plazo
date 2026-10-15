/** National digits of the 06 39 98 xx xx range kept for fiction (without the leading 0). */
const FICTION_RANGE = /^63998\d{4}$/;

/**
 * Number to send an SMS to, in international format ("+33612345678"), or null when no SMS is sent.
 * Only French mobiles (06, 07, typed nationally or as +33 / 0033) get one: anyone can book with
 * any number, so SMS to other countries would let a script run up the SMS bill (SMS pumping to
 * premium international ranges). Travellers with another number still get the email.
 */
export function smsRecipient(phone: string): string | null {
  let digits = phone.replace(/\(0\)/g, '').replace(/[\s.()-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  let national: string | null = null;
  if (/^0[67]\d{8}$/.test(digits)) national = digits.slice(1);
  else if (digits.startsWith('+33')) national = digits.slice(3).replace(/^0/, '');
  if (!national || !/^[67]\d{8}$/.test(national)) return null;
  // 15/10/2026: 06 39 98 xx xx is the range kept for fiction (the test operator's fictional travellers, TS-1xx and
  // TS-2xx): never an SMS, whatever the path (day-before reminder, landing, test send).
  if (FICTION_RANGE.test(national)) return null;
  return `+33${national}`;
}
