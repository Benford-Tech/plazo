import { importedPlate } from '../reservation';
import { alloparkImporter } from './allopark';
import { parkhitImporter } from './parkhit';
import { isCancellationOrChange } from './common';
import { oneparkImporter } from './onepark';
import { parclickImporter } from './parclick';
import { parkmundoImporter } from './parkmundo';
import { parkviaImporter } from './parkvia';
import { EmailImporter, ParsedBooking } from './types';

// One entry per aggregator whose confirmation emails we can read (09/10/2026: Allopark, Onepark, Parclick, ParkMundo;
// what none of them reads, Claude reads: L-A; 20/10/2026 ParkVia, 25/10/2026 Park Hit).
export const EMAIL_IMPORTERS: EmailImporter[] = [
  alloparkImporter,
  oneparkImporter,
  parclickImporter,
  parkmundoImporter,
  parkviaImporter,
  parkhitImporter,
];

/** The comparators the importers know: the Mails entrants block, the morning email. */
export const COMPARATOR_PROVIDERS: string[] = EMAIL_IMPORTERS.map(i => i.provider);

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
  return importer ? parsedBy(importer, text) : null;
}

/**
 * 16/10/2026 (« analyser sans passer par Claude »): the booking of an email the mail-type rules already read as this
 * comparator's booking (domain/inbound-kind.ts, which tells cancellations and changes apart first): its own importer,
 * when it recognises the layout, or whatever the layout when the rules matched the comparator's template (`template`:
 * Allopark's brand may be only in the sender); null otherwise (the booking page or Claude may then give it).
 */
export function parseBookingEmail(text: string, provider: string, template = false): ParsedBooking | null {
  const importer = EMAIL_IMPORTERS.find(i => i.provider === provider);
  return importer && (template || importer.detect(text)) ? parsedBy(importer, text) : null;
}

function parsedBy(importer: EmailImporter, text: string): ParsedBooking {
  const booking = importer.parse(text);
  // 15/10/2026: what is no plate (a label read in a blank cell, « Inconnue ») is a gap that Allopark's page or Claude may fill.
  if (booking?.plate && !importedPlate(booking.plate)) delete booking.plate;
  return booking;
}

export type { ParsedBooking } from './types';
