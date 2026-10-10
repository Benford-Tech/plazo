import { formatFlight } from './reservation';

/**
 * 10/10/2026 (« Tu n'as pas récupéré le prix pour la modif »): a comparator lets the traveller type anything as a
 * flight (« U2AB3C », « EZ4BXYZ »), and Plazo's flight number rule (formatFlight) refused the whole imported booking,
 * its price included. An import now drops a flight that is no flight number and keeps what was typed for the staff,
 * as one line of the booking's notes (« Vol retour indiqué par Allopark : U2AB3C (numéro non reconnu) »). A person's
 * form still refuses such a flight (ReservationService.normalizeFlight).
 */

export type FlightField = 'departureFlight' | 'returnFlight';

/** The notes' limit of the staff's form (CreateReservationDto.notes): an import never writes longer notes. */
export const NOTES_MAX_CHARS = 1000;
/** What is kept of a flight as typed: enough to read it, never a pasted paragraph. */
const TYPED_MAX_CHARS = 60;

export interface ImportedFlights {
  departureFlight: string | null;
  returnFlight: string | null;
  /** The flights given that are no flight number, as typed (spaces collapsed, 60 characters at most). */
  unreadable: { field: FlightField; text: string }[];
}

/** An import's flights as the booking stores them (« TO 3627 »), and those that are no flight number. */
export function importedFlights(booking: { departureFlight?: string | null; returnFlight?: string | null }): ImportedFlights {
  const result: ImportedFlights = { departureFlight: null, returnFlight: null, unreadable: [] };
  for (const field of ['departureFlight', 'returnFlight'] as const) {
    const typed = booking[field]?.replace(/\s+/g, ' ').trim();
    if (!typed) continue;
    const flight = formatFlight(typed);
    if (flight) result[field] = flight;
    else result.unreadable.push({ field, text: typed.slice(0, TYPED_MAX_CHARS) });
  }
  return result;
}

/** « Vol retour indiqué par Allopark : U2AB3C (numéro non reconnu) ». */
export function unreadableFlightLine(field: FlightField, text: string, provider: string | null | undefined): string {
  const label = field === 'returnFlight' ? 'Vol retour' : 'Vol aller';
  return `${label} indiqué par ${provider?.trim() || 'le comparateur'} : ${text} (numéro non reconnu)`;
}

/** The notes lines of an import's unreadable flights. */
export function unreadableFlightLines(flights: ImportedFlights, provider: string | null | undefined): string[] {
  return flights.unreadable.map(f => unreadableFlightLine(f.field, f.text, provider));
}

/**
 * The notes with the lines they do not hold yet, each on its own line (a later change never repeats one); a line that
 * would take the notes over NOTES_MAX_CHARS is left out. The notes as they were when no line is added; null for no
 * notes at all.
 */
export function notesWithLines(notes: string | null | undefined, lines: string[]): string | null {
  let result = notes?.trim() ?? '';
  const held = new Set(result.split('\n').map(line => line.trim()));
  let added = false;
  for (const line of lines) {
    if (held.has(line)) continue;
    const next = result ? `${result}\n${line}` : line;
    if (next.length > NOTES_MAX_CHARS) continue;
    result = next;
    held.add(line);
    added = true;
  }
  return added ? result : (notes ?? null);
}
