import { alloparkImporter } from './allopark';
import { EmailImporter, ParsedBooking } from './types';

// One entry per aggregator whose confirmation emails we can read. Add Parkos, Onepark… here.
export const EMAIL_IMPORTERS: EmailImporter[] = [alloparkImporter];

/** Who to forward (G-B): one line per comparator and sender address. */
export const IMPORT_SENDERS: { provider: string; address: string }[] = EMAIL_IMPORTERS.flatMap(i =>
  i.senders.map(address => ({ provider: i.provider, address })),
);

export function parseConfirmationEmail(text: string): ParsedBooking | null {
  const importer = EMAIL_IMPORTERS.find(i => i.detect(text));
  return importer ? importer.parse(text) : null;
}

export type { ParsedBooking } from './types';
