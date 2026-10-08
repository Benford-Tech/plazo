import type { Address, Email } from "postal-mime";

/** An address as Plazo's inbound route reads it. */
export interface InboundAddress {
  Name: string | null;
  Address: string | null;
}

/** One email in the shape `POST /api/public/inbound/email` reads (`InboundItem` in backend/src/domain/inbound-email.ts). */
export interface InboundItem {
  MessageId: string | null;
  From: InboundAddress | null;
  To: InboundAddress[];
  Cc: InboundAddress[];
  /** The envelope recipient: the parking's Plazo address, whatever the forwarded email's own headers say. */
  Recipients: string[];
  Subject: string | null;
  SentAtDate: string | null;
  RawTextBody: string | null;
  RawHtmlBody: string | null;
}

export interface InboundPayload {
  items: InboundItem[];
}

/** Plazo keeps 20 000 characters of text; this only keeps the request under the API's 1 MB limit. */
export const BODY_MAX_CHARS = 100_000;

function mailboxes(list: Address[] | undefined): InboundAddress[] {
  return (list ?? [])
    .flatMap(address => (address.group ? address.group : [address]))
    .map(mailbox => ({ Name: mailbox.name || null, Address: mailbox.address || null }));
}

const clip = (value: string | undefined) => (value ? value.slice(0, BODY_MAX_CHARS) : null);

/** The parsed email and its envelope (Cloudflare's `message.from` / `message.to`) as Plazo's payload. */
export function toInboundPayload(email: Email, envelope: { from: string; to: string }): InboundPayload {
  const [from] = mailboxes(email.from ? [email.from] : []);
  return {
    items: [
      {
        MessageId: email.messageId ?? null,
        From: from ?? { Name: null, Address: envelope.from || null },
        To: mailboxes(email.to),
        Cc: mailboxes(email.cc),
        Recipients: [envelope.to.trim().toLowerCase()],
        Subject: email.subject ?? null,
        SentAtDate: email.date ?? null,
        RawTextBody: clip(email.text),
        RawHtmlBody: clip(email.html),
      },
    ],
  };
}
