import { fr } from "@/lib/fr";

export const m2 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
export const dec1 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const dec2 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const dec3 = new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

/** "3 | allée | 4 | allée | 2" (long patterns are shortened). */
export function patternText(pattern: number[]): string {
  const parts = pattern.filter(n => n > 0).map(String);
  const shown = parts.length > 5 ? [...parts.slice(0, 5), "…"] : parts;
  return shown.join(` | ${fr.capacity.aisle} | `);
}
