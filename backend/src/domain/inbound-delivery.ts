/**
 * 14/10/2026 (« C puis A »): how a booking email reached the Plazo address, for the comparators' table of the Mails
 * entrants block (C) and the setup wizard (A).
 *
 * - `direct`: the comparator wrote to the Plazo address itself (it is in the email's To or Cc, the sender is the
 *   comparator): nothing to set in the parking's mailbox.
 * - `forwarded`: a rule of the parking's mailbox sent it on (Gmail's X-Forwarded-To / X-Forwarded-For, Exchange's
 *   X-MS-Exchange-Inbox-Rules-Loop, Resent-* headers), or the Plazo address is only in the envelope (a redirect that
 *   keeps the original headers).
 * - `manual`: someone forwarded it by hand (the Plazo address in To, no rule's header, the sender is not a comparator).
 */
export type Delivery = 'direct' | 'forwarded' | 'manual';

export interface MailHeader {
  key: string;
  value: string;
}

/** The headers a mail service adds when one of its rules forwards or redirects an email (lower case). */
const AUTO_FORWARD_HEADERS = ['x-forwarded-to', 'x-forwarded-for', 'x-ms-exchange-inbox-rules-loop', 'resent-to', 'resent-from'];

/** True when a rule of a mailbox sent the email on (never a forward made by hand, which is a new email). */
export function isAutoForwarded(headers: MailHeader[]): boolean {
  return headers.some(
    h => AUTO_FORWARD_HEADERS.includes(h.key.toLowerCase()) || (h.key.toLowerCase() === 'auto-submitted' && /auto-forwarded/i.test(h.value)),
  );
}

export function deliveryOf(input: {
  /** A rule's header was seen (undefined: the headers are unknown, the former JSON payload). */
  autoForwarded: boolean | undefined;
  /** The email's own To and Cc, lower-cased. */
  headerRecipients: string[];
  inboundDomain: string;
  fromIsComparator: boolean;
}): Delivery {
  if (input.autoForwarded) return 'forwarded';
  const suffix = `@${input.inboundDomain.toLowerCase()}`;
  if (!input.headerRecipients.some(a => a.endsWith(suffix))) return 'forwarded';
  return input.fromIsComparator ? 'direct' : 'manual';
}

/**
 * Words of a booking email (a comparator's confirmation, change or cancellation): an email forwarded by a rule that
 * has none of them, from a sender that is not a comparator, is one of the parking's own emails sent on by a too-wide
 * rule (« transférer une copie de tous les e-mails »). It is then set aside without its content (A, 14/10/2026); any
 * email with one of these words goes through the usual reading.
 */
const BOOKING_WORDS = /r[ée]serv|booking|parking|stationnement|voucher|navette|parc\b|park/i;

export function looksLikeBooking(subject: string | null, text: string): boolean {
  return BOOKING_WORDS.test(subject ?? '') || BOOKING_WORDS.test(text);
}
