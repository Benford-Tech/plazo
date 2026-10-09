import { fullName, splitName } from './staff-name';

/**
 * Travellers' names (09/10/2026, « tous les utilisateurs ont un nom et prénom »): first and last name stored apart,
 * `customerName` the display form "Prénom Nom", recomputed by the server on every write (search, lists and exports
 * keep using it). Same rules as the staff's (domain/staff-name.ts).
 */
export interface CustomerNames {
  customerFirstName: string;
  customerLastName: string;
  customerName: string;
}

/** The fields a traveller's name is read from (a reservation row, a public booking, a parsed email). */
export interface CustomerNameFields {
  customerName: string;
  customerFirstName?: string | null;
  customerLastName?: string | null;
}

/** Trimmed, inner spaces collapsed: "  Jean   Luc " -> "Jean Luc". */
export function cleanNamePart(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

/** First and last name given, or a single `customerName` to split at its first space (older app versions, imports). */
export function customerNamesOf(input: {
  customerFirstName?: string | null;
  customerLastName?: string | null;
  customerName?: string | null;
}): CustomerNames {
  const first = cleanNamePart(input.customerFirstName);
  const last = cleanNamePart(input.customerLastName);
  if (first || last) return { customerFirstName: first, customerLastName: last, customerName: fullName(first, last) };
  const split = splitName(input.customerName ?? '');
  return { customerFirstName: split.firstName, customerLastName: split.lastName, customerName: fullName(split.firstName, split.lastName) };
}

/** The first name to greet the traveller with ("Bonjour Camille"): the stored one, else the first word of the display name. */
export function greetingName(person: { customerName: string; customerFirstName?: string | null }): string {
  return cleanNamePart(person.customerFirstName) || cleanNamePart(person.customerName).split(' ')[0] || '';
}

/** The first and last name of a traveller, the stored ones first, else split from the display name. */
export function namesOfCustomer(person: CustomerNameFields): { firstName: string; lastName: string } {
  const first = cleanNamePart(person.customerFirstName);
  const last = cleanNamePart(person.customerLastName);
  if (first || last) return { firstName: first, lastName: last };
  return splitName(person.customerName);
}

/**
 * The names of a booking read from an email (09/10/2026): the importer's or Claude's first and last name when both are
 * known, else the display name split at its first space.
 */
export function importedNames(parsed: { customerName?: string; customerFirstName?: string; customerLastName?: string }): CustomerNames {
  if (cleanNamePart(parsed.customerFirstName) && cleanNamePart(parsed.customerLastName)) {
    return customerNamesOf({ customerFirstName: parsed.customerFirstName, customerLastName: parsed.customerLastName });
  }
  const whole =
    cleanNamePart(parsed.customerName) || [parsed.customerFirstName, parsed.customerLastName].map(cleanNamePart).filter(Boolean).join(' ');
  return customerNamesOf({ customerName: whole });
}
