"use client";

import { usePathname } from "next/navigation";
import { currentLocale } from "@/lib/i18n/runtime";
import { LANGUAGE_LABEL, LOCALE_NAMES, LOCALE_TAGS, LOCALES, localizedPath, splitLocale } from "@/lib/i18n/locales";

/** The same page in another language (the query is dropped: dates are typed again). */
function useAlternates() {
  const { path } = splitLocale(usePathname() || "/");
  return LOCALES.map(locale => ({ locale, href: localizedPath(locale, path) }));
}

/** Header pill « 🌐 FR ▾ » (13/11/2026): a native disclosure, usable without JavaScript, full page load on choice. */
export function LanguagePicker() {
  const current = currentLocale();
  const alternates = useAlternates();
  return (
    <details className="group relative">
      <summary
        aria-label={`${LANGUAGE_LABEL[current]} : ${LOCALE_NAMES[current]}`}
        className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full px-2.5 text-[14px] font-bold text-ink select-none hover:text-accent-dark [&::-webkit-details-marker]:hidden"
      >
        <span aria-hidden="true">🌐</span>
        <span className="uppercase">{current}</span>
        <span aria-hidden="true" className="text-[11px] transition-transform group-open:rotate-180">▾</span>
      </summary>
      <ul className="card absolute right-0 z-40 mt-1 w-48 py-1.5 shadow-float">
        {alternates.map(({ locale, href }) => (
          <li key={locale}>
            <a
              href={href}
              hrefLang={LOCALE_TAGS[locale]}
              lang={LOCALE_TAGS[locale]}
              aria-current={locale === current ? "true" : undefined}
              className="flex min-h-11 items-center justify-between gap-3 px-4 text-[15px] font-semibold text-ink no-underline hover:bg-ground aria-[current]:text-accent-dark"
            >
              {LOCALE_NAMES[locale]}
              {locale === current && <span aria-hidden="true">✓</span>}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

/** Footer list of the languages: every one, the current one marked. */
export function FooterLanguages({ className = "" }: { className?: string }) {
  const current = currentLocale();
  const alternates = useAlternates();
  return (
    <nav aria-label={LANGUAGE_LABEL[current]} className={className}>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {alternates.map(({ locale, href }) => (
          <li key={locale}>
            <a
              href={href}
              hrefLang={LOCALE_TAGS[locale]}
              lang={LOCALE_TAGS[locale]}
              aria-current={locale === current ? "true" : undefined}
              className="inline-flex min-h-9 items-center text-lilac/80 no-underline hover:text-white aria-[current]:font-bold aria-[current]:text-white"
            >
              {LOCALE_NAMES[locale]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
