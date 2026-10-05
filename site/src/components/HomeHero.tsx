import Link from "next/link";
import { Breadcrumb } from "./Breadcrumb";
import { HomeMap } from "./HomeMap";
import { SearchForm } from "./SearchForm";
import { stayDays, stayQuery } from "@/lib/dates";
import { fr } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import type { SearchResponse, SearchResult } from "@/lib/types";

/** The airport's name never breaks at its hyphen ("Saint-/Exupéry"). */
function nameKeptWhole(name: string) {
  return <span className="whitespace-nowrap">{name}</span>;
}

const km = (value: number) => (value < 10 ? value.toFixed(1).replace(".", ",") : String(Math.round(value)));

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
  const bookable = results.filter(r => r.available && r.priceCents !== null);
  const featured = featuredOf(results);
  const days = stayDays(arrivee, retour);
  const distanceLabel = featured ? fr.home.mapDistance(featured.distanceKm === null ? null : km(featured.distanceKm), featured.shuttleMinutes) : "";
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
          <div className="relative overflow-hidden rounded-[22px] bg-[#e6e6e9] shadow-[0_24px_50px_-24px_rgba(30,20,10,.45)]" style={{ minHeight: 420 }} data-testid="home-map">
            <div className="absolute inset-0">
              <HomeMap airport={{ name: airport.name, location: preview.airport.location ?? null }} results={bookable} featured={featured?.slug ?? null} />
            </div>
            <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-2">
              <span className="pill-float" data-testid="home-map-count">
                {bookable.length > 0 && <span className="flex size-6 items-center justify-center rounded-full bg-ground text-xs">{bookable.length}</span>}
                {fr.home.mapAvailable(bookable.length)}
              </span>
              <span className="pill-float text-soft">{fr.home.mapStay(days)}</span>
            </div>
            {distanceLabel && (
              <span className="pill-float pointer-events-none absolute top-3 right-3" data-testid="home-map-distance">
                {distanceLabel}
              </span>
            )}
            {featured && (
              <Link
                href={`/${airport.slug}/${featured.slug}${stayQuery({ arrivee, retour })}`}
                data-testid="home-featured"
                aria-label={fr.home.featuredSee(featured.title)}
                className="absolute right-3 bottom-3 left-3 flex items-center gap-3 rounded-[20px] bg-accent p-4 text-white no-underline shadow-[0_18px_40px_-14px_rgba(255,102,0,.6)] hover:text-white"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] font-bold text-white/85">{fr.home.featuredFrom(formatShortEuros(featured.priceCents!))}</span>
                  <span className="truncate text-[19px] font-extrabold">{featured.title}</span>
                  <span className="truncate text-[13px] font-semibold text-white/85">{fr.home.featuredSub(featured.services.includes("valet"), featured.shuttleMinutes)}</span>
                </span>
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-extrabold text-accent">
                  ↗
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
