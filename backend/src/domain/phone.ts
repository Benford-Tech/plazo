/**
 * Number to send an SMS to, in international format ("+33612345678"), or null when no SMS is sent.
 * Only French mobiles (06, 07, typed nationally or as +33 / 0033) get one: anyone can book with
 * any number, so SMS to other countries would let a script run up the SMS bill (SMS pumping to
 * premium international ranges). Travellers with another number still get the email.
 */
export function smsRecipient(phone: string): string | null {
  let digits = phone.replace(/\(0\)/g, '').replace(/[\s.()-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^0[67]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (digits.startsWith('+33')) {
    const national = digits.slice(3).replace(/^0/, '');
    return /^[67]\d{8}$/.test(national) ? `+33${national}` : null;
  }
  return null;
}
