/**
 * Condition reports (« état des lieux », 19/10/2026): at the drop-off and at the return, taken by the staff in Plazo Pro,
 * answered by the traveller. Pure rules: the guided photos, the damages on the car's outline, when a report is complete,
 * the comparison at the return and how long the photos are kept.
 */

/** The six guided photos, in the order the app asks for them. */
export const REQUIRED_SLOTS = ['front', 'right', 'back', 'left', 'dashboard', 'interior'] as const;
/** A close-up of a damage: any number, up to MAX_DAMAGE_PHOTOS. */
export const DAMAGE_SLOT = 'damage';
export type PhotoSlot = (typeof REQUIRED_SLOTS)[number] | typeof DAMAGE_SLOT;
export const SLOTS: readonly string[] = [...REQUIRED_SLOTS, DAMAGE_SLOT];

export const MAX_DAMAGES = 20;
export const MAX_DAMAGE_PHOTOS = 12;
/** A photo as the app sends it: JPEG (or HEIC/PNG), already shrunk, 3 MB at most. */
export const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp'] as const;
export const MAX_RESERVE_LENGTH = 1000;
export const MAX_NOTES_LENGTH = 1000;

/** Photos are erased 90 days after the return, 365 when the traveller made a reservation (a dispute). */
export const PHOTO_RETENTION_DAYS = 90;
export const DISPUTED_PHOTO_RETENTION_DAYS = 365;

export interface Damage {
  n: number;
  x: number;
  y: number;
  label: string;
  photoId: string | null;
}

export const isSlot = (value: unknown): value is PhotoSlot => typeof value === 'string' && SLOTS.includes(value);

/**
 * The damages as sent by the app, checked and numbered 1, 2, 3… in order. Returns null with a field code when invalid:
 * too_many, invalid (a point off the outline, a label too long or empty).
 */
export function cleanDamages(input: unknown): { ok: true; value: Damage[] } | { ok: false; code: string } {
  if (!Array.isArray(input)) return { ok: false, code: 'invalid' };
  if (input.length > MAX_DAMAGES) return { ok: false, code: 'too_many' };
  const value: Damage[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') return { ok: false, code: 'invalid' };
    const { x, y, label, photoId } = raw as Record<string, unknown>;
    if (typeof x !== 'number' || typeof y !== 'number' || !(x >= 0 && x <= 1 && y >= 0 && y <= 1)) return { ok: false, code: 'invalid' };
    const text = typeof label === 'string' ? label.replace(/\s+/g, ' ').trim() : '';
    if (!text || text.length > 120) return { ok: false, code: 'invalid' };
    if (photoId != null && typeof photoId !== 'string') return { ok: false, code: 'invalid' };
    value.push({
      n: value.length + 1,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      label: text,
      photoId: (photoId as string) ?? null,
    });
  }
  return { ok: true, value };
}

/** The guided photos still missing (a report is complete once all six are there, mileage and fuel too). */
export function missingSlots(slots: string[]): string[] {
  return REQUIRED_SLOTS.filter(s => !slots.includes(s));
}

export function missingForCompletion(report: { slots: string[]; mileageKm: number | null; fuelQuarters: number | null }): string[] {
  const missing: string[] = [...missingSlots(report.slots)];
  if (report.mileageKm == null) missing.push('mileageKm');
  if (report.fuelQuarters == null) missing.push('fuelQuarters');
  return missing;
}

/**
 * The drop-off report answers itself once the traveller has left in the shuttle without answering (the report stands
 * as made: « Sans réponse avant votre départ en navette, l'état des lieux est validé tel quel »).
 */
export const STATUSES_AFTER_DROPOFF = ['shuttled_out', 'return_requested', 'back_at_parking', 'returned'] as const;

export function dropoffAnswersItself(status: string): boolean {
  return (STATUSES_AFTER_DROPOFF as readonly string[]).includes(status);
}

/** Whether the traveller may still answer a report (completed, not answered yet, and the booking still open). */
export function canAnswer(report: { completedAt: Date | null; decision: string }, status: string, kind: 'dropoff' | 'return'): boolean {
  if (!report.completedAt || report.decision !== 'pending') return false;
  if (status === 'cancelled' || status === 'no_show') return false;
  return kind === 'return' || !dropoffAnswersItself(status);
}

/** The day the photos of a booking are erased. */
export function photosEraseAfter(returnAt: Date, disputed: boolean): Date {
  const days = disputed ? DISPUTED_PHOTO_RETENTION_DAYS : PHOTO_RETENTION_DAYS;
  return new Date(returnAt.getTime() + days * 86400000);
}

/** The latest return still keeping its photos: a booking returned before it has them erased (undisputed). */
export function photosCutoff(now: Date, disputed: boolean): Date {
  const days = disputed ? DISPUTED_PHOTO_RETENTION_DAYS : PHOTO_RETENTION_DAYS;
  return new Date(now.getTime() - days * 86400000);
}

export interface ReturnComparison {
  /** Damages of the drop-off report (already there). */
  before: Damage[];
  /** Damages marked at the return. */
  after: Damage[];
  mileageDeltaKm: number | null;
  fuelDeltaQuarters: number | null;
}

export function compareReports(
  dropoff: { damages: Damage[]; mileageKm: number | null; fuelQuarters: number | null } | null,
  ret: { damages: Damage[]; mileageKm: number | null; fuelQuarters: number | null },
): ReturnComparison {
  return {
    before: dropoff?.damages ?? [],
    after: ret.damages,
    mileageDeltaKm: dropoff?.mileageKm != null && ret.mileageKm != null ? ret.mileageKm - dropoff.mileageKm : null,
    fuelDeltaQuarters: dropoff?.fuelQuarters != null && ret.fuelQuarters != null ? ret.fuelQuarters - dropoff.fuelQuarters : null,
  };
}

/** Sniffs the image type from its first bytes (the Content-Type header alone is not trusted). */
export function sniffImage(bytes: Buffer): (typeof PHOTO_TYPES)[number] | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = bytes.subarray(8, 12).toString('ascii');
    if (['heic', 'heix', 'mif1', 'msf1', 'hevc'].includes(brand)) return 'image/heic';
  }
  return null;
}
