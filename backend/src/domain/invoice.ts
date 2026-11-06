import { PDFDocument, PDFFont, PDFImage, rgb, StandardFonts } from 'pdf-lib';
import { PAID_BY_LABELS, PaidBy } from './payment-method';
import { pdfSafe, wrap } from './partner-contract';

/**
 * 06/11/2026 (« une facture au nom du parking avec son logo », direction A): the invoice a parking issues to its
 * customer for a booking. Pure rules: the parking's invoicing details, the VAT split of a price that includes VAT, the
 * number, and the PDF (logo, seller, customer, lines, totals). An invoice is never changed once issued; a credit note
 * cancels it.
 */

export const DEFAULT_VAT_RATE_BP = 2000;
export const VAT_EXEMPT_MENTION = 'TVA non applicable, article 293 B du Code général des impôts.';

export interface BillingSettings {
  legalName: string | null;
  address: string | null;
  siret: string | null;
  vatNumber: string | null;
  vatExempt: boolean;
  vatRateBp: number;
  mention: string | null;
  prefix: string;
}

export type BillingField = 'legalName' | 'address' | 'siret' | 'vatNumber';

/** What still has to be filled before an invoice can be issued (the address falls back to the parking's). */
export function billingMissing(s: BillingSettings, parkingAddress: string | null): BillingField[] {
  const missing: BillingField[] = [];
  if (!s.legalName?.trim()) missing.push('legalName');
  if (!s.address?.trim() && !parkingAddress?.trim()) missing.push('address');
  if (!s.siret?.trim()) missing.push('siret');
  if (!s.vatExempt && !s.vatNumber?.trim()) missing.push('vatNumber');
  return missing;
}

const clean = (v: unknown, max: number): string | null => {
  if (v == null) return null;
  if (typeof v !== 'string') return undefined as never;
  const t = v
    .replace(/[\r\t]+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim();
  return t ? t.slice(0, max) : null;
};

export type BillingInput = Partial<{
  legalName: unknown;
  address: unknown;
  siret: unknown;
  vatNumber: unknown;
  vatExempt: unknown;
  vatRatePercent: unknown;
  mention: unknown;
  prefix: unknown;
}>;

/** Reads a PUT body: fields absent stay as they are; returns the changes and the errors by field. */
export function readBillingInput(body: BillingInput): { changes: Partial<BillingSettings>; errors: Record<string, string> } {
  const changes: Partial<BillingSettings> = {};
  const errors: Record<string, string> = {};
  const text = (key: 'legalName' | 'address' | 'mention', max: number) => {
    if (!(key in body)) return;
    const v = body[key];
    if (v != null && typeof v !== 'string') errors[key] = 'invalid';
    else changes[key] = clean(v, max);
  };
  text('legalName', 120);
  text('address', 300);
  text('mention', 300);
  if ('siret' in body) {
    const v = body.siret;
    if (v == null || v === '') changes.siret = null;
    else if (typeof v !== 'string') errors.siret = 'invalid';
    else {
      const digits = v.replace(/[\s.]/g, '');
      if (!/^\d{14}$/.test(digits)) errors.siret = 'invalid';
      else changes.siret = digits;
    }
  }
  if ('vatNumber' in body) {
    const v = body.vatNumber;
    if (v == null || v === '') changes.vatNumber = null;
    else if (typeof v !== 'string') errors.vatNumber = 'invalid';
    else {
      const compact = v.replace(/[\s.-]/g, '').toUpperCase();
      if (!/^[A-Z]{2}[A-Z0-9]{2,13}$/.test(compact)) errors.vatNumber = 'invalid';
      else changes.vatNumber = compact;
    }
  }
  if ('vatExempt' in body) {
    if (typeof body.vatExempt !== 'boolean') errors.vatExempt = 'invalid';
    else changes.vatExempt = body.vatExempt;
  }
  if ('vatRatePercent' in body) {
    const v = typeof body.vatRatePercent === 'string' ? Number(body.vatRatePercent.replace(',', '.')) : body.vatRatePercent;
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100) errors.vatRatePercent = 'invalid';
    else changes.vatRateBp = Math.round(v * 100);
  }
  if ('prefix' in body) {
    const v = typeof body.prefix === 'string' ? body.prefix.trim().toUpperCase() : body.prefix;
    if (typeof v !== 'string' || !/^[A-Z0-9]{1,6}$/.test(v)) errors.prefix = 'invalid';
    else changes.prefix = v;
  }
  return { changes, errors };
}

/** « F-2026-0042 » for an invoice, « A-2026-0003 » for a credit note (its own series). */
export function invoiceNumber(kind: 'invoice' | 'credit_note', prefix: string, year: number, sequence: number): string {
  return `${kind === 'credit_note' ? 'A' : prefix}-${year}-${String(sequence).padStart(4, '0')}`;
}

/** A price including VAT split into excluding VAT and VAT, to the cent (the VAT is what remains). */
export function splitVat(totalTtcCents: number, vatRateBp: number): { htCents: number; vatCents: number } {
  if (vatRateBp <= 0) return { htCents: totalTtcCents, vatCents: 0 };
  const htCents = Math.round((totalTtcCents * 10000) / (10000 + vatRateBp));
  return { htCents, vatCents: totalTtcCents - htCents };
}

export interface InvoiceLine {
  label: string;
  detail: string | null;
  quantity: number;
  unitHtCents: number;
  totalHtCents: number;
  totalTtcCents: number;
}

/** One line per price including VAT, each split at the rate; the totals add the lines. */
export function invoiceLines(
  items: { label: string; detail: string | null; totalTtcCents: number }[],
  vatRateBp: number,
): { lines: InvoiceLine[]; totalHtCents: number; vatCents: number; totalTtcCents: number } {
  const lines = items.map(i => {
    const { htCents } = splitVat(i.totalTtcCents, vatRateBp);
    return { label: i.label, detail: i.detail, quantity: 1, unitHtCents: htCents, totalHtCents: htCents, totalTtcCents: i.totalTtcCents };
  });
  const totalTtcCents = lines.reduce((s, l) => s + l.totalTtcCents, 0);
  const totalHtCents = lines.reduce((s, l) => s + l.totalHtCents, 0);
  return { lines, totalHtCents, vatCents: totalTtcCents - totalHtCents, totalTtcCents };
}

/** « 1 234,50 € » with plain spaces (the PDF fonts have no narrow no-break space). */
export function euros(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${whole},${String(abs % 100).padStart(2, '0')} €`;
}

export const ratePercent = (bp: number) => `${(bp / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`;

/** Local date « 19/11/2026 » and time « 08:30 » in the parking's time zone. */
export function frDate(at: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('fr-FR', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).format(at);
}
export function frDateTime(at: Date, timeZone: string): string {
  const time = new Intl.DateTimeFormat('fr-FR', { timeZone, hour: '2-digit', minute: '2-digit' }).format(at);
  return `${frDate(at, timeZone)} ${time}`;
}

export interface InvoiceSeller {
  tradeName: string;
  legalName: string;
  address: string;
  siret: string;
  vatNumber: string | null;
  vatExempt: boolean;
  mention: string | null;
}

export interface InvoiceCustomer {
  name: string;
  email: string | null;
  company: string | null;
  address: string | null;
}

export interface InvoiceDocument {
  kind: 'invoice' | 'credit_note';
  /** Null for a preview. */
  number: string | null;
  issuedOn: string;
  reference: string;
  plate: string | null;
  creditOfNumber: string | null;
  seller: InvoiceSeller;
  customer: InvoiceCustomer;
  lines: InvoiceLine[];
  vatRateBp: number;
  totalHtCents: number;
  vatCents: number;
  totalTtcCents: number;
  paidBy: PaidBy | null;
}

export interface InvoiceLogo {
  bytes: Uint8Array;
  contentType: string;
}

/** The line under the totals: paid and how, or what remains to be paid. */
export function paymentLine(paidBy: PaidBy | null, kind: 'invoice' | 'credit_note'): string | null {
  if (kind === 'credit_note') return null;
  if (!paidBy) return null;
  if (paidBy === 'comparator') return 'Facture acquittée : payée au comparateur.';
  return `Facture acquittée : payée par ${PAID_BY_LABELS[paidBy].toLowerCase()}.`;
}

const INK = rgb(0.07, 0.07, 0.07);
const SOFT = rgb(0.42, 0.45, 0.5);
const RULE = rgb(0.85, 0.86, 0.87);
const GREEN = rgb(0.09, 0.4, 0.2);

async function embedLogo(pdf: PDFDocument, logo: InvoiceLogo | null): Promise<PDFImage | null> {
  if (!logo) return null;
  try {
    if (logo.contentType === 'image/png') return await pdf.embedPng(logo.bytes);
    if (logo.contentType === 'image/jpeg') return await pdf.embedJpg(logo.bytes);
  } catch {
    return null;
  }
  return null; // WebP: not drawable by pdf-lib, the invoice goes without it
}

function lines(text: string, font: PDFFont, size: number, width: number): string[] {
  return text.split('\n').flatMap(part => (part.trim() ? wrap(part.trim(), font, size, width) : []));
}

/** The invoice's PDF: A4, one page for a booking (a few lines), the logo top left. */
export async function buildInvoicePdf(doc: InvoiceDocument, logo: InvoiceLogo | null): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const title = doc.kind === 'credit_note' ? 'Avoir' : 'Facture';
  pdf.setTitle(doc.number ? `${title} ${doc.number}` : `${title} (aperçu)`);
  pdf.setAuthor(pdfSafe(doc.seller.tradeName));
  pdf.setCreator('Plazo');
  const page = pdf.addPage([595.28, 841.89]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const left = 48;
  const right = 595.28 - 48;
  let y = 841.89 - 48;
  const text = (t: string, x: number, at: number, size = 9.5, font = regular, color = INK) =>
    page.drawText(pdfSafe(t), { x, y: at, size, font, color });
  const textRight = (t: string, x: number, at: number, size = 9.5, font = regular, color = INK) =>
    page.drawText(pdfSafe(t), { x: x - font.widthOfTextAtSize(pdfSafe(t), size), y: at, size, font, color });

  // Seller, with the logo.
  const image = await embedLogo(pdf, logo);
  let sellerX = left;
  if (image) {
    const scale = Math.min(56 / image.width, 56 / image.height);
    page.drawImage(image, { x: left, y: y - image.height * scale, width: image.width * scale, height: image.height * scale });
    sellerX = left + 68;
  }
  const s = doc.seller;
  const sellerRows: [string, PDFFont, number][] = [
    [s.tradeName, bold, 12],
    ...(s.legalName !== s.tradeName ? [[s.legalName, regular, 9] as [string, PDFFont, number]] : []),
    ...lines(s.address, regular, 9, 230).map(l => [l, regular, 9] as [string, PDFFont, number]),
    [`SIRET ${s.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, '$1 $2 $3 $4')}`, regular, 9],
    ...(s.vatNumber ? [[`TVA intracommunautaire ${s.vatNumber}`, regular, 9] as [string, PDFFont, number]] : []),
  ];
  let sy = y - 10;
  for (const [t, font, size] of sellerRows) {
    text(t, sellerX, sy, size, font, font === bold ? INK : SOFT);
    sy -= size + 4;
  }

  // Customer, on the right.
  const c = doc.customer;
  let cy = y - 10;
  textRight(doc.kind === 'credit_note' ? 'Avoir pour' : 'Facturé à', right, cy, 8, regular, SOFT);
  cy -= 13;
  for (const [t, font] of [
    ...(c.company ? [[c.company, bold] as [string, PDFFont]] : []),
    [c.name, c.company ? regular : bold] as [string, PDFFont],
    ...(c.address ? lines(c.address, regular, 9, 200).map(l => [l, regular] as [string, PDFFont]) : []),
    ...(c.email ? [[c.email, regular] as [string, PDFFont]] : []),
  ]) {
    textRight(t, right, cy, font === bold ? 11 : 9, font, font === bold ? INK : SOFT);
    cy -= font === bold ? 15 : 13;
  }

  y = Math.min(sy, cy) - 26;
  text(doc.number ? `${title.toUpperCase()} ${doc.number}` : `${title.toUpperCase()} · APERÇU`, left, y, 20, bold);
  y -= 26;
  const meta: [string, string][] = [
    ["Date d'émission", doc.issuedOn],
    ['Réservation', doc.plate ? `${doc.reference} · ${doc.plate}` : doc.reference],
    ...(doc.creditOfNumber ? [['Annule la facture', doc.creditOfNumber] as [string, string]] : []),
  ];
  let mx = left;
  for (const [label, value] of meta) {
    text(label.toUpperCase(), mx, y, 7.5, regular, SOFT);
    text(value, mx, y - 13, 10, bold);
    mx += 170;
  }
  y -= 40;

  // Lines.
  const cols = { qty: right - 200, unit: right - 100, total: right };
  page.drawLine({ start: { x: left, y: y + 4 }, end: { x: right, y: y + 4 }, thickness: 0.8, color: RULE });
  text('DÉSIGNATION', left, y - 8, 7.5, regular, SOFT);
  textRight('QTÉ', cols.qty, y - 8, 7.5, regular, SOFT);
  textRight('PU HT', cols.unit, y - 8, 7.5, regular, SOFT);
  textRight('TOTAL HT', cols.total, y - 8, 7.5, regular, SOFT);
  y -= 16;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: RULE });
  y -= 16;
  for (const l of doc.lines) {
    text(l.label, left, y, 10, bold);
    textRight(String(l.quantity), cols.qty, y, 10);
    textRight(euros(l.unitHtCents), cols.unit, y, 10);
    textRight(euros(l.totalHtCents), cols.total, y, 10);
    y -= 13;
    if (l.detail) {
      for (const d of lines(l.detail, regular, 8.5, cols.qty - left - 60)) {
        text(d, left, y, 8.5, regular, SOFT);
        y -= 11;
      }
    }
    y -= 6;
    page.drawLine({ start: { x: left, y: y + 4 }, end: { x: right, y: y + 4 }, thickness: 0.4, color: RULE });
    y -= 8;
  }

  // Totals.
  const tx = right - 210;
  const total = (label: string, value: string, strong = false) => {
    text(label, tx, y, strong ? 11 : 9.5, strong ? bold : regular, strong ? INK : SOFT);
    textRight(value, right, y, strong ? 11 : 9.5, strong ? bold : regular);
    y -= strong ? 18 : 15;
  };
  y -= 4;
  total('Total HT', euros(doc.totalHtCents));
  total(s.vatExempt ? 'TVA' : `TVA ${ratePercent(doc.vatRateBp)}`, s.vatExempt ? '0,00 €' : euros(doc.vatCents));
  page.drawLine({ start: { x: tx, y: y + 10 }, end: { x: right, y: y + 10 }, thickness: 1.2, color: INK });
  y -= 2;
  total('Total TTC', euros(doc.totalTtcCents), true);

  const paid = paymentLine(doc.paidBy, doc.kind);
  if (paid) {
    y -= 6;
    text(paid, left, y, 10, bold, GREEN);
    y -= 16;
  }

  // Mentions, at the foot.
  const foot = [
    ...(s.vatExempt ? [VAT_EXEMPT_MENTION] : []),
    ...(doc.kind === 'credit_note' && doc.creditOfNumber ? [`Avoir annulant la facture ${doc.creditOfNumber}.`] : []),
    ...(s.mention ? [s.mention] : []),
    ...(doc.number ? [] : ['Aperçu : ce document n’est pas une facture.']),
    `${title} émis${doc.kind === 'credit_note' ? '' : 'e'} par ${s.tradeName} avec Plazo.`,
  ];
  let fy = 60;
  page.drawLine({
    start: { x: left, y: fy + 14 + (foot.length - 1) * 11 },
    end: { x: right, y: fy + 14 + (foot.length - 1) * 11 },
    thickness: 0.5,
    color: RULE,
  });
  for (const f of foot.reverse()) {
    for (const l of lines(f, regular, 8, right - left).reverse()) {
      text(l, left, fy, 8, regular, SOFT);
      fy += 11;
    }
  }
  return pdf.save();
}
