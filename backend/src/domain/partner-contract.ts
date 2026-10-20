import { createHash } from 'crypto';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

/**
 * The Plazo ↔ operator contract (20/10/2026, « Pouvoir stocker le contrat à faire signer », choice 2a). The platform
 * uploads the operator's PDF; a manager signs it in the pro space with their typed full name and « Lu et approuvé ».
 * Plazo then keeps the PDF signed (the original with a « Signature » page added at its end) and the proof page alone.
 * Pure functions: checks, fingerprints and the signature page.
 */

/** Vercel refuses request bodies above 4.5 MB: a contract is 4 MB at most. */
export const MAX_CONTRACT_BYTES = 4 * 1024 * 1024;
export const DEFAULT_CONTRACT_TITLE = 'Contrat de partenariat Plazo';
export const SIGNER_NAME_MAX = 120;
export const CONTRACT_TIME_ZONE = 'Europe/Paris';

export const sha256Hex = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

export type PdfCheck = { ok: true; pages: number } | { ok: false; code: 'empty' | 'too_large' | 'not_a_pdf' | 'pdf_encrypted' | 'pdf_unreadable' };

/** A PDF Plazo can read and add a page to (not encrypted). */
export async function checkPdf(bytes: Buffer): Promise<PdfCheck> {
  if (!bytes.length) return { ok: false, code: 'empty' };
  if (bytes.length > MAX_CONTRACT_BYTES) return { ok: false, code: 'too_large' };
  // « %PDF- » within the first KB, as readers accept.
  if (!bytes.subarray(0, 1024).toString('latin1').includes('%PDF-')) return { ok: false, code: 'not_a_pdf' };
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false });
    return { ok: true, pages: doc.getPageCount() };
  } catch (error) {
    const name = error instanceof Error ? error.constructor.name : '';
    return { ok: false, code: name === 'EncryptedPDFError' ? 'pdf_encrypted' : 'pdf_unreadable' };
  }
}

/** A file name safe for a header and a key: letters, digits, dots, dashes; « .pdf » at the end. */
export function cleanFileName(raw: unknown): string {
  const base = typeof raw === 'string' ? raw.normalize('NFD').replace(/[̀-ͯ]/g, '') : '';
  const cleaned = base
    .replace(/\.pdf$/i, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${cleaned || 'contrat'}.pdf`;
}

export function cleanTitle(raw: unknown): string {
  const title = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  return title || DEFAULT_CONTRACT_TITLE;
}

export type SignatureCheck = { ok: true; name: string } | { ok: false; fields: Record<string, string> };

/** The typed full name (two words at least, as on an ID) and the box ticked. */
export function checkSignature(body: { signerName?: unknown; accepted?: unknown }): SignatureCheck {
  const fields: Record<string, string> = {};
  const name = typeof body.signerName === 'string' ? body.signerName.replace(/\s+/g, ' ').trim() : '';
  if (!name) fields.signerName = 'required';
  else if (name.length > SIGNER_NAME_MAX) fields.signerName = 'too_long';
  else if (name.split(' ').filter(w => /\p{L}/u.test(w)).length < 2) fields.signerName = 'full_name';
  if (body.accepted !== true) fields.accepted = 'required';
  return Object.keys(fields).length ? { ok: false, fields } : { ok: true, name };
}

export interface SignatureFacts {
  productName: string;
  contractId: string;
  title: string;
  version: number;
  operatorName: string;
  signerName: string;
  signerEmail: string;
  signedAt: Date;
  ip: string | null;
  userAgent: string | null;
  uploadedAt: Date;
  /** SHA-256 of the PDF uploaded, the one the manager read. */
  originalSha256: string;
  pageCount: number;
}

/** The mention the manager ticks, word for word (the page says it again). */
export const acceptanceText = (operatorName: string) => `Lu et approuvé. J'ai lu le contrat en entier et je l'accepte au nom de ${operatorName}.`;

// Characters the standard Helvetica (WinAnsi) can draw: Latin-1 plus a few typographic signs.
const WIN_ANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ');
export const pdfSafe = (text: string) =>
  [...text.normalize('NFC')].map(c => ((c.charCodeAt(0) <= 0xff && c.charCodeAt(0) >= 0x20) || WIN_ANSI_EXTRA.has(c) ? c : '?')).join('');

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of pdfSafe(text).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  // A single word wider than the line (a fingerprint): cut it.
  return lines.flatMap(l => {
    if (font.widthOfTextAtSize(l, size) <= width) return [l];
    const parts: string[] = [];
    let part = '';
    for (const c of l) {
      if (font.widthOfTextAtSize(part + c, size) > width) {
        parts.push(part);
        part = c;
      } else part += c;
    }
    return part ? [...parts, part] : parts;
  });
}

/** « 20/10/2026 à 10:42:07 », Paris time. */
export function parisTime(date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('fr-FR', {
      timeZone: CONTRACT_TIME_ZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map(p => [p.type, p.value]),
  );
  return `${parts.day}/${parts.month}/${parts.year} à ${parts.hour}:${parts.minute}:${parts.second}`;
}

/** The rows of the signature page, label then value. */
export function signatureRows(facts: SignatureFacts, signedSha256?: string): [string, string][] {
  return [
    ['Contrat', `${facts.title} · version ${facts.version} (${facts.pageCount} page${facts.pageCount > 1 ? 's' : ''})`],
    ['Loueur', facts.operatorName],
    ['Signé par', `${facts.signerName} (${facts.signerEmail})`],
    ['Mention acceptée', acceptanceText(facts.operatorName)],
    ['Date et heure', `${parisTime(facts.signedAt)} (heure de Paris) · ${facts.signedAt.toISOString()}`],
    ['Adresse IP', facts.ip ?? 'inconnue'],
    ['Navigateur', facts.userAgent ? facts.userAgent.slice(0, 300) : 'inconnu'],
    ['Empreinte SHA-256 du contrat déposé', facts.originalSha256],
    ...(signedSha256 ? ([['Empreinte SHA-256 du PDF signé', signedSha256]] as [string, string][]) : []),
    ['Déposé par', `${facts.productName}, le ${parisTime(facts.uploadedAt)}`],
    ['Référence', facts.contractId],
  ];
}

async function drawSignaturePage(doc: PDFDocument, facts: SignatureFacts, signedSha256?: string): Promise<PDFPage> {
  const page = doc.addPage([595.28, 841.89]); // A4
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const mono = await doc.embedFont(StandardFonts.Courier);
  const ink = rgb(0.1, 0.11, 0.1);
  const soft = rgb(0.42, 0.45, 0.5);
  const left = 56;
  const width = 595.28 - left * 2;
  let y = 841.89 - 64;

  page.drawText(pdfSafe('Signature électronique'), { x: left, y, size: 20, font: bold, color: ink });
  y -= 22;
  for (const line of wrap(`Page ajoutée par ${facts.productName} au moment de la signature, à la suite du contrat.`, regular, 10, width)) {
    page.drawText(line, { x: left, y, size: 10, font: regular, color: soft });
    y -= 14;
  }
  y -= 14;

  for (const [label, value] of signatureRows(facts, signedSha256)) {
    page.drawText(pdfSafe(label.toUpperCase()), { x: left, y, size: 8, font: bold, color: soft });
    y -= 13;
    const isHash = /^[0-9a-f]{64}$/.test(value);
    const font = isHash ? mono : regular;
    for (const line of wrap(value, font, 10.5, width)) {
      page.drawText(line, { x: left, y, size: 10.5, font, color: ink });
      y -= 14;
    }
    y -= 8;
  }

  const notes = [
    "Le signataire s'est connecté à son espace professionnel avec son adresse e-mail, a tapé son nom complet et a coché la mention ci-dessus avant de signer.",
    `L'empreinte SHA-256 identifie le document au bit près : le moindre changement la modifie. ${facts.productName} garde le contrat déposé, ce PDF signé et cette preuve.`,
  ];
  y = Math.min(y, 120);
  for (const note of notes) {
    for (const line of wrap(note, regular, 8.5, width)) {
      page.drawText(line, { x: left, y, size: 8.5, font: regular, color: soft });
      y -= 11;
    }
    y -= 4;
  }
  return page;
}

/**
 * The PDF signed (the original, untouched, with the signature page at its end) and the proof (the same page alone, with
 * the signed PDF's fingerprint too).
 */
export async function buildSignedPdf(original: Buffer, facts: SignatureFacts): Promise<{ signed: Buffer; signedSha256: string; proof: Buffer }> {
  const doc = await PDFDocument.load(original, { updateMetadata: false });
  await drawSignaturePage(doc, facts);
  const signed = Buffer.from(await doc.save());
  const signedSha256 = sha256Hex(signed);

  const proofDoc = await PDFDocument.create();
  proofDoc.setTitle(pdfSafe(`Preuve de signature · ${facts.title} v${facts.version}`));
  proofDoc.setProducer(facts.productName);
  await drawSignaturePage(proofDoc, facts, signedSha256);
  const proof = Buffer.from(await proofDoc.save());
  return { signed, signedSha256, proof };
}
