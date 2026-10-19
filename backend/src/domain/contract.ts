import { createHash, createHmac, randomInt, timingSafeEqual } from 'crypto';
import { formatEuros, formatLocalLong } from './booking-messages';

/**
 * The parking contract of a booking (19/10/2026, « Intègre un outil de signature numérique des contrats », choice A:
 * Plazo's own simple electronic signature, everything in the apps). Pure functions: the text signed, its fingerprint,
 * the one-time SMS codes. The template is Plazo's, to be checked by a lawyer like the terms (site/src/lib/legal.ts).
 */

/** Version of the template: a signed contract keeps the version and the whole text it was signed with. */
export const CONTRACT_VERSION = '2026-10-19';

/** One-time codes: 6 digits, valid 10 minutes, 5 tries each; a new code at most every 60 s and 5 per hour per booking. */
export const CODE_TTL_MS = 10 * 60 * 1000;
export const CODE_MAX_ATTEMPTS = 5;
export const CODE_RESEND_AFTER_MS = 60 * 1000;
export const CODES_PER_HOUR = 5;

export interface ContractFacts {
  operatorName: string;
  parkingName: string;
  parkingAddress: string | null;
  customerName: string;
  plate: string;
  vehicle: string | null;
  /** Local to the parking, "2026-11-12T06:30". */
  arrivalAt: string;
  returnAt: string;
  priceCents: number | null;
  /** The keys are left with the parking (a valet parks the car). */
  keysEntrusted: boolean;
  /** Paid online on Plazo. */
  paidOnline: boolean;
}

export interface ContractDocument {
  title: string;
  /** The parties and the stay, one line each. */
  summary: string[];
  clauses: string[];
}

/** The contract as signed (French). */
export function contractDocument(f: ContractFacts): ContractDocument {
  const vehicle = [f.vehicle, f.plate || null].filter(Boolean).join(' · ') || 'Véhicule du client';
  const price = f.priceCents == null ? null : `${formatEuros(f.priceCents)}${f.paidOnline ? ', payé en ligne' : ''}`;
  const summary = [
    `Loueur : ${f.operatorName}, parking « ${f.parkingName} »${f.parkingAddress ? `, ${f.parkingAddress}` : ''}`,
    `Client : ${f.customerName}`,
    `Véhicule : ${vehicle}`,
    `Dépôt : ${formatLocalLong(f.arrivalAt)}`,
    `Retour : ${formatLocalLong(f.returnAt)}`,
    ...(price ? [`Prix : ${price}`] : []),
    `Clés : ${f.keysEntrusted ? 'confiées au parking' : 'gardées par le client'}`,
  ];
  const clauses = [
    `Objet. Le loueur garde le véhicule ci-dessus sur son parking du dépôt au retour et conduit le client et ses passagers entre le parking et l'aéroport en navette, à l'aller comme au retour.`,
    f.keysEntrusted
      ? `Clés. Le client confie les clés au parking, qui peut déplacer le véhicule sur le parking pour le ranger. Le véhicule ne quitte pas le parking avant le retour.`
      : `Clés. Le client garde ses clés ; le véhicule n'est pas déplacé par le parking.`,
    `État des lieux. Un état des lieux avec photos est fait au dépôt et au retour, dans l'application du parking. Le client le valide ou fait une réserve. Sans réponse avant son départ en navette, l'état des lieux du dépôt vaut accord.`,
    `Dommages. Un dommage absent de l'état des lieux du dépôt et constaté au retour est signalé par une réserve du client, puis traité par le loueur selon ses conditions et son assurance.`,
    `Objets personnels. Le client ne laisse pas d'objet de valeur dans le véhicule ; le loueur n'en répond pas.`,
    `Annulation. Les conditions d'annulation sont celles de la réservation, rappelées dans sa confirmation.`,
    `Données. Les photos de l'état des lieux sont gardées 90 jours après le retour, 12 mois en cas de réserve, puis effacées.`,
    `Signature. Le client signe ce contrat électroniquement, par un code reçu par SMS ou par une signature manuscrite sur l'appareil du parking. Une copie lui est envoyée par e-mail.`,
  ];
  return { title: `Contrat de stationnement · ${f.parkingName}`, summary, clauses };
}

/** The exact text signed: title, summary and numbered clauses, one per line. */
export function contractText(doc: ContractDocument): string {
  return [doc.title, '', ...doc.summary, '', ...doc.clauses.map((c, i) => `${i + 1}. ${c}`)].join('\n');
}

export const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

/** Fingerprint of a signature: the text, who, how, when (and the drawn strokes' fingerprint). */
export function proofOf(text: string, signer: string, method: string, signedAt: Date, extra = ''): string {
  return sha256([sha256(text), signer, method, signedAt.toISOString(), extra].join('\n'));
}

/** "06 12 34 56 42" -> "06 •• •• •• 42". */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '••';
  const local = digits.startsWith('33') && digits.length === 11 ? `0${digits.slice(2)}` : digits;
  return `${local.slice(0, 2)} •• •• •• ${local.slice(-2)}`;
}

export const newCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

export function hashCode(secret: string, codeId: string, code: string): string {
  return createHmac('sha256', secret).update(`${codeId}:${code}`).digest('hex');
}

export function codeMatches(secret: string, codeId: string, code: string, expected: string): boolean {
  const clean = code.replace(/\D/g, '');
  if (clean.length !== 6) return false;
  const a = Buffer.from(hashCode(secret, codeId, clean), 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** The SMS carrying the code. */
export function codeSms(productName: string, code: string): string {
  return `${productName} : votre code pour signer le contrat de stationnement est ${code}. Valable 10 minutes. Ne le donnez qu'au parking, en personne.`;
}

/**
 * Handwritten strokes from the app: up to 40 strokes of up to 400 points, each [x, y] from 0 to 1, rounded to 3
 * decimals. Null when unusable (too few points to be a signature).
 */
export function cleanStrokes(input: unknown): number[][][] | null {
  if (!Array.isArray(input) || input.length === 0 || input.length > 40) return null;
  const strokes: number[][][] = [];
  let points = 0;
  for (const stroke of input) {
    if (!Array.isArray(stroke) || stroke.length > 400) return null;
    const clean: number[][] = [];
    for (const p of stroke) {
      if (!Array.isArray(p) || p.length !== 2) return null;
      const [x, y] = p;
      if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) return null;
      if (x < 0 || x > 1 || y < 0 || y > 1) return null;
      clean.push([Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]);
    }
    if (clean.length) strokes.push(clean);
    points += clean.length;
  }
  return points >= 5 ? strokes : null;
}
