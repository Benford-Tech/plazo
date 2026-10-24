/**
 * Child car seats for the shuttle (24/10/2026, direction B « par âge »): the traveller says how many
 * children of each age group ride along, the parking installs the matching seats in the shuttle, both
 * ways, for free. Children count in the booking's passengers, so a booking always has at least one
 * adult: seats < passengers.
 */
export type ChildSeatKind = 'infant' | 'toddler' | 'booster';

export const CHILD_SEAT_KINDS: readonly ChildSeatKind[] = ['infant', 'toddler', 'booster'];

/** The most of one kind a booking may ask for (the CHECK of the migration says the same). */
export const MAX_CHILD_SEATS_PER_KIND = 4;

export interface ChildSeats {
  /** Up to 12 months: rear-facing seat. */
  infant: number;
  /** 1 to 4 years: child seat. */
  toddler: number;
  /** 4 to 10 years: booster. */
  booster: number;
}

export const NO_CHILD_SEATS: ChildSeats = { infant: 0, toddler: 0, booster: 0 };

/** French labels, singular and plural, as the drivers and travellers read them. */
export const CHILD_SEAT_LABELS: Record<ChildSeatKind, { one: string; many: string; ages: string }> = {
  infant: { one: 'siège bébé', many: 'sièges bébé', ages: "jusqu'à 12 mois" },
  toddler: { one: 'siège 1 à 4 ans', many: 'sièges 1 à 4 ans', ages: '1 à 4 ans' },
  booster: { one: 'réhausseur', many: 'réhausseurs', ages: '4 à 10 ans' },
};

export function childSeatsOf(row: { childSeatInfant: number; childSeatToddler: number; childSeatBooster: number }): ChildSeats {
  return { infant: row.childSeatInfant, toddler: row.childSeatToddler, booster: row.childSeatBooster };
}

/** The columns to write for a `ChildSeats` (missing or null: none). */
export function childSeatColumns(seats: Partial<ChildSeats> | null | undefined) {
  return {
    childSeatInfant: seats?.infant ?? 0,
    childSeatToddler: seats?.toddler ?? 0,
    childSeatBooster: seats?.booster ?? 0,
  };
}

export function childSeatsTotal(seats: ChildSeats): number {
  return seats.infant + seats.toddler + seats.booster;
}

export function hasChildSeats(seats: ChildSeats | null | undefined): boolean {
  return !!seats && childSeatsTotal(seats) > 0;
}

/**
 * Why a request is refused, or null: each count an integer from 0 to 4, and fewer seats than passengers
 * (one adult at least). Codes the clients translate.
 */
export function childSeatsRefusal(seats: ChildSeats, passengers: number): 'child_seats_range' | 'child_seats_exceed_passengers' | null {
  for (const kind of CHILD_SEAT_KINDS) {
    const n = seats[kind];
    if (!Number.isInteger(n) || n < 0 || n > MAX_CHILD_SEATS_PER_KIND) return 'child_seats_range';
  }
  if (childSeatsTotal(seats) >= passengers && childSeatsTotal(seats) > 0) return 'child_seats_exceed_passengers';
  return null;
}

/** « 1 siège bébé · 2 réhausseurs », or '' without any seat. */
export function childSeatsSummary(seats: ChildSeats | null | undefined, separator = ' · '): string {
  if (!seats) return '';
  return CHILD_SEAT_KINDS.filter(k => seats[k] > 0)
    .map(k => `${seats[k]} ${seats[k] > 1 ? CHILD_SEAT_LABELS[k].many : CHILD_SEAT_LABELS[k].one}`)
    .join(separator);
}

/** The seats to load for several bookings at once (the driver's « À charger avant de partir »). */
export function sumChildSeats(all: (ChildSeats | null | undefined)[]): ChildSeats {
  const out: ChildSeats = { ...NO_CHILD_SEATS };
  for (const s of all) {
    if (!s) continue;
    for (const k of CHILD_SEAT_KINDS) out[k] += s[k];
  }
  return out;
}
