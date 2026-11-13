"use client";

import { use, useMemo, type ReactNode } from "react";
import { fr as frDict, type Dict } from "../fr-dict";
import type { Locale } from "./locales";
import { LocaleContext, setBrowserLocale, type LocaleState } from "./runtime";

/** Each language's texts are their own chunk: a browser downloads only the page's language (French comes with the page). */
const LOADERS: Record<Exclude<Locale, "fr">, () => Promise<Dict>> = {
  en: () => import("./dicts/en").then(m => m.en),
  de: () => import("./dicts/de").then(m => m.de),
  es: () => import("./dicts/es").then(m => m.es),
  pt: () => import("./dicts/pt").then(m => m.pt),
  pl: () => import("./dicts/pl").then(m => m.pl),
  ro: () => import("./dicts/ro").then(m => m.ro),
  ru: () => import("./dicts/ru").then(m => m.ru),
  uk: () => import("./dicts/uk").then(m => m.uk),
};

const loading = new Map<Locale, Promise<Dict>>();

function load(locale: Exclude<Locale, "fr">): Promise<Dict> {
  let promise = loading.get(locale);
  if (!promise) {
    promise = LOADERS[locale]();
    loading.set(locale, promise);
  }
  return promise;
}

/** The page's language for every client component below (texts, dates, prices, links). */
export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = locale === "fr" ? frDict : use(load(locale));
  const state = useMemo<LocaleState>(() => ({ locale, dict }), [locale, dict]);
  // The browser renders one language per document: set before anything below renders.
  setBrowserLocale(state);
  const Provider = LocaleContext!.Provider;
  return <Provider value={state}>{children}</Provider>;
}
