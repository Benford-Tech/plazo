import { Breadcrumb } from "./Breadcrumb";
import { HomeMapPanel } from "./HomeMapPanel";
import { SearchForm } from "./SearchForm";
import { stayDays } from "@/lib/dates";
import { fr } from "@/lib/fr";
import type { SearchResponse, SearchResult } from "@/lib/types";

/** The airport's name never breaks at its hyphen ("Saint-/Exupéry"). */
function nameKeptWhole(name: string) {
  return <span className="whitespace-nowrap">{name}</span>;
}

/** The cheapest bookable parking of the stay: the one orange card of the hero. */
export function featuredOf(results: SearchResult[]): SearchResult | null {
  const bookable = results.filter(r => r.available && r.priceCents !== null);
  if (!bookable.length) return null;
  return bookable.reduce((a, b) => (a.priceCents! <= b.priceCents! ? a : b));
}

/**
 * Hero of the home and airport pages (T-A, 05/10/2026, the mockup's composition): on the grey ground,
 * the airport as a kicker, the two-tone title, the search card; next to it the map of the default
 * stay with its floating pills (how many parkings, how far) and the best offer as the orange card.
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
  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pt-4 pb-2 md:px-12 md:pt-8 md:pb-4">
      {breadcrumb && <Breadcrumb items={[{ label: fr.nav.home, href: "/" }, { label: airport.name }]} />}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="flex flex-col gap-4 lg:pt-4">
          <p className="flex items-center gap-1.5 text-[13px] font-bold tracking-[.06em] text-soft uppercase">
            <span aria-hidden="true">✈</span>
            {airport.name} · {fr.home.heroKicker}
          </p>
          <h1 className="font-title max-w-[640px] text-[36px] leading-[1.08] text-soft md:text-[52px]">
            {fr.home.heroFind} <span className="font-semibold text-dark">{fr.home.heroNear("")}{nameKeptWhole(airport.name)}</span>
          </h1>
          <p className="max-w-[560px] text-[17px] leading-normal text-soft max-sm:hidden">{fr.home.heroLead}</p>
          <div className="sm:mt-2">
            <SearchForm floating compactPhone stacked airport={airport} arrivee={arrivee} retour={retour} minDate={minDate} idPrefix="accueil" />
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-soft">
            {fr.home.trust.map(([title, text]) => (
              <li key={title}>
                <span aria-hidden="true" className="font-bold text-accent">
                  ✓{" "}
                </span>
                <b className="font-bold text-ink">{title}</b> <span className="max-sm:hidden">· {text}</span>
              </li>
            ))}
          </ul>
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
    </section>
  );
}
