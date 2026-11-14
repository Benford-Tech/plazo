/**
 * 12/11/2026 (« une boîte de réception des messages envoyés par WhatsApp », direction A of
 * https://claude.ai/artifact/E2oye5And3wLVphw6rE5ko): what travellers write to Plazo's WhatsApp number. Meta sends each
 * message to the webhook that already carries our delivery statuses (field « messages »); this reads them.
 */

/** Meta allows a free reply for 24 hours after the traveller's last message; after that, only an approved template. */
export const REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Messages and conversations are kept 30 days, like the other traveller messages. */
export const INBOX_RETENTION_DAYS = 30;
/** A reply, as WhatsApp allows it. */
export const REPLY_MAX_LENGTH = 4096;
/** A photo or voice note served through Plazo (Vercel answers 4.5 MB at most). */
export const MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export const INBOX_TYPES = ['text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'other'] as const;
export type InboxType = (typeof INBOX_TYPES)[number];

export interface InboundWhatsapp {
  /** Meta's message id (wamid…): a message delivered twice is stored once. */
  id: string;
  /** E.164, « +33612345678 ». */
  from: string;
  at: Date;
  type: InboxType;
  text: string | null;
  mediaId: string | null;
  mediaMime: string | null;
  /** The sender's WhatsApp profile name, when Meta gives it. */
  profileName: string | null;
  /** 14/11/2026: Meta's id of the business number that received it (Plazo's, or a parking's own). */
  toPhoneNumberId: string | null;
}

const clean = (value: unknown, max: number): string | null => {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\r\n?/g, '\n').trim();
  return text ? text.slice(0, max) : null;
};

/** The messages travellers sent, in a webhook payload (statuses and anything else ignored). */
export function inboundMessagesOf(payload: unknown, now = new Date()): InboundWhatsapp[] {
  const out: InboundWhatsapp[] = [];
  const entries = (payload as any)?.entry;
  if (!Array.isArray(entries)) return out;
  for (const entry of entries) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      const value = change?.value;
      const toPhoneNumberId = typeof value?.metadata?.phone_number_id === 'string' ? value.metadata.phone_number_id : null;
      const names = new Map<string, string>();
      for (const contact of Array.isArray(value?.contacts) ? value.contacts : []) {
        const name = clean(contact?.profile?.name, 80);
        if (typeof contact?.wa_id === 'string' && name) names.set(contact.wa_id, name);
      }
      for (const m of Array.isArray(value?.messages) ? value.messages : []) {
        const id = typeof m?.id === 'string' ? m.id : '';
        const digits = typeof m?.from === 'string' ? m.from.replace(/\D/g, '') : '';
        if (!id || digits.length < 8 || digits.length > 15) continue;
        const seconds = Number(m.timestamp);
        const at = Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : now;
        const kind = typeof m.type === 'string' ? m.type : 'other';
        let type: InboxType = (INBOX_TYPES as readonly string[]).includes(kind) ? (kind as InboxType) : 'other';
        let text: string | null = null;
        let media: any = null;
        if (kind === 'text') text = clean(m.text?.body, 4096);
        else if (kind === 'image' || kind === 'audio' || kind === 'video' || kind === 'document' || kind === 'sticker') {
          media = m[kind];
          text = clean(media?.caption, 1024);
        } else if (kind === 'location') {
          const lat = Number(m.location?.latitude);
          const lng = Number(m.location?.longitude);
          text = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : null;
        } else if (kind === 'button') {
          type = 'text';
          text = clean(m.button?.text, 1024);
        } else if (kind === 'interactive') {
          type = 'text';
          text = clean(m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title, 1024);
        }
        out.push({
          id,
          from: `+${digits}`,
          at: at.getTime() > now.getTime() + 60_000 ? now : at,
          type,
          text,
          mediaId: typeof media?.id === 'string' ? media.id : null,
          mediaMime: typeof media?.mime_type === 'string' ? media.mime_type.slice(0, 100) : null,
          profileName: names.get(m.from) ?? null,
          toPhoneNumberId,
        });
      }
    }
  }
  return out;
}

/** The last nine digits: « +33 6 12 34 56 78 » and « 06 12 34 56 78 » are one number. */
export function phoneTail(phone: string): string {
  return phone.replace(/\D/g, '').slice(-9);
}

/** Until when a free reply can be sent (null: never written, or the window is over). */
export function replyUntil(lastInboundAt: Date | null, now = new Date()): Date | null {
  if (!lastInboundAt) return null;
  const until = new Date(lastInboundAt.getTime() + REPLY_WINDOW_MS);
  return until.getTime() > now.getTime() ? until : null;
}

/** What the list shows of a message without text: « Photo », « Message vocal »… */
export function previewOf(message: { type: string; text: string | null }): string {
  if (message.text) return message.text.replace(/\s+/g, ' ').slice(0, 140);
  switch (message.type) {
    case 'image':
      return 'Photo';
    case 'audio':
      return 'Message vocal';
    case 'video':
      return 'Vidéo';
    case 'document':
      return 'Document';
    case 'sticker':
      return 'Autocollant';
    case 'location':
      return 'Position';
    default:
      return 'Message';
  }
}

/**
 * 12/11/2026 (« Écrire au parking » from the Plazo app): where a reply of the team goes. The app when the traveller's
 * last message came from it, or when Meta's 24 hours are over and they once wrote from the app; else WhatsApp within
 * the 24 hours; null: only a call.
 */
export function replyChannelOf(
  row: { phone: string; lastInboundAt: Date | null; lastAppAt: Date | null },
  now = new Date(),
): 'app' | 'whatsapp' | null {
  const whatsappOpen = !row.phone.startsWith('app:') && replyUntil(row.lastInboundAt, now) !== null;
  if (row.lastAppAt && (!whatsappOpen || !row.lastInboundAt || row.lastAppAt >= row.lastInboundAt)) return 'app';
  return whatsappOpen ? 'whatsapp' : null;
}

/** The conversation key of a traveller writing from the app: their phone in E.164, else one key per booking. */
export function appConversationPhone(customerPhone: string | null | undefined, reservationId: string): string {
  let digits = (customerPhone ?? '').replace(/\(0\)/g, '').replace(/[\s.()-]/g, '');
  if (digits.startsWith('00')) digits = `+${digits.slice(2)}`;
  if (/^0[1-9]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (/^\+\d{8,15}$/.test(digits)) return digits.replace(/^\+330/, '+33');
  return `app:${reservationId}`;
}

/** A traveller's message from the app, as WhatsApp allows a text. */
export const APP_MESSAGE_MAX_LENGTH = 2000;
