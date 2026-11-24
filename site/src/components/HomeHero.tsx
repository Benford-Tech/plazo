import { Breadcrumb } from "./Breadcrumb";
import { HomeMapPanel } from "./HomeMapPanel";
import { SearchForm } from "./SearchForm";
import { CheckIcon } from "./stay/pill";
import { stayDays } from "@/lib/dates";
import { fr } from "@/lib/fr";
import { formatEuros } from "@/lib/money";
import type { SearchResponse, SearchResult } from "@/lib/types";

/** The airport's name never breaks at its hyphen ("Saint-/Exupéry"). */
function nameKeptWhole(name: string) {
  return <span className="whitespace-nowrap">{name}</span>;
}

/** The cheapest bookable parking of the stay: the « Le moins cher » card of the hero's map. */
export function featuredOf(results: SearchResult[]): SearchResult | null {
  const bookable = results.filter(r => r.available && r.priceCents !== null);
  if (!bookable.length) return null;
  return bookable.reduce((a, b) => (a.priceCents! <= b.priceCents! ? a : b));
}

/** The cheapest offer of the stay among the real parkings, per day: « dès 7,75 € par jour ». Null without a real offer. */
export function fromPerDayCents(results: SearchResult[], days: number): number | null {
  const real = featuredOf(results.filter(r => !r.isDemo));
  if (!real || real.priceCents === null || days < 1) return null;
  return Math.round(real.priceCents / days);
}

/** Light text on the espresso band: the colour tokens are redefined for the words only (not the search card nor the map). */
const ON_DARK = {
  "--color-ink": "#f6efe7",
  "--color-soft": "#d9cdc0",
  "--color-accent-dark": "#ffb27a",
} as React.CSSProperties;

/**
 * Hero of the home and airport pages. Direction A (24/11/2026, after a comparator's page): an espresso band, the
 * keyword as the title, the price of a day in the first line, the search in one bar across the band; beside the words
 * (under them on a phone) the map of the default stay with its floating pills and the « Le moins cher » card.
 */
export function HomeHero({
  airport,
  arrivee,
  retour,
  minDate,
  breadcrumb,
  preview,
}: {
  airport: { slug: string; name: string; code?: string };
  arrivee: string;
  retour: string;
  minDate: string;
  breadcrumb: boolean;
  preview: SearchResponse | null;
}) {
  const results = preview?.results ?? [];
  const featured = featuredOf(results);
  const days = stayDays(arrivee, retour);
  const perDay = fromPerDayCents(results, days);
  return (
    <section className="bg-dark" data-testid="home-hero">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pt-3 pb-6 md:px-12 md:pt-8 md:pb-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
          <div style={ON_DARK} className="flex flex-col gap-3 text-ink md:gap-4 lg:pt-4">
            {breadcrumb && <Breadcrumb onDark items={[{ label: fr.nav.home, href: "/" }, { label: airport.name }]} />}
            <p className="eyebrow">{fr.home.heroKicker}</p>
            <h1 className="font-title max-w-[640px] text-[32px] leading-[1.12] text-white md:text-[48px] md:leading-[1.08] xl:text-[54px]">
              {fr.home.heroKeyword("\u0000").split("\u0000")[0]}
              {nameKeptWhole(airport.name)}
              {fr.home.heroKeyword("\u0000").split("\u0000")[1]}
            </h1>
            <p className="max-w-[560px] text-[16px] leading-relaxed font-medium text-soft md:text-[17px]">
              {fr.home.heroIntro(airport.name)}{" "}
              {perDay !== null && (
                <span data-testid="hero-price">
                  <b className="rounded-[7px] bg-accent px-2 py-0.5 font-extrabold whitespace-nowrap text-white">{fr.home.fromPerDay(formatEuros(perDay))}</b>{" "}
                  {fr.units.forDays(fr.dates.days(days))}, {fr.home.exactPrice}.
                </span>
              )}
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] font-semibold text-soft sm:gap-x-5 sm:text-[14px]">
              {fr.home.trust.map(([title, text]) => (
                <li key={title} className="inline-flex items-baseline gap-1.5">
                  <span aria-hidden="true" className="relative top-[2px] flex-none text-accent-dark">
                    <CheckIcon size={13} />
                  </span>
                  <span>
                    <span className="sm:text-ink">{title}</span> <span className="font-medium max-sm:hidden">· {text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* One bar across the band on a wide screen; right under the words on a phone, before the map. */}
          <div className="lg:order-last lg:col-span-2">
            <SearchForm floating compactPhone airport={airport} arrivee={arrivee} retour={retour} minDate={minDate} idPrefix="accueil" />
          </div>

          {preview && (
            <HomeMapPanel
              airport={{ slug: airport.slug, name: airport.name, location: preview.airport.location ?? null }}
              results={results.filter(r => r.location)}
              featured={featured?.slug ?? null}
              arrivee={arrivee}
              retour={retour}
              days={days}
            />
          )}
        </div>
      </div>
    </section>
  );
}
