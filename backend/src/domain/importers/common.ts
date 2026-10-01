const MONTHS: Record<string, number> = {
  janvier: 1,
  fevrier: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  aout: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  decembre: 12,
  janv: 1,
  fevr: 2,
  avr: 4,
  juil: 7,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** "1 octobre 2026", "08:30" -> "2026-10-01T08:30" (local wall-clock time). */
export function frenchDateTime(day: string, month: string, year: string, hour: string, minute: string): string | undefined {
  const m = MONTHS[stripAccents(month.toLowerCase()).replace('.', '')];
  if (!m) return undefined;
  const pad = (n: string | number) => String(n).padStart(2, '0');
  return `${year}-${pad(m)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** "34,99" or "1 234,50" -> 3499 / 123450. */
export function euroCents(amount: string): number | undefined {
  const cleaned = amount.replace(/[\s  ]/g, '').replace(',', '.');
  const value = Number(cleaned);
  return Number.isFinite(value) ? Math.round(value * 100) : undefined;
}

/**
 * Value printed on the line after a form label ("Numéro de plaque du véhicule*" then "GK-318-PX").
 * Empty when the next line is another label: in a customer email the form fields are often blank.
 */
export function valueAfterLabel(lines: string[], label: RegExp, otherLabels: RegExp[]): string | undefined {
  const index = lines.findIndex(line => label.test(line));
  if (index < 0) return undefined;
  const next = lines[index + 1]?.trim();
  if (!next || otherLabels.some(l => l.test(next))) return undefined;
  return next;
}
