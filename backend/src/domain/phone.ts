/** National digits of the 06 39 98 xx xx range kept for fiction (without the leading 0). */
const FICTION_RANGE = /^63998\d{4}$/;

/**
 * International codes that are not a country's mobiles: shared, satellite and premium ranges (+800 freephone, +808,
 * +870 Inmarsat, +878, +881 to +883 satellite and international networks, +888, +979 premium rate, +991). An SMS there
 * is the classic SMS pumping target.
 */
const NON_COUNTRY_CODES = /^(800|808|870|878|881|882|883|888|979|991)/;

/**
 * Number to send an SMS to, in international format ("+33612345678"), or null when no SMS is sent.
 * French numbers: mobiles only (06, 07, typed nationally or as +33 / 0033). 14/11/2026 (« Envoie le sms même si le numéro
 * est étranger »): a foreign number written with its country code (+32 470…, 0044 7911…) gets its SMS too, 8 to 15
 * digits, never a shared, satellite or premium range (NON_COUNTRY_CODES). A number typed without its country code and
 * not French cannot be told apart, so it gets none. Booking on Plazo is paid first, which keeps SMS pumping costly.
 */
export function smsRecipient(phone: string): string | null {
  let digits = phone.replace(/\(0\)/g, '').replace(/[\s.()-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  let national: string | null = null;
  if (/^0[67]\d{8}$/.test(digits)) national = digits.slice(1);
  else if (digits.startsWith('+33')) national = digits.slice(3).replace(/^0/, '');
  else if (/^\+[1-9]\d{7,14}$/.test(digits)) return NON_COUNTRY_CODES.test(digits.slice(1)) ? null : digits;
  if (!national || !/^[67]\d{8}$/.test(national)) return null;
  // 15/10/2026: 06 39 98 xx xx is the range kept for fiction (the test operator's fictional travellers, TS-1xx and
  // TS-2xx): never an SMS, whatever the path (day-before reminder, landing, test send).
  if (FICTION_RANGE.test(national)) return null;
  return `+33${national}`;
}

/** « 07 21 17 75 90 » for a French number typed as +33…, 0033… or 0…; any other number as typed. */
export function displayPhone(phone: string): string {
  const raw = phone.trim();
  let digits = raw.replace(/\(0\)/g, '').replace(/[\s.()-]/g, '');
  if (digits.startsWith('0033')) digits = `+33${digits.slice(4)}`;
  if (digits.startsWith('+33')) digits = `0${digits.slice(3).replace(/^0/, '')}`;
  return /^0[1-9]\d{8}$/.test(digits) ? digits.replace(/(\d{2})(?=\d)/g, '$1 ') : raw;
}
