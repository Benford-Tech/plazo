/**
 * M-A (06/10/2026): confirmation emails forwarded by the operator's mailbox to their Plazo inbound
 * address, delivered by the Cloudflare Email Routing relay (email-worker/; Brevo's inbound parsing before 08/10/2026,
 * same payload). Pure helpers: payload reading, text.
 */

export interface InboundAddress {
  Name?: string | null;
  Address?: string | null;
}

/** One email of the payload's `items` (Brevo's field names, which the relay keeps; the rest is ignored). */
export interface InboundItem {
  Uuid?: string[] | string;
  MessageId?: string;
  From?: InboundAddress | null;
  To?: InboundAddress[] | null;
  Cc?: InboundAddress[] | null;
  /** Brevo documents both shapes: plain addresses in the sample, Mailbox objects in the table. */
  Recipients?: (string | InboundAddress | null)[] | null;
  Subject?: string | null;
  SentAtDate?: string | null;
  RawTextBody?: string | null;
  RawHtmlBody?: string | null;
  ExtractedMarkdownMessage?: string | null;
  /**
   * 10/10/2026 (« tu ne vas pas chercher dans les liens »): the email's allopark.com links (alloparkLinks), read by
   * parseRawEmail from the whole bodies: the « Consulter ma réservation » button sits at the end of a long HTML, beyond
   * the 100 000 characters RawHtmlBody keeps. Absent from the former JSON payload: the links are then read from its bodies.
   */
  Links?: string[] | null;
}

export interface InboundPayload {
  items?: InboundItem[];
}

/** Every address the email was sent to, lower-cased. */
export function recipientsOf(item: InboundItem): string[] {
  const addressOf = (a: string | InboundAddress | null | undefined): string => (typeof a === 'string' ? a : (a?.Address ?? ''));
  const addresses = [...(item.Recipients ?? []), ...(item.To ?? []), ...(item.Cc ?? [])].map(addressOf);
  return [...new Set(addresses.map(a => a.trim().toLowerCase()).filter(Boolean))];
}

/** At most this many of the email's own recipients are kept, each at most this long. */
export const MAX_OWN_RECIPIENTS = 5;
const RECIPIENT_MAX_CHARS = 200;
const ADDRESS = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

/**
 * 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): the addresses the email itself was sent to (its To and Cc,
 * the parking's mailbox for a forwarded email), never Plazo's own; kept with the email for a re-analysis (Allopark's
 * booking page is opened with the parking's address).
 */
export function ownRecipientsOf(item: InboundItem, excludeDomain: string): string[] {
  const excluded = `@${excludeDomain.toLowerCase()}`;
  const addresses = [...(item.To ?? []), ...(item.Cc ?? [])]
    .map(a => (a?.Address ?? '').trim().toLowerCase())
    .filter(a => a.length <= RECIPIENT_MAX_CHARS && ADDRESS.test(a) && !a.endsWith(excluded));
  return [...new Set(addresses)].slice(0, MAX_OWN_RECIPIENTS);
}

/** At most this many addresses are read from the header of a forwarded message. */
export const MAX_FORWARDED_RECIPIENTS = 5;
/** The line a mail client puts above the message it forwards (Gmail, Outlook, Apple Mail; French and English). */
const FORWARD_MARKER = /forwarded message|message transf[ée]r[ée]|message d'origine|original message|message r[ée]exp[ée]di[ée]|d[ée]but du message/i;
const HEADER_FROM = /^(?:>\s*)*(?:de|from|exp[ée]diteur)\s*:/i;
const HEADER_TO = /^(?:>\s*)*(?:[àÀ]|a|to|pour|destinataires?)\s*:(.*)$/i;
/** The recipients' line is read within this many lines of the « De : » line (Outlook puts « Envoyé : » between them). */
const HEADER_LINES = 12;
const ADDRESS_IN_TEXT = /[^\s@<>"'(),;:[\]]+@[^\s@<>"'(),;:[\]]+\.[a-z]{2,}/gi;

/**
 * 10/10/2026 (« tu ne vas pas chercher dans les liens »): the addresses of a forwarded message's header in the text,
 * on its « À : », « A : », « To: », « Pour : » or « Destinataire : » line within a few lines of its « De : » / « From: »
 * line or of the « Message transféré » / « Forwarded message » marker (Gmail, Outlook, Apple Mail): the parking's
 * mailbox when the parking forwarded the email by hand, the email itself being sent to the Plazo address only.
 * Lower-cased, deduplicated, at most 5; any other line of the text is ignored.
 */
export function forwardedRecipientsOf(text: string): string[] {
  const found: string[] = [];
  let header = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (FORWARD_MARKER.test(line) || HEADER_FROM.test(line)) {
      header = HEADER_LINES;
      continue;
    }
    if (header <= 0) continue;
    header -= 1;
    const to = HEADER_TO.exec(line);
    if (!to) continue;
    for (const match of to[1].matchAll(ADDRESS_IN_TEXT)) {
      const address = match[0].toLowerCase();
      if (address.length <= RECIPIENT_MAX_CHARS && ADDRESS.test(address)) found.push(address);
    }
  }
  return [...new Set(found)].slice(0, MAX_FORWARDED_RECIPIENTS);
}

/** The local part of the first recipient on the inbound domain: "lys-demo-7f3a" for "lys-demo-7f3a@in.plazo.fr". */
export function inboundSlugOf(recipients: string[], domain: string): string | null {
  const suffix = `@${domain.toLowerCase()}`;
  const match = recipients.find(r => r.endsWith(suffix));
  return match ? match.slice(0, -suffix.length) : null;
}

/** A readable text from the email: the plain part, else an extracted markdown (Brevo's), else the HTML stripped. */
export function textOf(item: InboundItem): string {
  const plain = item.RawTextBody?.trim();
  if (plain) return plain;
  const markdown = item.ExtractedMarkdownMessage?.trim();
  if (markdown) return markdown;
  return stripHtml(item.RawHtmlBody ?? '');
}

export function stripHtml(html: string): string {
  return (
    html
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      // A logo's alternative text often carries the comparator's name (« Parclick », « ParkMundo »).
      .replace(/<img\b[^>]*?\balt\s*=\s*"([^"]*)"[^>]*>/gi, ' $1 ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|tr|li|h[1-6]|table)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&quot;/gi, '"')
      .replace(/[ \t]+/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join('\n')
      .trim()
  );
}

/** "parking-lys-demo" + random characters (8 hex since 08/10/2026): the address only the operator's mailbox forwards to. */
export function newInboundSlug(base: string, random: () => string): string {
  const clean = base
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
  return `${clean || 'parking'}-${random()}`;
}

/** Required to create a booking without staff; anything else is completed later. */
export const REQUIRED_FOR_IMPORT = ['arrivalAt', 'returnAt', 'customerName', 'customerPhone', 'plate'] as const;

/** G-B (07/10/2026): what a mail provider sends to the Plazo address before it lets the operator forward to it. */
export interface ForwardingConfirmation {
  provider: 'gmail';
  /** The code the operator types back in Gmail ("482913507"); null when Gmail only sent the link (08/10/2026). */
  code: string | null;
  /** The acceptance link of the email (mail-settings.google.com/mail/vf-…): opening it confirms the forwarding. */
  link: string | null;
  /** The Gmail address asking to forward, when the email says it. */
  requester: string | null;
}

const GMAIL_FORWARDING_SENDER = 'forwarding-noreply@google.com';

/**
 * Gmail's "Forwarding Confirmation" ("Confirmation de transfert Gmail"). Until 2026 the code was in the subject,
 * "(#482913507)" or "(n° 482913507)", and in the body after "Confirmation code:" / "Code de confirmation :"; the
 * subject is now "(Gmail) Confirmation de transfert – Recevez les messages de x@gmail.com" without the code
 * (08/10/2026), so the body is read more freely (the code is the 9-digit number near "code", else the only 9-digit
 * number) and the acceptance link (mail-settings.google.com/mail/vf-…) is kept too: opening it confirms as well.
 */
export function forwardingConfirmationOf(email: { from: string | null; subject: string | null; text: string }): ForwardingConfirmation | null {
  if (email.from?.trim().toLowerCase() !== GMAIL_FORWARDING_SENDER) return null;
  const subject = email.subject ?? '';
  const text = email.text ?? '';
  const nineDigits = [...text.matchAll(/(?<![\d-])(\d{9})(?![\d-])/g)].map(m => m[1]);
  const code =
    /\((?:#|n°|no|nº)\s*(\d{6,12})\)/i.exec(subject)?.[1] ??
    /(?:confirmation code|code de confirmation)[^\d]{0,40}(\d{6,12})/i.exec(text)?.[1] ??
    (nineDigits.length === 1 ? nineDigits[0] : null);
  const link = /https:\/\/mail-settings\.google\.com\/mail\/vf-[^\s<>"')]+/i.exec(text)?.[0] ?? null;
  if (!code && !link) return null;
  const requester = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\s*$/.exec(subject.trim())?.[1]?.toLowerCase() ?? null;
  return { provider: 'gmail', code, link, requester };
}
