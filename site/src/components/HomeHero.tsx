import { Breadcrumb } from "./Breadcrumb";
import { HomeMapPanel } from "./HomeMapPanel";
import { SearchForm } from "./SearchForm";
import { CheckIcon } from "./stay/pill";
import { stayDays } from "@/lib/dates";
import { fr } from "@/lib/fr";
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

/**
 * Hero of the home and airport pages (Boutique, 11/10/2026): on the ivory ground, the airport as small
 * spaced capitals, the two-tone Playfair title, the floating search card and three ticks; next to it
 * (under it on a phone) the map of the default stay with its floating pills and the « Le moins cher »
 * card.
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
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pt-3 pb-2 md:px-12 md:pt-8 md:pb-4">
      {breadcrumb && <Breadcrumb items={[{ label: fr.nav.home, href: "/" }, { label: airport.name }]} />}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-10">
        <div className="flex flex-col gap-3 md:gap-4 lg:pt-6">
          <p className="eyebrow">
            {airport.name} · {fr.home.heroKicker}
          </p>
          <h1 className="font-title max-w-[640px] text-[30px] leading-[1.14] text-ink md:text-[46px] md:leading-[1.1] xl:text-[52px]">
            <span className="text-soft">{fr.home.heroFind}</span> <span className="block">{fr.home.heroNear("")}{nameKeptWhole(airport.name)}</span>
          </h1>
          <p className="max-w-[540px] text-[16.5px] leading-relaxed font-medium text-soft max-sm:hidden">{fr.home.heroLead}</p>
          <div className="mt-1 sm:mt-2">
            <SearchForm floating compactPhone stacked airport={airport} arrivee={arrivee} retour={retour} minDate={minDate} idPrefix="accueil" />
          </div>
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
