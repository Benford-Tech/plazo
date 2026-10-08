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
  Recipients?: string[] | null;
  Subject?: string | null;
  SentAtDate?: string | null;
  RawTextBody?: string | null;
  RawHtmlBody?: string | null;
  ExtractedMarkdownMessage?: string | null;
}

export interface InboundPayload {
  items?: InboundItem[];
}

/** Every address the email was sent to, lower-cased. */
export function recipientsOf(item: InboundItem): string[] {
  const addresses = [...(item.Recipients ?? []), ...(item.To ?? []).map(a => a?.Address ?? ''), ...(item.Cc ?? []).map(a => a?.Address ?? '')];
  return [...new Set(addresses.map(a => a.trim().toLowerCase()).filter(Boolean))];
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
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
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
    .trim();
}

/** "parking-lys-demo" + 4 random characters: unguessable enough for an address only the operator's mailbox forwards to. */
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
  /** The code the operator types back in Gmail ("482913507"). */
  code: string;
  /** The Gmail address asking to forward, when the email says it. */
  requester: string | null;
}

const GMAIL_FORWARDING_SENDER = 'forwarding-noreply@google.com';

/**
 * Gmail's "Forwarding Confirmation" ("Confirmation de transfert Gmail"): the code is in the subject, "(#482913507)"
 * or "(n° 482913507)", and in the body after "Confirmation code:" / "Code de confirmation :".
 */
export function forwardingConfirmationOf(email: { from: string | null; subject: string | null; text: string }): ForwardingConfirmation | null {
  if (email.from?.trim().toLowerCase() !== GMAIL_FORWARDING_SENDER) return null;
  const subject = email.subject ?? '';
  const code =
    /\((?:#|n°|no|nº)\s*(\d{6,12})\)/i.exec(subject)?.[1] ??
    /(?:confirmation code|code de confirmation)\s*:?\s*(\d{6,12})/i.exec(email.text)?.[1] ??
    null;
  if (!code) return null;
  const requester = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)\s*$/.exec(subject.trim())?.[1]?.toLowerCase() ?? null;
  return { provider: 'gmail', code, requester };
}
