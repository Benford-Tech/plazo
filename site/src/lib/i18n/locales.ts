/**
 * The site's languages (13/11/2026, « traduit en anglais, allemand, espagnol, portugais et quelques grandes langues des
 * pays de l'Est »): French at the root of the site, every other language under its own prefix (/en/…).
 */
export const LOCALES = ["fr", "en", "de", "es", "pt", "pl", "ro", "ru", "uk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "fr";

/** Request header set by the proxy: the language of the page a server action was posted from. */
export const LOCALE_HEADER = "x-plazo-locale";

/** Each language in its own words, for the language picker. */
export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  pl: "Polski",
  ro: "Română",
  ru: "Русский",
  uk: "Українська",
};

/** BCP 47 tag of each language: dates, numbers and prices, <html lang>, hreflang, og:locale. */
export const LOCALE_TAGS: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  pl: "pl-PL",
  ro: "ro-RO",
  ru: "ru-RU",
  uk: "uk-UA",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** The language a public path is in, and the path without its prefix (« /en/contact » → en, « /contact »). */
export function splitLocale(pathname: string): { locale: Locale; path: string } {
  const [, first = "", ...rest] = pathname.split("/");
  if (first !== DEFAULT_LOCALE && isLocale(first)) {
    const path = `/${rest.join("/")}`;
    return { locale: first, path };
  }
  return { locale: DEFAULT_LOCALE, path: pathname || "/" };
}

/** Paths of the other services on the same domain (pro space, API): never under a language. */
const OTHER_SERVICES = /^\/(pro|api)(\/|\?|#|$)/;

/**
 * A site path in a language: unchanged in French, « /en/… » otherwise. External links, anchors and the other
 * services' paths are left alone.
 */
export function localizedPath(locale: Locale, path: string): string {
  if (locale === DEFAULT_LOCALE || !path.startsWith("/") || path.startsWith("//") || OTHER_SERVICES.test(path)) return path;
  const { path: bare } = splitLocale(path);
  if (bare === "/") return `/${locale}`;
  if (bare.startsWith("/?") || bare.startsWith("/#")) return `/${locale}${bare.slice(1)}`;
  return `/${locale}${bare}`;
}

/** Accessible name of the language picker, in each language. */
export const LANGUAGE_LABEL: Record<Locale, string> = {
  fr: "Langue",
  en: "Language",
  de: "Sprache",
  es: "Idioma",
  pt: "Idioma",
  pl: "Język",
  ro: "Limbă",
  ru: "Язык",
  uk: "Мова",
};
