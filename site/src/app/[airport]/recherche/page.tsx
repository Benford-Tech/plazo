import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAirport } from "@/components/AirportView";
import { FiltersForm } from "@/components/FiltersForm";
import { PriceRange } from "@/components/PriceRange";
import { ResultCard } from "@/components/ResultCard";
import type { MapParking } from "@/components/ResultsMap";
import { ResultsMapPanel } from "@/components/ResultsMapPanel";
import { MapIcon } from "@/components/stay/pill";
import { SearchForm } from "@/components/SearchForm";
import { api, ApiError } from "@/lib/api";
import { daysLabel, formatDay, parseLocal, stayDays, stayFromParams, stayQuery, todayLocal, validateStay } from "@/lib/dates";
import {
  applyFilters,
  type Filters,
  FILTER_SERVICES,
  hasActiveFilters,
  mapShown,
  parseFilters,
  priceCeilingCents,
  resultsQuery,
  SERVICE_SLUGS,
  SHUTTLE_LIMITS,
  SORT_KEYS,
  serviceCounts,
} from "@/lib/filters";
import { fr, serviceLabel, texts } from "@/lib/fr";
import { resultBadges } from "@/lib/highlights";
import { formatShortEuros } from "@/lib/money";
import { SLUG_RE } from "@/lib/site";
import type { SearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[airport]/recherche">): Promise<Metadata> {
  const { airport: slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const { airport } = await loadAirport(slug);
  // Results depend on the dates: not a page for search engines.
  return { title: fr.meta.resultsTitle(airport.name), robots: { index: false, follow: true } };
}

/** Filters panel: eyebrow legends, 44 px rows with espresso check boxes (a selection is never orange). */
const sectionTitle = "eyebrow mb-1";
const checkRow = "flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-semibold md:min-h-10";
const checkBox = "size-[18px] flex-none cursor-pointer accent-dark";
const countClass = "ml-auto text-[13px] font-semibold text-soft tabular-nums";

/** "mar. 20 oct. 08:00": the day in Manrope, the hour in JetBrains Mono. */
function StayMoment({ local }: { local: string }) {
  const parsed = parseLocal(local);
  if (!parsed) return <>{local}</>;
  return (
    <>
      {formatDay(parsed.date)} <span className="font-hour">{parsed.time}</span>
    </>
  );
}

function FiltersIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </svg>
  );
}

/** « Afficher la carte » / « Masquer la carte »: an outlined chip with orange (accent-dark) text, a plain link. */
function MapToggle({ href, map, className = "" }: { href: string; map: boolean; className?: string }) {
  return (
    <Link href={href} scroll={false} replace className={`chip-toggle px-3.5 text-accent-dark hover:text-accent-dark ${className}`}>
      <MapIcon />
      {map ? fr.map.hide : fr.map.show}
    </Link>
  );
}

export default async function ResultsPage({ params, searchParams }: PageProps<"/[airport]/recherche">) {
  const { airport: slug } = await params;
  if (!SLUG_RE.test(slug)) notFound();
  const query = await searchParams;
  const stay = stayFromParams(query);
  const today = todayLocal();
  let errors: { arrivalAt?: string; returnAt?: string } = validateStay(stay.arrivee, stay.retour);

  let data: SearchResponse | null = null;
  if (!errors.arrivalAt && !errors.returnAt) {
    try {
      data = await api.search(slug, stay.arrivee!, stay.retour!);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) notFound();
      if (!(error instanceof ApiError && error.code === "validation_failed")) throw error;
      errors = { arrivalAt: error.fields?.arrivalAt, returnAt: error.fields?.returnAt };
    }
  }

  // No usable dates: ask for them.
  if (!data) {
    const { airport } = await loadAirport(slug);
    return (
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-8 md:px-12 md:py-10">
        <h1 className="font-title text-[30px] leading-[1.12] md:text-[38px]">{fr.results.datesTitle}</h1>
        <p className="max-w-[640px] font-medium text-soft">{fr.results.datesText}</p>
        <SearchForm airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={today} errors={errors} />
      </main>
    );
  }

  const { airport, results } = data;
  const arrivee = stay.arrivee!;
  const retour = stay.retour!;
  const ceilingCents = priceCeilingCents(results);
  const parsed = parseFilters(query);
  // A limit at (or above) the slider's maximum is no limit.
  const filters = { ...parsed, maxPriceCents: parsed.maxPriceCents !== null && parsed.maxPriceCents >= ceilingCents ? null : parsed.maxPriceCents };
  const shown = applyFilters(results, filters);
  const availableCount = shown.filter(r => r.available && r.priceCents !== null).length;
  const counts = serviceCounts(results);
  const badges = resultBadges(shown);
  const days = results[0]?.days ?? stayDays(arrivee, retour);
  const path = `/${airport.slug}/recherche`;
  const map = mapShown(query);
  const withFilters = (f: Partial<Filters>) => `${path}${resultsQuery({ arrivee, retour }, { ...filters, ...f }, map)}`;
  const clearHref = `${path}${resultsQuery({ arrivee, retour }, { services: [], freeCancellation: false, maxShuttle: null, maxPriceCents: null, sort: filters.sort }, map)}`;
  const mapToggleHref = `${path}${resultsQuery({ arrivee, retour }, filters, !map)}`;
  const mapParkings: MapParking[] = shown.flatMap(r =>
    r.location
      ? [
          {
            slug: r.slug,
            title: r.title,
            label: r.available && r.priceCents !== null ? formatShortEuros(r.priceCents) : r.priceCents === null ? fr.map.noPrice : fr.map.full,
            bookable: r.available && r.priceCents !== null,
            location: r.location,
            live: r.liveShuttle === true,
            best: badges.get(r.slug)?.includes("cheapest") === true,
          },
        ]
      : [],
  );
  const notDrawn = shown.length - mapParkings.length;
  const visibleServices = FILTER_SERVICES.filter(s => counts[s] > 0 || filters.services.includes(s));
  const refundableCount = results.filter(r => r.cancellationPolicy !== "non_refundable").length;
  // Quick filter chips (phones, and beside the map): the filters that actually narrow these results, plus any
  // one already applied. A service every parking offers ("Navette gratuite" at Plazo) would filter nothing.
  const narrows = (count: number) => count > 0 && count < results.length;
  const quickServices = visibleServices.filter(s => narrows(counts[s]) || filters.services.includes(s));
  const quickCancellation = narrows(refundableCount) || filters.freeCancellation;
  // Both filter forms remount after each navigation (the field just used gets its focus back).
  const filtersKey = resultsQuery({ arrivee, retour }, filters, map);

  return (
    <>
      <details className="group mx-auto w-full max-w-[1280px] px-4 pt-4 md:px-12 md:pt-6">
        <summary className="card grid list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 pt-1 pr-2 pb-3 pl-4 transition-colors hover:border-soft md:pr-3 md:pl-5 lg:flex lg:gap-x-4 lg:py-1.5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 text-[15px] font-bold md:text-base">{airport.name}</span>
          <span className="col-span-2 row-start-2 -mt-1 text-[13px] font-semibold text-soft md:text-sm lg:mt-0">
            <span className="whitespace-nowrap">
              <StayMoment local={arrivee} /> →
            </span>{" "}
            <span className="whitespace-nowrap">
              <StayMoment local={retour} /> · {daysLabel(days)}
            </span>
          </span>
          <span className="link flex min-h-11 flex-none items-center gap-1.5 px-2 text-[13.5px] group-hover:underline lg:ml-auto">
            {fr.search.modify}
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-180 motion-reduce:transition-none">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>
        <div className="pt-3">
          <SearchForm airport={airport} arrivee={arrivee} retour={retour} minDate={today} idPrefix="modifier" keepMap={map} />
        </div>
      </details>

      <main
        className={`mx-auto grid w-full max-w-[1280px] flex-1 content-start gap-x-6 gap-y-4 px-4 pt-4 pb-8 md:px-12 md:pt-6 md:pb-10 ${
          map
            ? "grid-cols-1 [grid-template-areas:'filters'_'head'_'map'_'list'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:[grid-template-areas:'filters_map'_'head_map'_'list_map']"
            : "grid-cols-1 md:grid-cols-[248px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-7 md:gap-y-5 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-x-9"
        }`}
      >
        <div className={`group/filters min-w-0 ${map ? "[grid-area:filters]" : "md:row-span-2"}`}>
          <div className={`scroll-row -my-1.5 -mr-4 -ml-1.5 items-center py-1.5 pl-1.5 md:mr-0 ${map ? "" : "md:hidden"}`}>
            <label htmlFor="voir-filtres" className="chip-toggle relative">
              <input type="checkbox" id="voir-filtres" className="sr-only" />
              <FiltersIcon />
              {fr.results.filters}
            </label>
            <MapToggle href={mapToggleHref} map={map} className={map ? "" : "md:hidden"} />
            {quickServices.length + (quickCancellation ? 1 : 0) > 0 && (
              <FiltersForm key={`rapides-${filtersKey}`} action={path} className="contents" applyClassName="chip-toggle">
                <input type="hidden" name="arrivee" value={arrivee} />
                <input type="hidden" name="retour" value={retour} />
                {filters.sort !== "prix" && <input type="hidden" name="tri" value={filters.sort} />}
                {map && <input type="hidden" name="carte" value="1" />}
                {filters.services
                  .filter(s => !quickServices.includes(s))
                  .map(s => (
                    <input key={s} type="hidden" name="service" value={SERVICE_SLUGS[s]} />
                  ))}
                {filters.freeCancellation && !quickCancellation && <input type="hidden" name="annulation" value="gratuite" />}
                {filters.maxShuttle !== null && <input type="hidden" name="navette" value={filters.maxShuttle} />}
                {filters.maxPriceCents !== null && <input type="hidden" name="prix_max" value={Math.round(filters.maxPriceCents / 100)} />}
                {quickServices.map(s => (
                  <label key={s} htmlFor={`q-${s}`} className="chip-toggle relative">
                    <input id={`q-${s}`} type="checkbox" name="service" value={SERVICE_SLUGS[s]} defaultChecked={filters.services.includes(s)} className="sr-only" />
                    {serviceLabel(s)}
                  </label>
                ))}
                {quickCancellation && (
                  <label htmlFor="q-annulation" className="chip-toggle relative">
                    <input id="q-annulation" type="checkbox" name="annulation" value="gratuite" defaultChecked={filters.freeCancellation} className="sr-only" />
                    {fr.results.freeCancellation}
                  </label>
                )}
              </FiltersForm>
            )}
          </div>
          <aside
            aria-label={fr.results.filters}
            className={`card mt-3 hidden p-4 group-has-[#voir-filtres:checked]/filters:block ${map ? "max-w-[440px] md:p-5" : "md:mt-0 md:block md:p-5"}`}
          >
            <FiltersForm key={filtersKey} action={path}>
              <input type="hidden" name="arrivee" value={arrivee} />
              <input type="hidden" name="retour" value={retour} />
              {filters.sort !== "prix" && <input type="hidden" name="tri" value={filters.sort} />}
              {map && <input type="hidden" name="carte" value="1" />}
              {visibleServices.length > 0 && (
                <fieldset>
                  <legend className={sectionTitle}>{fr.results.services}</legend>
                  {visibleServices.map(s => (
                    <label key={s} htmlFor={`f-${s}`} className={checkRow}>
                      <input
                        id={`f-${s}`}
                        type="checkbox"
                        name="service"
                        value={SERVICE_SLUGS[s]}
                        defaultChecked={filters.services.includes(s)}
                        className={checkBox}
                      />
                      {serviceLabel(s)}
                      <span className={countClass}>{counts[s]}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <fieldset>
                <legend className={sectionTitle}>{fr.results.cancellation}</legend>
                <label htmlFor="f-annulation" className={checkRow}>
                  <input
                    id="f-annulation"
                    type="checkbox"
                    name="annulation"
                    value="gratuite"
                    defaultChecked={filters.freeCancellation}
                    className={checkBox}
                  />
                  {fr.results.freeCancellation}
                  <span className={countClass}>{refundableCount}</span>
                </label>
              </fieldset>
              <fieldset>
                <legend className={`${sectionTitle} mb-2.5`}>{fr.results.shuttle}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {[...SHUTTLE_LIMITS, null].map(limit => (
                    <label key={limit ?? "any"} htmlFor={`f-navette-${limit ?? "any"}`} className="chip-toggle relative px-3.5">
                      <input
                        id={`f-navette-${limit ?? "any"}`}
                        type="radio"
                        name="navette"
                        value={limit ?? ""}
                        defaultChecked={filters.maxShuttle === limit}
                        className="sr-only"
                      />
                      {limit ? fr.results.shuttleMax(limit) : fr.results.shuttleAny}
                    </label>
                  ))}
                </div>
              </fieldset>
              {ceilingCents > 0 && (
                <fieldset>
                  <legend className={`${sectionTitle} mb-1`}>{fr.results.totalPrice}</legend>
                  <PriceRange
                    id="f-prix"
                    max={ceilingCents / 100}
                    value={Math.min(ceilingCents, filters.maxPriceCents ?? ceilingCents) / 100}
                  />
                </fieldset>
              )}
            </FiltersForm>
            {hasActiveFilters(filters) && (
              <Link href={clearHref} className="link mt-2 inline-flex min-h-11 items-center text-[14px]">
                {fr.results.clear}
              </Link>
            )}
          </aside>
        </div>

        <div className={`flex min-w-0 flex-col items-start gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-6 ${map ? "[grid-area:head]" : ""}`}>
          <h1 id="resultats" className="font-title text-[28px] leading-[1.12] md:text-[32px]" aria-live="polite">
            {fr.results.available(availableCount)}
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <nav aria-label={fr.results.sort} className="flex flex-wrap items-center gap-1.5">
              <span className={`eyebrow mr-1 max-sm:sr-only ${map ? "" : "md:max-lg:sr-only"}`}>{fr.results.sort}</span>
              {SORT_KEYS.map(key => (
                <Link
                  key={key}
                  href={withFilters({ sort: key })}
                  scroll={false}
                  replace
                  aria-current={filters.sort === key ? "true" : undefined}
                  className="chip-toggle px-3.5"
                >
                  {fr.results.sortBy[key]}
                </Link>
              ))}
            </nav>
            {!map && <MapToggle href={mapToggleHref} map={map} className="max-md:hidden" />}
          </div>
        </div>

        {map && (
          <div className="h-[300px] overflow-hidden rounded-card border border-line [grid-area:map] sm:h-[380px] lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)] lg:max-h-[860px] lg:self-start">
            <div className="relative h-full">
              <ResultsMapPanel airport={{ name: airport.name, location: airport.location ?? null }} parkings={mapParkings} />
              {notDrawn > 0 && (
                <p className="pill-float pointer-events-none absolute bottom-9 left-2.5 font-semibold text-soft">{fr.map.notDrawn(notDrawn)}</p>
              )}
            </div>
          </div>
        )}

        <section aria-labelledby="resultats" className={`flex min-w-0 flex-col gap-3 md:gap-4 ${map ? "[grid-area:list]" : "md:col-start-2"}`}>
          {shown.length === 0 ? (
            <div className="card flex flex-col items-start gap-3 p-6">
              <h2 className="font-title text-[22px] leading-tight">{results.length === 0 ? fr.results.noneTitle : fr.results.noMatchTitle}</h2>
              <p className="text-soft">{results.length === 0 ? fr.results.noneText : fr.results.noMatchText}</p>
              {results.length > 0 && (
                <Link href={clearHref} className="btn-secondary btn-sm">
                  {fr.results.clear}
                </Link>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-3 md:gap-4">
              {shown.map((result, i) => (
                <li key={result.slug}>
                  <ResultCard
                    result={result}
                    href={`/${airport.slug}/${result.slug}${stayQuery({ arrivee, retour })}`}
                    highlighted={i === 0 && result.available}
                    badges={badges.get(result.slug) ?? []}
                    headingLevel={2}
                    compact={map}
                    noPosition={map && !result.location}
                  />
                </li>
              ))}
            </ul>
          )}
          {availableCount === 0 && results.length > 0 && shown.length > 0 && <p className="text-soft">{fr.results.noneText}</p>}
          <p className="mt-1 text-[12.5px] leading-relaxed font-semibold text-soft">{texts(data.payments === "online").results.footnote}</p>
        </section>
      </main>
    </>
  );
}
