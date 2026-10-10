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

/**
 * 10/10/2026: an address of a comparator: one of IMPORT_SENDERS, or any address on a domain that names a comparator
 * (info@allopark.com, an address of mail.allopark.com, noreply@onepark.co). Never the parking's mailbox, so never used
 * to open Allopark's booking page.
 */
export function isComparatorAddress(address: string): boolean {
  const lower = address.trim().toLowerCase();
  const domain = lower.slice(lower.lastIndexOf('@') + 1);
  return (
    IMPORT_SENDERS.some(s => s.address.toLowerCase() === lower) ||
    EMAIL_IMPORTERS.some(i => domain.includes(i.provider.toLowerCase())) ||
    IMPORT_SENDERS.some(s => !s.address.includes('@') && domain.includes(s.address.toLowerCase()))
  );
}

/** The booking a comparator's confirmation describes; null for any other email, a cancellation or a change included. */
export function parseConfirmationEmail(text: string): ParsedBooking | null {
  if (isCancellationOrChange(text)) return null;
  const importer = EMAIL_IMPORTERS.find(i => i.detect(text));
  return importer ? importer.parse(text) : null;
}

export type { ParsedBooking } from './types';
