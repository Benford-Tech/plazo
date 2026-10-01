/** Letters and digits only, upper-case: "gk 318 px" -> "GK318PX". */
export function plateKey(plate: string): string {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

/** French plates (SIV) get their dashes, "gk318px" -> "GK-318-PX"; foreign plates stay as typed, upper-cased. */
export function formatPlate(plate: string): string {
  const key = plateKey(plate);
  if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(key)) return `${key.slice(0, 2)}-${key.slice(2, 5)}-${key.slice(5)}`;
  return plate.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Same rule as the API: 2 to 15 letters, digits, spaces or dashes. */
export function isPlausiblePlate(plate: string): boolean {
  return /^[A-Za-z0-9 -]{2,15}$/.test(plate.trim());
}
