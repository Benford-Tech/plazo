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
import { daysLabel, formatDateTime, stayDays, stayFromParams, stayQuery, todayLocal, validateStay } from "@/lib/dates";
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

const sectionTitle = "mb-1.5 text-[13px] font-bold tracking-[.06em] text-soft uppercase";

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
      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 py-8 md:px-12">
        <h1 className="font-title text-[28px] md:text-[34px]">{fr.results.datesTitle}</h1>
        <p className="text-soft">{fr.results.datesText}</p>
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
          },
        ]
      : [],
  );
  const notDrawn = shown.length - mapParkings.length;
  const visibleServices = FILTER_SERVICES.filter(s => counts[s] > 0 || filters.services.includes(s));

  return (
    <>
      <div className="border-b border-line bg-tint">
        <details className="group mx-auto max-w-[1280px] px-4 md:px-12">
          <summary className="flex list-none flex-wrap items-center gap-x-[18px] gap-y-1 py-3 [&::-webkit-details-marker]:hidden">
            <span className="font-bold">{airport.name}</span>
            <span className="text-soft">
              {formatDateTime(arrivee).replace(" · ", " ")} → {formatDateTime(retour).replace(" · ", " ")}
            </span>
            <span className="rounded-[14px] border border-line bg-white px-2.5 py-1 text-sm font-semibold">{daysLabel(days)}</span>
            <span className="ml-auto flex min-h-11 items-center font-semibold text-accent underline group-open:no-underline">
              {fr.search.modify}
            </span>
          </summary>
          <div className="pb-4">
            <SearchForm airport={airport} arrivee={arrivee} retour={retour} minDate={today} idPrefix="modifier" keepMap={map} />
          </div>
        </details>
      </div>

      <main
        className={`mx-auto grid w-full max-w-[1280px] flex-1 gap-6 px-4 py-6 md:px-12 md:py-7 ${
          map
            ? "grid-cols-1 [grid-template-areas:'filters'_'head'_'map'_'list'] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:[grid-template-areas:'filters_map'_'head_map'_'list_map']"
            : "md:grid-cols-[250px_1fr] md:grid-rows-[auto_1fr] md:gap-9"
        }`}
      >
        <div className={map ? "[grid-area:filters]" : "md:row-span-2"}>
          <input type="checkbox" id="voir-filtres" className="peer sr-only" />
          <label
            htmlFor="voir-filtres"
            className={`btn-secondary h-11 px-4 text-[15px] peer-focus-visible:outline-3 peer-focus-visible:outline-accent ${map ? "w-full sm:w-auto" : "w-full md:hidden"}`}
          >
            {map ? fr.map.filters : fr.results.showFilters}
          </label>
          <aside aria-label={fr.results.filters} className={`mt-4 hidden peer-checked:block ${map ? "max-w-[420px]" : "md:mt-0 md:block"}`}>
            <FiltersForm key={resultsQuery({ arrivee, retour }, filters, map)} action={path}>
              <input type="hidden" name="arrivee" value={arrivee} />
              <input type="hidden" name="retour" value={retour} />
              {filters.sort !== "prix" && <input type="hidden" name="tri" value={filters.sort} />}
              {map && <input type="hidden" name="carte" value="1" />}
              {visibleServices.length > 0 && (
                <fieldset>
                  <legend className={sectionTitle}>{fr.results.services}</legend>
                  {visibleServices.map(s => (
                    <label key={s} htmlFor={`f-${s}`} className="flex min-h-11 items-center gap-2.5 text-[15px] md:min-h-9">
                      <input
                        id={`f-${s}`}
                        type="checkbox"
                        name="service"
                        value={SERVICE_SLUGS[s]}
                        defaultChecked={filters.services.includes(s)}
                        className="size-[18px] accent-accent"
                      />
                      {serviceLabel(s)}
                      <span className="ml-auto text-[13px] text-soft">{counts[s]}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <fieldset>
                <legend className={sectionTitle}>{fr.results.cancellation}</legend>
                <label htmlFor="f-annulation" className="flex min-h-11 items-center gap-2.5 text-[15px] md:min-h-9">
                  <input
                    id="f-annulation"
                    type="checkbox"
                    name="annulation"
                    value="gratuite"
                    defaultChecked={filters.freeCancellation}
                    className="size-[18px] accent-accent"
                  />
                  {fr.results.freeCancellation}
                  <span className="ml-auto text-[13px] text-soft">{results.filter(r => r.cancellationPolicy !== "non_refundable").length}</span>
                </label>
              </fieldset>
              <fieldset>
                <legend className={`${sectionTitle} mb-2.5`}>{fr.results.shuttle}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {[...SHUTTLE_LIMITS, null].map(limit => (
                    <label
                      key={limit ?? "any"}
                      htmlFor={`f-navette-${limit ?? "any"}`}
                      className="inline-flex h-11 cursor-pointer items-center rounded-full border border-line bg-white px-3.5 text-sm font-semibold whitespace-nowrap has-checked:border-accent has-checked:bg-accent has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent md:h-[38px]"
                    >
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
                  <legend className={`${sectionTitle} mb-2.5`}>{fr.results.totalPrice}</legend>
                  <PriceRange
                    id="f-prix"
                    max={ceilingCents / 100}
                    value={Math.min(ceilingCents, filters.maxPriceCents ?? ceilingCents) / 100}
                  />
                </fieldset>
              )}
            </FiltersForm>
            {hasActiveFilters(filters) && (
              <Link href={clearHref} className="mt-3 inline-flex min-h-11 items-center text-[15px] font-semibold">
                {fr.results.clear}
              </Link>
            )}
          </aside>
        </div>

        <div className={map ? "flex flex-col gap-3 [grid-area:head] lg:flex-row lg:flex-wrap lg:items-center lg:justify-between" : "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"}>
          <h1 id="resultats" className="font-title text-[26px] md:text-[30px]" aria-live="polite">
            {fr.results.available(availableCount)}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5">
            <nav aria-label={fr.results.sort} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-sm text-soft">{fr.results.sort}</span>
              {SORT_KEYS.map(key => (
                <Link
                  key={key}
                  href={withFilters({ sort: key })}
                  scroll={false}
                  replace
                  aria-current={filters.sort === key ? "true" : undefined}
                  className={`inline-flex h-11 items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap no-underline md:h-[38px] ${
                    filters.sort === key ? "bg-accent text-white hover:text-white" : "border border-line bg-white text-ink hover:text-ink"
                  }`}
                >
                  {fr.results.sortBy[key]}
                </Link>
              ))}
            </nav>
            <Link
              href={mapToggleHref}
              scroll={false}
              replace
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-white px-3.5 text-sm font-semibold whitespace-nowrap text-accent no-underline hover:border-accent md:h-[38px] lg:ml-2"
            >
              <MapIcon />
              {map ? fr.map.hide : fr.map.show}
            </Link>
          </div>
        </div>

        {map && (
          <div className="-mx-4 h-[300px] overflow-hidden [grid-area:map] sm:mx-0 sm:h-[380px] sm:rounded-[22px] lg:sticky lg:top-4 lg:h-[calc(100dvh-2rem)] lg:max-h-[860px] lg:self-start">
            <div className="relative h-full">
              <ResultsMapPanel airport={{ name: airport.name, location: airport.location ?? null }} parkings={mapParkings} />
              {notDrawn > 0 && (
                <p className="pointer-events-none absolute bottom-9 left-2.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] text-soft shadow-sm">
                  {fr.map.notDrawn(notDrawn)}
                </p>
              )}
            </div>
          </div>
        )}

        <section aria-labelledby="resultats" className={`flex min-w-0 flex-col gap-4 ${map ? "[grid-area:list]" : "md:col-start-2"}`}>
          {shown.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-[22px] bg-white p-6">
              <h2 className="text-lg font-bold">{results.length === 0 ? fr.results.noneTitle : fr.results.noMatchTitle}</h2>
              <p className="text-soft">{results.length === 0 ? fr.results.noneText : fr.results.noMatchText}</p>
              {results.length > 0 && (
                <Link href={clearHref} className="btn-secondary h-11 px-4 text-[15px]">
                  {fr.results.clear}
                </Link>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
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
          <p className="mt-1 text-[13px] text-soft">{texts(data.payments === "online").results.footnote}</p>
        </section>
      </main>
    </>
  );
}
