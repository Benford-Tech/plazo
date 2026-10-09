/** A person's name in two parts (staff 06/10/2026, travellers 09/10/2026). */
export interface NameParts {
  firstName: string;
  lastName: string;
}

/** Splits a display name at the first space, as the server does for older rows: « Jean de La Tour » → Jean / de La Tour. */
export function splitName(full: string | null | undefined): NameParts {
  const trimmed = (full ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const space = trimmed.search(/\s/);
  if (space < 0) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, space), lastName: trimmed.slice(space).trim() };
}

/** The stored first and last name, or the display name split when both are empty (older rows, older parsers). */
export function nameParts(firstName: string | null | undefined, lastName: string | null | undefined, full: string | null | undefined): NameParts {
  const first = (firstName ?? "").trim();
  const last = (lastName ?? "").trim();
  if (first || last) return { firstName: first, lastName: last };
  return splitName(full);
}
