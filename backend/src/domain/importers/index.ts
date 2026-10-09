import { alloparkImporter } from './allopark';
import { isCancellationOrChange } from './common';
import { oneparkImporter } from './onepark';
import { parclickImporter } from './parclick';
import { parkmundoImporter } from './parkmundo';
import { EmailImporter, ParsedBooking } from './types';

// One entry per aggregator whose confirmation emails we can read (09/10/2026: Allopark, Onepark, Parclick, ParkMundo;
// what none of them reads, Claude reads: L-A).
export const EMAIL_IMPORTERS: EmailImporter[] = [alloparkImporter, oneparkImporter, parclickImporter, parkmundoImporter];

/** Who to forward (G-B): one line per comparator and sender address. */
export const IMPORT_SENDERS: { provider: string; address: string }[] = EMAIL_IMPORTERS.flatMap(i =>
  i.senders.map(address => ({ provider: i.provider, address })),
);

/** The booking a comparator's confirmation describes; null for any other email, a cancellation or a change included. */
export function parseConfirmationEmail(text: string): ParsedBooking | null {
  if (isCancellationOrChange(text)) return null;
  const importer = EMAIL_IMPORTERS.find(i => i.detect(text));
  return importer ? importer.parse(text) : null;
}

export type { ParsedBooking } from './types';
