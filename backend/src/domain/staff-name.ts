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
