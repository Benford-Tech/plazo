import PostalMime, { Attachment } from 'postal-mime';
import { stripHtml } from './inbound-email';

/**
 * The text of an email's attachments (08/11/2026, « pour Parclick le nom du client, il y a une pièce jointe à
 * analyser », « les pièces devraient être récupérées lors du transfert ») : a comparator may put the traveller's name or
 * phone in a PDF voucher, and a forwarded email may come as an attached message (.eml). Their text is added after the
 * body, under one line per file (« Pièce jointe : bon.pdf »), so that the comparators' rules, the reading by Claude and
 * the team (inbox) all see it. Images, archives and office files are skipped; nothing here ever fails the reception.
 */

/** At most this many attachments are read, the first ones of the message. */
export const MAX_ATTACHMENTS = 4;
/** A bigger file is skipped (the relay already cuts the whole message at 4 MB). */
export const ATTACHMENT_MAX_BYTES = 3 * 1024 * 1024;
/** Only the first pages of a PDF are read: a voucher is one or two pages. */
export const PDF_MAX_PAGES = 5;
/** What all the attachments may add to the 20 000 characters of text Plazo keeps. */
export const ATTACHMENTS_TEXT_MAX = 8000;
/** The reading stops after this long (a broken PDF must not hold the relay's call). */
export const ATTACHMENTS_BUDGET_MS = 5000;

type Kind = 'pdf' | 'message' | 'html' | 'text';

function bytesOf(content: Attachment['content']): Uint8Array {
  if (typeof content === 'string') return new TextEncoder().encode(content);
  return content instanceof Uint8Array ? content : new Uint8Array(content);
}

/** What the attachment is, from its type, its name or (for a PDF sent as octet-stream) its first bytes. */
export function attachmentKind(attachment: Pick<Attachment, 'filename' | 'mimeType'>, bytes: Uint8Array): Kind | null {
  const type = (attachment.mimeType || '').toLowerCase();
  const name = (attachment.filename || '').toLowerCase();
  const pdfMagic = bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
  if (type === 'application/pdf' || name.endsWith('.pdf') || pdfMagic) return pdfMagic ? 'pdf' : null;
  if (type === 'message/rfc822' || name.endsWith('.eml')) return 'message';
  if (type === 'text/html' || name.endsWith('.html') || name.endsWith('.htm')) return 'html';
  if (type === 'text/plain' || type === 'text/csv' || name.endsWith('.txt') || name.endsWith('.csv')) return 'text';
  return null;
}

interface TextItem {
  str: string;
  hasEOL?: boolean;
  transform?: number[];
}

/** The text of a PDF, one line per line of the page (items on the same height joined by a space). */
export async function pdfText(bytes: Uint8Array): Promise<string> {
  const { getDocumentProxy } = await import('unpdf');
  const pdf = await getDocumentProxy(new Uint8Array(bytes));
  try {
    const pages: string[] = [];
    for (let n = 1; n <= Math.min(pdf.numPages, PDF_MAX_PAGES); n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      const lines: string[] = [];
      let line = '';
      let y: number | null = null;
      for (const raw of content.items as TextItem[]) {
        if (typeof raw.str !== 'string') continue;
        const itemY = raw.transform?.[5] ?? null;
        if (line && y !== null && itemY !== null && Math.abs(itemY - y) > 2) {
          lines.push(line.trim());
          line = '';
        }
        line += line && raw.str && !line.endsWith(' ') ? ` ${raw.str}` : raw.str;
        y = itemY ?? y;
        if (raw.hasEOL) {
          lines.push(line.trim());
          line = '';
        }
      }
      if (line.trim()) lines.push(line.trim());
      pages.push(lines.filter(Boolean).join('\n'));
    }
    return pages.join('\n\n');
  } finally {
    await pdf.destroy().catch(() => undefined);
  }
}

async function textOfAttachment(kind: Kind, bytes: Uint8Array): Promise<string> {
  switch (kind) {
    case 'pdf':
      return pdfText(bytes);
    case 'message': {
      const inner = await PostalMime.parse(bytes);
      const head = [
        inner.from?.address && `De : ${inner.from.name ? `${inner.from.name} <${inner.from.address}>` : inner.from.address}`,
        inner.subject && `Objet : ${inner.subject}`,
      ]
        .filter(Boolean)
        .join('\n');
      const body = inner.text?.trim() || stripHtml(inner.html ?? '');
      return [head, body].filter(Boolean).join('\n');
    }
    case 'html':
      return stripHtml(new TextDecoder().decode(bytes));
    case 'text':
      return new TextDecoder().decode(bytes);
  }
}

const tidy = (text: string) =>
  text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/** The attachments' text, labelled by file, or null when none could be read. */
export async function attachmentsText(attachments: Attachment[] | undefined, budgetMs = ATTACHMENTS_BUDGET_MS): Promise<string | null> {
  const deadline = Date.now() + budgetMs;
  const parts: string[] = [];
  let length = 0;
  let read = 0;
  for (const attachment of attachments ?? []) {
    if (read >= MAX_ATTACHMENTS || length >= ATTACHMENTS_TEXT_MAX) break;
    // Inline pictures (logos) referenced from the HTML are never documents.
    if (attachment.related || attachment.mimeType?.startsWith('image/')) continue;
    const bytes = bytesOf(attachment.content);
    if (!bytes.length || bytes.length > ATTACHMENT_MAX_BYTES) continue;
    const kind = attachmentKind(attachment, bytes);
    if (!kind) continue;
    read++;
    const left = deadline - Date.now();
    if (left <= 0) break;
    let text: string;
    try {
      text = tidy(
        await Promise.race([
          textOfAttachment(kind, bytes),
          new Promise<string>((_, reject) => setTimeout(() => reject(new Error('attachment_timeout')), left).unref?.()),
        ]),
      );
    } catch {
      continue;
    }
    if (!text) continue;
    const name = (attachment.filename || (kind === 'pdf' ? 'document.pdf' : 'pièce jointe')).replace(/\s+/g, ' ').slice(0, 80);
    const part = `${ATTACHMENT_HEADING}${name}\n${text}`.slice(0, ATTACHMENTS_TEXT_MAX - length);
    parts.push(part);
    length += part.length + 2;
  }
  return parts.length ? parts.join('\n\n') : null;
}

/** The line that opens each attachment's text in a stored email. */
export const ATTACHMENT_HEADING = 'Pièce jointe : ';
const ATTACHMENTS_START = /(?:^|\n\n)Pièce jointe : /;

/** The email's own body, without the attachments' text added after it. */
export function withoutAttachments(text: string): string {
  const at = text.search(ATTACHMENTS_START);
  return at < 0 ? text : text.slice(0, at);
}

/** The body followed by the attachments' text, the whole within `max` characters (the attachments keep their room). */
export function withAttachments(body: string, attachments: string | null | undefined, max: number): string {
  if (!attachments) return body.slice(0, max);
  const room = Math.min(attachments.length, ATTACHMENTS_TEXT_MAX);
  const head = body.slice(0, Math.max(0, max - room - 2)).trimEnd();
  return `${head}${head ? '\n\n' : ''}${attachments.slice(0, room)}`.slice(0, max);
}
