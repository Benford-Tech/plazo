import { daysLabel } from "./dates";
import type { Dict } from "./fr-dict";
import { currentDict } from "./i18n/runtime";

export type { Dict } from "./fr-dict";

/**
 * The site's texts in the language being rendered (13/11/2026: nine languages, French the reference). `fr` keeps its
 * name for the callers written before the translations: every read goes to the current language's texts.
 */
export const fr: Dict = new Proxy({} as Dict, {
  get: (_target, key) => (currentDict() as Record<PropertyKey, unknown>)[key],
  has: (_target, key) => key in currentDict(),
  ownKeys: () => Reflect.ownKeys(currentDict()),
  getOwnPropertyDescriptor: (_target, key) => Object.getOwnPropertyDescriptor(currentDict(), key),
});

/** Kept for the callers that switched copy by payment mode: there is one copy now. */
export function texts(_online?: boolean): Dict {
  return currentDict();
}

/** Unit after a "dès" price: the days the cheapest package covers ("la journée", "pour 3 jours"). */
export function fromPriceUnit(days: number | null | undefined): string {
  if (!days) return "";
  return days === 1 ? currentDict().units.oneDay : currentDict().units.forDays(daysLabel(days));
}

/** Message of a backend code in the current language; unknown codes get a generic message. */
export function errorMessage(code: string | null | undefined): string {
  const errors = currentDict().errors;
  if (!code) return errors.unknown;
  return errors[code] ?? errors.unknown;
}

export function serviceLabel(service: string, short = false): string {
  const dict = currentDict();
  const labels: Record<string, string> = short ? dict.servicesShort : dict.services;
  return labels[service] ?? service;
}

/**
 * A section of the texts read at each access, for module-level constants (« const t = lazy(() => fr.help) »): a
 * plain « fr.help » there would be read once, in whatever language loaded the module first.
 */
export function lazy<T extends object>(get: () => T): T {
  return new Proxy({} as T, {
    get: (_target, key) => (get() as Record<PropertyKey, unknown>)[key],
    has: (_target, key) => key in get(),
    ownKeys: () => Reflect.ownKeys(get()),
    getOwnPropertyDescriptor: (_target, key) => Object.getOwnPropertyDescriptor(get(), key),
  });
}
