import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Dict } from "../fr-dict";
import { DICTS } from "./dicts";
import { DEFAULT_LOCALE, isLocale, LOCALE_HEADER, type Locale } from "./locales";
import { setRequestLocale, withLocale } from "./runtime";

/**
 * First thing of every layout, page and generateMetadata of the site: the language of the request, from the [lang]
 * segment (no segment, as in the tests: French). An unknown language is a missing page.
 */
export function enterLocale(lang: string | undefined): Locale {
  const locale = lang === undefined ? DEFAULT_LOCALE : lang;
  if (!isLocale(locale)) notFound();
  setRequestLocale({ locale, dict: DICTS[locale] });
  return locale;
}

/** Texts of a language, outside a render (sitemap, metadata of another language). */
export function dictOf(locale: Locale): Dict {
  return DICTS[locale];
}

/** Same as enterLocale, from a page's params promise. */
export async function enterLocaleFrom(params: Promise<{ lang?: string }> | undefined): Promise<Locale> {
  return enterLocale(params ? (await params).lang : undefined);
}

/** The language of a request outside a render (route handlers, server actions): the [lang] segment, else French. */
export function localeOf(lang: string | null | undefined): Locale {
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

/** Runs synchronous code in a language (route handlers, server actions). */
export function inLocale<T>(locale: Locale, fn: () => T): T {
  return withLocale({ locale, dict: DICTS[locale] }, fn);
}

/** The language of the page a server action was posted from (header set by the proxy). */
export async function actionLocale(): Promise<Locale> {
  return localeOf((await headers()).get(LOCALE_HEADER));
}
