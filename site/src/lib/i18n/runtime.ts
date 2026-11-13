import * as React from "react";
import { fr as frDict, type Dict } from "../fr-dict";
import { DEFAULT_LOCALE, LOCALE_TAGS, localizedPath, type Locale } from "./locales";

/**
 * Which language is being rendered, wherever the code runs:
 * - server components: the request's language, set by the [lang] layout and each page (setRequestLocale);
 * - the browser: one language per document, set by LocaleProvider before anything below it renders;
 * - the server-side render of client components: LocaleProvider's context (read with `use`, during render only).
 * Server components have no createContext: that is how this module knows where it runs.
 */
const SERVER_COMPONENTS = typeof (React as { createContext?: unknown }).createContext !== "function";

export type LocaleState = { locale: Locale; dict: Dict };
// Built on first use: fr-dict and this module import each other through dates.ts.
let french: LocaleState | null = null;
const FRENCH = (): LocaleState => (french ??= { locale: DEFAULT_LOCALE, dict: frDict });

const requestStore: () => { state: LocaleState } = SERVER_COMPONENTS
  ? React.cache((): { state: LocaleState } => ({ state: FRENCH() }))
  : () => ({ state: FRENCH() });

export const LocaleContext: React.Context<LocaleState | null> | null = SERVER_COMPONENTS
  ? null
  : React.createContext<LocaleState | null>(null);

let browserState: LocaleState | null = null;
let override: LocaleState | null = null;

/**
 * Runs `fn` in a language outside any render (route handlers, server actions). Synchronous only: nothing else can
 * run in between, so two requests never see each other's language.
 */
export function withLocale<T>(state: LocaleState, fn: () => T): T {
  const previous = override;
  override = state;
  try {
    return fn();
  } finally {
    override = previous;
  }
}

/** Server components: the language of this request (the [lang] layout and every page call it first). */
export function setRequestLocale(state: LocaleState): void {
  if (SERVER_COMPONENTS) requestStore().state = state;
}

/** Browser: the document's language (LocaleProvider). */
export function setBrowserLocale(state: LocaleState): void {
  if (typeof window !== "undefined") browserState = state;
}

export function currentState(): LocaleState {
  if (override) return override;
  if (SERVER_COMPONENTS) return requestStore().state;
  if (typeof window !== "undefined") return browserState ?? FRENCH();
  // Server-side render of a client component: only ever during render.
  const fromContext = LocaleContext ? safeUse(LocaleContext) : null;
  return fromContext ?? FRENCH();
}

function safeUse(context: React.Context<LocaleState | null>): LocaleState | null {
  try {
    // `use` may be called conditionally; outside a render (a server test calling a helper) it throws, hence the try.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return React.use(context);
  } catch {
    // Outside a render (a test calling a helper directly): French.
    return null;
  }
}

/** The language being rendered. */
export function currentLocale(): Locale {
  return currentState().locale;
}

/** The texts of the language being rendered. */
export function currentDict(): Dict {
  return currentState().dict;
}

/** BCP 47 tag of the language being rendered (dates, numbers, prices). */
export function currentTag(): string {
  return LOCALE_TAGS[currentLocale()];
}

/** A site path in the language being rendered. */
export function lp(path: string): string {
  return localizedPath(currentLocale(), path);
}
