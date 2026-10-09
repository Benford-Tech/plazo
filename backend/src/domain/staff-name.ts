/** Staff names (06/10/2026): first and last name stored apart, `name` is the display form "Prénom Nom". */

export function fullName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/** "Jean Dupont" -> { firstName: "Jean", lastName: "Dupont" }; a single word is a first name. */
export function splitName(name: string): { firstName: string; lastName: string } {
  const clean = name.trim().replace(/\s+/g, ' ');
  const at = clean.indexOf(' ');
  return at === -1 ? { firstName: clean, lastName: '' } : { firstName: clean.slice(0, at), lastName: clean.slice(at + 1) };
}

/** First and last name given, or a single `name` to split (older clients and scripts). */
export function namesOf(input: { firstName?: string | null; lastName?: string | null; name?: string | null }): {
  firstName: string;
  lastName: string;
  name: string;
} {
  const firstName = input.firstName?.trim() ?? '';
  const lastName = input.lastName?.trim() ?? '';
  if (firstName || lastName) return { firstName, lastName, name: fullName(firstName, lastName) };
  const split = splitName(input.name ?? '');
  return { ...split, name: fullName(split.firstName, split.lastName) };
}

/**
 * A manager's name given to a script (`seed:operator`, 09/10/2026): --first-name / --last-name, or --name split at its
 * first space; both parts are required, a one-word name is refused.
 */
export function namesFromArgs(input: { firstName?: string; lastName?: string; name?: string }): { firstName: string; lastName: string } {
  const separate = input.firstName !== undefined || input.lastName !== undefined;
  const { firstName, lastName } = namesOf(separate ? { firstName: input.firstName, lastName: input.lastName } : { name: input.name });
  if (!firstName) throw new Error('The manager needs a first name: --first-name "Jean" (or --name "Jean Dupont")');
  if (!lastName) throw new Error('The manager needs a last name: --last-name "Dupont" (or --name "Jean Dupont")');
  return { firstName, lastName };
}
