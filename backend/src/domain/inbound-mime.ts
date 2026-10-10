import PostalMime, { Address, Email } from 'postal-mime';
import { alloparkLinks } from './importers/allopark-page';
import { InboundAddress, InboundItem } from './inbound-email';

/** The content type the Cloudflare relay posts the raw message with. */
export const RAW_EMAIL_TYPE = 'message/rfc822';
/** Vercel takes request bodies up to 4.5 MB: the relay cuts a bigger message there (the text parts come first). */
export const RAW_EMAIL_MAX_BYTES = 4 * 1024 * 1024;
/** Plazo keeps 20 000 characters of text; this only bounds what is carried around. */
export const BODY_MAX_CHARS = 100_000;

/** What Cloudflare Email Routing knows of the message: the sender and the parking's Plazo address. */
export interface Envelope {
  from: string | null;
  to: string | null;
}

function mailboxes(list: Address[] | undefined): InboundAddress[] {
  return (list ?? [])
    .flatMap(address => (address.group ? address.group : [address]))
    .map(mailbox => ({ Name: mailbox.name || null, Address: mailbox.address || null }));
}

const clip = (value: string | undefined) => (value ? value.slice(0, BODY_MAX_CHARS) : null);

/**
 * The message as the relay received it (RFC 822), parsed here rather than in the Worker (08/10/2026): the Workers
 * Free plan allows 10 ms of CPU per email, which a real confirmation (HTML, inline images) exceeded while decoding
 * (EXCEEDED_CPU, "Worker call failed after 3 attempts" for the sender). The envelope recipient names the parking,
 * whatever the forwarded email's own headers say; a message that cannot be read keeps its envelope, so the parking
 * still sees that something arrived. The bodies are clipped to 100 000 characters; the allopark.com links are read
 * from them whole (`Links`, 10/10/2026).
 */
export async function parseRawEmail(raw: Uint8Array, envelope: Envelope): Promise<InboundItem> {
  const to = envelope.to?.trim().toLowerCase() || null;
  const from = envelope.from?.trim() || null;
  const bare: InboundItem = {
    From: from ? { Name: null, Address: from } : null,
    To: [],
    Cc: [],
    Recipients: to ? [to] : [],
    Subject: null,
    SentAtDate: null,
    RawTextBody: null,
    RawHtmlBody: null,
  };
  let email: Email;
  try {
    email = await PostalMime.parse(raw);
  } catch {
    return bare;
  }
  const [sender] = mailboxes(email.from ? [email.from] : []);
  return {
    ...bare,
    MessageId: email.messageId || undefined,
    From: sender ?? bare.From,
    To: mailboxes(email.to),
    Cc: mailboxes(email.cc),
    Subject: email.subject ?? null,
    SentAtDate: email.date ?? null,
    RawTextBody: clip(email.text),
    RawHtmlBody: clip(email.html),
    // 10/10/2026: the links are read from the whole bodies, before the clip: Allopark's « Consulter ma réservation »
    // button comes after 100 000 characters of HTML (inline styles, tables).
    Links: alloparkLinks(email.html, email.text),
  };
}
