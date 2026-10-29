/**
 * 29/10/2026 (« récupère le mail du passager au lieu de celui du comparateur »): the traveller's own address, never the
 * comparator's. A comparator's confirmation, a forwarded mail or an exported file often carries the comparator's
 * address (noreply@onepark.fr, reservation@allopark.com, a relay address) next to or instead of the traveller's:
 * such an address is never kept as the booking's e-mail, so the day-before mail and « Ma réservation » reach the traveller.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Words that name a comparator or a booking platform in a domain (allopark.com, mail.onepark.co, parkos.fr…). */
const PLATFORM_DOMAIN_WORDS = [
  'allopark',
  'onepark',
  'parclick',
  'parkmundo',
  'parkvia',
  'parkhit',
  'parkos',
  'zenpark',
  'parkingsdirect',
  'looking4parking',
  'holidayextras',
  'travelcar',
  'blablacar',
  'opngo',
  'yespark',
];

/** Mailboxes nobody reads: a robot's sender address, wherever it is hosted. */
const ROBOT_LOCAL = /^(no-?reply|do-?not-?reply|ne-?pas-?repondre|nepasrepondre|mailer-daemon|postmaster|notifications?|bounces?)([+._-]|$)/;

const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s-]/g, '');

/** The address lowercased when it can be the traveller's own; null for a comparator's, a robot's or a malformed one. */
export function travellerEmail(raw: string | null | undefined, excludedDomains: string[] = []): string | null {
  const email = (raw ?? '')
    .trim()
    .replace(/^mailto:/i, '')
    .toLowerCase();
  if (!email || email.length > 200 || !EMAIL.test(email)) return null;
  const at = email.lastIndexOf('@');
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (ROBOT_LOCAL.test(local)) return null;
  const folded = fold(domain);
  if (PLATFORM_DOMAIN_WORDS.some(word => folded.includes(word))) return null;
  const excluded = excludedDomains.map(d => d.trim().toLowerCase()).filter(Boolean);
  if (excluded.some(d => domain === d || domain.endsWith(`.${d}`))) return null;
  return email;
}

/** The first address of the text that can be the traveller's, after an « E-mail : » label when the text has one. */
export function travellerEmailIn(text: string): string | undefined {
  const labelled = [...text.matchAll(/E-?mail\s*(?:du client|client)?\s*:?\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/gi)].map(m => m[1]);
  for (const candidate of labelled) {
    const email = travellerEmail(candidate);
    if (email) return email;
  }
  return undefined;
}
