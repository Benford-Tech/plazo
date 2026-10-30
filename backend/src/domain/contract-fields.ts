import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { formatEuros } from './booking-messages';
import { pdfSafe } from './partner-contract';

/**
 * The parking's contract pre-filled (30/10/2026, « le contrat doit être pré-rempli avec les infos et la date de
 * signature », direction A « Calque placé par le gérant »): the manager places, once per version of the PDF, where each
 * piece of information goes (the dotted lines of the contract); Plazo stamps the booking's values there on the PDF the
 * traveller reads, then on the signed PDF with the date of signature and the signature. Pure functions.
 */

export const CONTRACT_FIELD_KEYS = [
  'customer_name',
  'phone',
  'plate',
  'vehicle',
  'arrival_at',
  'return_at',
  'price',
  'reference',
  'return_flight',
  'signed_on',
  'signature',
] as const;
export type ContractFieldKey = (typeof CONTRACT_FIELD_KEYS)[number];

/** A box on a page: 0-based page, then left, top, width and height as fractions (0–1) of the page, from its top left. */
export interface ContractField {
  key: ContractFieldKey;
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Text size in points (6–24), 10 by default. */
  size?: number;
}

export const MAX_FIELDS = 40;
export const DEFAULT_FIELD_SIZE = 10;

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const round = (v: number) => Math.round(v * 10000) / 10000;

/** Checks the fields sent by the editor; `null` with the first problem's code when one is wrong. */
export function validateFields(raw: unknown, pageCount: number): { fields: ContractField[] } | { error: string } {
  if (!Array.isArray(raw)) return { error: 'invalid' };
  if (raw.length > MAX_FIELDS) return { error: 'too_many' };
  const fields: ContractField[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return { error: 'invalid' };
    const f = item as Record<string, unknown>;
    if (!CONTRACT_FIELD_KEYS.includes(f.key as ContractFieldKey)) return { error: 'invalid_key' };
    if (!Number.isInteger(f.page) || (f.page as number) < 0 || (f.page as number) >= pageCount) return { error: 'invalid_page' };
    if (![f.x, f.y, f.w, f.h].every(isNumber)) return { error: 'invalid_box' };
    const [x, y, w, h] = [f.x, f.y, f.w, f.h] as number[];
    if (x < 0 || y < 0 || w < 0.01 || h < 0.005 || x + w > 1.0001 || y + h > 1.0001) return { error: 'invalid_box' };
    if (f.size !== undefined && f.size !== null && (!isNumber(f.size) || f.size < 6 || f.size > 24)) return { error: 'invalid_size' };
    fields.push({
      key: f.key as ContractFieldKey,
      page: f.page as number,
      x: round(x),
      y: round(y),
      w: round(w),
      h: round(h),
      ...(isNumber(f.size) ? { size: Math.round(f.size * 2) / 2 } : {}),
    });
  }
  return { fields };
}

/** Reads the fields kept on a template (JSON column), dropping anything malformed. */
export function fieldsOf(raw: unknown): ContractField[] {
  if (!Array.isArray(raw)) return [];
  const out: ContractField[] = [];
  for (const item of raw) {
    const checked = validateFields([item], Number.MAX_SAFE_INTEGER);
    if ('fields' in checked) out.push(...checked.fields);
  }
  return out;
}

export interface FieldFacts {
  customerName: string;
  phone: string;
  plate: string;
  vehicle: string | null;
  /** Local to the parking, "2026-11-12T06:30". */
  arrivalAt: string;
  returnAt: string;
  priceCents: number | null;
  reference: string;
  returnFlight: string | null;
  /** Local day of the signature ("2026-10-30"): the signature's, or today's on the PDF read before signing. */
  signedOn: string;
}

/** "2026-10-30T08:00" -> "30/10/2026 08:00"; "2026-10-30" -> "30/10/2026". */
export function frenchDate(local: string): string {
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-');
  return time ? `${d}/${m}/${y} ${time.slice(0, 5)}` : `${d}/${m}/${y}`;
}

/** The text stamped for each key (the signature is drawn apart). */
export function fieldValues(f: FieldFacts): Record<Exclude<ContractFieldKey, 'signature'>, string> {
  return {
    customer_name: f.customerName,
    phone: f.phone,
    plate: f.plate,
    vehicle: f.vehicle ?? '',
    arrival_at: frenchDate(f.arrivalAt),
    return_at: frenchDate(f.returnAt),
    price: f.priceCents == null ? '' : formatEuros(f.priceCents).replace(/ | /g, ' '),
    reference: f.reference,
    return_flight: f.returnFlight ?? '',
    signed_on: frenchDate(f.signedOn),
  };
}

/** The signature as signed: the strokes drawn on the pad (0–1), or a line saying how it was signed. */
export interface StampedSignature {
  strokes: number[][][] | null;
  label: string;
}

const INK = rgb(0.06, 0.12, 0.35);

/**
 * Stamps the values in their boxes, on the pages as they are (no page added). Text is shrunk to fit its box (6 pt at
 * least); the signature box stays empty before the signature.
 */
export async function stampFields(pdf: PDFDocument, fields: ContractField[], facts: FieldFacts, signature: StampedSignature | null): Promise<void> {
  if (!fields.length) return;
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const values = fieldValues(facts);
  const pages = pdf.getPages();
  for (const f of fields) {
    const page = pages[f.page];
    if (!page) continue;
    const { x: left0, y: bottom0, width, height } = page.getCropBox();
    const boxX = left0 + f.x * width;
    const boxW = f.w * width;
    const boxH = f.h * height;
    const boxBottom = bottom0 + height - (f.y + f.h) * height;
    if (f.key === 'signature') {
      if (!signature) continue;
      if (signature.strokes?.length) {
        for (const stroke of signature.strokes) {
          for (let i = 1; i < stroke.length; i += 1) {
            const [x1, y1] = stroke[i - 1];
            const [x2, y2] = stroke[i];
            page.drawLine({
              start: { x: boxX + x1 * boxW, y: boxBottom + boxH - y1 * boxH },
              end: { x: boxX + x2 * boxW, y: boxBottom + boxH - y2 * boxH },
              thickness: 1.2,
              color: INK,
            });
          }
        }
        continue;
      }
      drawFitted(page, font, signature.label, boxX, boxBottom, boxW, boxH, f.size ?? 9);
      continue;
    }
    const text = values[f.key];
    if (text) drawFitted(page, font, text, boxX, boxBottom, boxW, boxH, f.size ?? DEFAULT_FIELD_SIZE);
  }
}

function drawFitted(
  page: ReturnType<PDFDocument['getPages']>[number],
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  raw: string,
  x: number,
  bottom: number,
  w: number,
  h: number,
  wanted: number,
) {
  const text = pdfSafe(raw);
  let size = Math.min(wanted, h * 0.85);
  while (size > 6 && font.widthOfTextAtSize(text, size) > w) size -= 0.5;
  let shown = text;
  while (shown.length > 1 && font.widthOfTextAtSize(shown, size) > w) shown = `${shown.slice(0, -2)}…`;
  page.drawText(pdfSafe(shown), { x: x + 1, y: bottom + (h - size) / 2 + size * 0.22, size, font, color: INK });
}

/** The parking's PDF with the booking's values stamped (the PDF read before signing). */
export async function prefilledPdf(
  original: Buffer,
  fields: ContractField[],
  facts: FieldFacts,
  signature: StampedSignature | null = null,
): Promise<Buffer> {
  const pdf = await PDFDocument.load(original, { updateMetadata: false });
  await stampFields(pdf, fields, facts, signature);
  return Buffer.from(await pdf.save());
}

/** Example values for the editor's preview. */
export const SAMPLE_FACTS: FieldFacts = {
  customerName: 'Claire Martin',
  phone: '06 12 34 56 78',
  plate: 'GH-456-JK',
  vehicle: 'Renault Zoé blanche',
  arrivalAt: '2026-11-12T08:00',
  returnAt: '2026-11-19T18:30',
  priceCents: 5400,
  reference: 'R7KQ2M',
  returnFlight: 'TO 3627',
  signedOn: '2026-11-12',
};

/** The values of a booking, its parking's clock, and the day it is (or was) signed. */
export function bookingFieldFacts(
  r: {
    customerName: string;
    customerPhone: string;
    plate: string;
    vehicleModel: string | null;
    vehicleColour: string | null;
    arrivalAt: Date;
    returnAt: Date;
    priceCents: number | null;
    reference: string;
    returnFlight: string | null;
  },
  local: (d: Date) => string,
  signedAt: Date,
): FieldFacts {
  return {
    customerName: r.customerName,
    phone: r.customerPhone,
    plate: r.plate,
    vehicle: [r.vehicleModel, r.vehicleColour].filter(Boolean).join(' ') || null,
    arrivalAt: local(r.arrivalAt),
    returnAt: local(r.returnAt),
    priceCents: r.priceCents,
    reference: r.reference,
    returnFlight: r.returnFlight,
    signedOn: local(signedAt).slice(0, 10),
  };
}

/** How the signature box reads on the signed PDF: the strokes, or « Signé par code SMS · 09:47 ». */
export function signatureStamp(method: 'sms_code' | 'handwritten', strokes: number[][][] | null, signedAtLocal: string): StampedSignature {
  const time = signedAtLocal.slice(11, 16);
  return method === 'handwritten' && strokes?.length ? { strokes, label: '' } : { strokes: null, label: `Signé par code SMS · ${time}` };
}
