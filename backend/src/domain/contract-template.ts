import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { ContractDocument, ContractFacts, contractDocument } from './contract';
import { pdfSafe, sha256Hex, wrap } from './partner-contract';

/**
 * The parking's own contract (26/10/2026, « chaque parking peut héberger le contrat de stationnement à ses clients »,
 * choice A « Mon PDF »). The parking uploads its contract as a PDF; the traveller signs it at the counter as before (SMS
 * code or handwritten), and Plazo keeps, for every signature, the PDF signed (the parking's PDF untouched, or Plazo's
 * template laid out, plus a « Réservation et signature » page) and the proof (that page alone). Pure functions.
 */

export const DEFAULT_TEMPLATE_TITLE = 'Contrat de stationnement';
/** The version kept on a signature made on the parking's PDF v3: "pdf-3". */
export const templateVersion = (version: number) => `pdf-${version}`;

export interface TemplateFacts {
  id: string;
  title: string;
  version: number;
  pageCount: number;
  sha256: string;
}

/**
 * What the traveller signs when the parking hosts its PDF: the booking's lines, then clauses that bind the signature to
 * that very document (its fingerprint). The parking's own clauses are in the PDF, read before signing.
 */
export function templateDocument(f: ContractFacts, t: TemplateFacts): ContractDocument {
  const base = contractDocument(f);
  const pages = `${t.pageCount} page${t.pageCount > 1 ? 's' : ''}`;
  return {
    title: base.title,
    summary: [...base.summary, `Contrat : « ${t.title} », version ${t.version} (${pages}), empreinte SHA-256 ${t.sha256}`],
    clauses: [
      `Contrat. Le client signe le contrat de stationnement du parking « ${t.title} » (version ${t.version}, ${pages}), qu'il a lu en entier avant de signer et dont l'empreinte SHA-256 est ${t.sha256}. Ce contrat s'applique à la réservation ci-dessus.`,
      `État des lieux. Un état des lieux avec photos est fait au dépôt et au retour, dans l'application du parking. Le client le valide ou fait une réserve. Sans réponse avant son départ en navette, l'état des lieux du dépôt vaut accord.`,
      `Signature. Le client signe ce contrat électroniquement, par un code reçu par SMS ou par une signature manuscrite sur l'appareil du parking. Une copie signée lui est envoyée par e-mail.`,
    ],
  };
}

export interface SignatureFacts {
  productName: string;
  /** Kept on the page: the proof names the booking, never the operator's database id. */
  bookingReference: string;
  parkingTimeZone: string;
  signedAtLocal: string;
  signedAt: Date;
  signerName: string;
  method: 'sms_code' | 'handwritten';
  device: 'staff_device' | 'traveller_app';
  phoneMasked: string | null;
  witnessName: string | null;
  strokes: number[][][] | null;
  textSha256: string;
  proofSha256: string;
  template: TemplateFacts | null;
}

const A4: [number, number] = [595.28, 841.89];
const LEFT = 56;
const WIDTH = A4[0] - LEFT * 2;
const INK = rgb(0.1, 0.11, 0.1);
const SOFT = rgb(0.42, 0.45, 0.5);

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

async function fontsOf(doc: PDFDocument): Promise<Fonts> {
  return {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
}

/** A writer that adds pages as the text flows. */
class Writer {
  public page: PDFPage;
  public y: number;
  constructor(
    private readonly doc: PDFDocument,
    private readonly fonts: Fonts,
  ) {
    this.page = doc.addPage(A4);
    this.y = A4[1] - 64;
  }

  private ensure(height: number) {
    if (this.y - height < 56) {
      this.page = this.doc.addPage(A4);
      this.y = A4[1] - 64;
    }
  }

  public text(value: string, opts: { size: number; font?: PDFFont; color?: ReturnType<typeof rgb>; gap?: number } = { size: 10.5 }) {
    const font = opts.font ?? this.fonts.regular;
    const lineHeight = opts.size * 1.35;
    for (const line of wrap(value, font, opts.size, WIDTH)) {
      this.ensure(lineHeight);
      this.page.drawText(line, { x: LEFT, y: this.y, size: opts.size, font, color: opts.color ?? INK });
      this.y -= lineHeight;
    }
    this.y -= opts.gap ?? 0;
  }

  public row(label: string, value: string) {
    this.ensure(24);
    this.page.drawText(pdfSafe(label.toUpperCase()), { x: LEFT, y: this.y, size: 7, font: this.fonts.bold, color: SOFT });
    this.y -= 9;
    const isHash = /^[0-9a-f]{64}$/.test(value);
    this.text(value, { size: 9.5, font: isHash ? this.fonts.mono : this.fonts.regular, gap: 2 });
  }

  /** The handwritten signature as drawn (0–1 of the pad), in a 240 × 120 box. */
  public strokes(strokes: number[][][]) {
    const w = 180;
    const h = 70;
    this.ensure(h + 24);
    const top = this.y;
    this.page.drawRectangle({ x: LEFT, y: top - h, width: w, height: h, borderColor: SOFT, borderWidth: 0.5 });
    for (const stroke of strokes) {
      for (let i = 1; i < stroke.length; i += 1) {
        const [x1, y1] = stroke[i - 1];
        const [x2, y2] = stroke[i];
        this.page.drawLine({
          start: { x: LEFT + x1 * w, y: top - y1 * h },
          end: { x: LEFT + x2 * w, y: top - y2 * h },
          thickness: 1.2,
          color: INK,
        });
      }
    }
    this.y = top - h - 12;
  }
}

const METHOD_LABEL = { sms_code: 'code à usage unique reçu par SMS', handwritten: "signature manuscrite sur l'appareil" } as const;
const DEVICE_LABEL = { staff_device: 'le téléphone du parking', traveller_app: "l'application du voyageur" } as const;

/** The rows of the « Réservation et signature » page, label then value (the signed PDF's fingerprint on the proof only). */
export function signatureRows(doc: ContractDocument, f: SignatureFacts, signedSha256?: string): [string, string][] {
  const how = `${METHOD_LABEL[f.method]}${f.phoneMasked ? ` (${f.phoneMasked})` : ''}, sur ${DEVICE_LABEL[f.device]}${f.witnessName ? ` de ${f.witnessName}` : ''}`;
  return [
    ...doc.summary.map(line => {
      const i = line.indexOf(' : ');
      return (i > 0 ? [line.slice(0, i), line.slice(i + 3)] : ['Réservation', line]) as [string, string];
    }),
    ['Référence de la réservation', f.bookingReference],
    ['Signé par', f.signerName],
    ['Moyen', how],
    ['Date et heure', `${f.signedAtLocal.replace('T', ' à ')} (heure du parking, ${f.parkingTimeZone}) · ${f.signedAt.toISOString()}`],
    ['Empreinte SHA-256 du texte signé', f.textSha256],
    ...(f.template ? ([['Empreinte SHA-256 du contrat du parking', f.template.sha256]] as [string, string][]) : []),
    ['Empreinte de la signature', f.proofSha256],
    ...(signedSha256 ? ([['Empreinte SHA-256 du PDF signé', signedSha256]] as [string, string][]) : []),
  ];
}

async function drawSignaturePage(pdf: PDFDocument, doc: ContractDocument, f: SignatureFacts, signedSha256?: string) {
  const fonts = await fontsOf(pdf);
  const w = new Writer(pdf, fonts);
  w.text('Réservation et signature', { size: 20, font: fonts.bold, gap: 6 });
  w.text(`Page ajoutée par ${f.productName} au moment de la signature${f.template ? ', à la suite du contrat du parking' : ''}.`, {
    size: 10,
    color: SOFT,
    gap: 14,
  });
  for (const [label, value] of signatureRows(doc, f, signedSha256)) w.row(label, value);
  w.text('Ce que le client a signé', { size: 8, font: fonts.bold, color: SOFT, gap: 4 });
  doc.clauses.forEach((clause, i) => w.text(`${i + 1}. ${clause}`, { size: 9.5, gap: 3 }));
  if (f.strokes?.length) {
    w.y -= 8;
    w.text('Signature manuscrite', { size: 8, font: fonts.bold, color: SOFT, gap: 4 });
    w.strokes(f.strokes);
  }
  w.y -= 6;
  w.text(
    `L'empreinte SHA-256 identifie un document au bit près : le moindre changement la modifie. ${f.productName} garde le contrat tel que signé, ce PDF et cette preuve.`,
    { size: 8.5, color: SOFT },
  );
}

/** Plazo's template laid out (title, the booking's lines, the numbered clauses) when the parking hosts no PDF. */
async function drawTemplatePages(pdf: PDFDocument, doc: ContractDocument) {
  const fonts = await fontsOf(pdf);
  const w = new Writer(pdf, fonts);
  w.text(doc.title, { size: 18, font: fonts.bold, gap: 10 });
  for (const line of doc.summary) w.text(line, { size: 10.5, gap: 2 });
  w.y -= 10;
  doc.clauses.forEach((clause, i) => w.text(`${i + 1}. ${clause}`, { size: 10.5, gap: 5 }));
}

/**
 * The PDF signed (the parking's PDF untouched, or Plazo's template laid out, with the « Réservation et signature » page
 * at its end) and the proof (that page alone, with the signed PDF's fingerprint too).
 */
export async function buildSignedContractPdf(
  original: Buffer | null,
  doc: ContractDocument,
  f: SignatureFacts,
): Promise<{ signed: Buffer; signedSha256: string; proof: Buffer }> {
  let pdf: PDFDocument;
  if (original) pdf = await PDFDocument.load(original, { updateMetadata: false });
  else {
    pdf = await PDFDocument.create();
    pdf.setTitle(pdfSafe(doc.title));
    pdf.setProducer(f.productName);
    await drawTemplatePages(pdf, doc);
  }
  await drawSignaturePage(pdf, doc, f);
  const signed = Buffer.from(await pdf.save());
  const signedSha256 = sha256Hex(signed);

  const proofDoc = await PDFDocument.create();
  proofDoc.setTitle(pdfSafe(`Preuve de signature · ${f.bookingReference}`));
  proofDoc.setProducer(f.productName);
  await drawSignaturePage(proofDoc, doc, f, signedSha256);
  const proof = Buffer.from(await proofDoc.save());
  return { signed, signedSha256, proof };
}

/** The file names of a signature's PDFs, from the booking's reference. */
export function signedFileNames(reference: string): { signed: string; proof: string } {
  const safe = reference.replace(/[^A-Za-z0-9-]+/g, '-');
  return { signed: `contrat-${safe}-signe.pdf`, proof: `preuve-signature-${safe}.pdf` };
}
