"use client";

import { useMemo, useState } from "react";
import Link from "@/components/Link";
import { DemoBadge } from "./DemoBadge";
import { FactChips } from "./Highlights";
import { Photo } from "./Photo";
import { ShuttleBox } from "./ShuttleBox";
import { fr, fromPriceUnit } from "@/lib/fr";
import { factChips, shuttleBox } from "@/lib/highlights";
import { formatEuros } from "@/lib/money";
import type { AirportResponse } from "@/lib/types";

type Listing = AirportResponse["listings"][number];
export type PartnerSort = "cheapest" | "shortest" | "live" | "dearest";

/** A missing value goes last, whatever the order asked. */
const byNumber = (a: number | null | undefined, b: number | null | undefined, direction: 1 | -1) =>
  a == null ? (b == null ? 0 : 1) : b == null ? -1 : (a - b) * direction;

/** The partners in the order asked; the order of the page settles a tie. */
export function sortPartners(listings: Listing[], sort: PartnerSort): Listing[] {
  const compare: Record<PartnerSort, (a: Listing, b: Listing) => number> = {
    cheapest: (a, b) => byNumber(a.fromPriceCents, b.fromPriceCents, 1),
    dearest: (a, b) => byNumber(a.fromPriceCents, b.fromPriceCents, -1),
    shortest: (a, b) => byNumber(a.shuttleMinutes, b.shuttleMinutes, 1),
    live: (a, b) => Number(!!b.liveShuttle) - Number(!!a.liveShuttle),
  };
  return listings.map((listing, i) => ({ listing, i })).sort((a, b) => compare[sort](a.listing, b.listing) || a.i - b.i).map(x => x.listing);
}

/** The sorts worth showing: one needs two parkings that differ on it. */
export function sortsFor(listings: Listing[]): PartnerSort[] {
  if (listings.length < 2) return [];
  const sorts: PartnerSort[] = [];
  const prices = new Set(listings.map(l => l.fromPriceCents).filter(p => p !== null));
  if (prices.size > 1) sorts.push("cheapest");
  if (new Set(listings.map(l => l.shuttleMinutes).filter(m => m !== null)).size > 1) sorts.push("shortest");
  if (listings.some(l => l.liveShuttle) && listings.some(l => !l.liveShuttle)) sorts.push("live");
  if (prices.size > 1) sorts.push("dearest");
  return sorts;
}

/**
 * The airport's partner parkings (direction A, 24/11/2026): sorts as pills, then one card per parking with its
 * price in a column of its own, « À partir de », and the button that leads to its page.
 */
export function PartnerList({ airport, listings }: { airport: { slug: string; code: string }; listings: Listing[] }) {
  const sorts = useMemo(() => sortsFor(listings), [listings]);
  const [sort, setSort] = useState<PartnerSort>("cheapest");
  const sorted = useMemo(() => sortPartners(listings, sort), [listings, sort]);
  const real = listings.filter(l => !l.isDemo && l.fromPriceCents !== null);
  const cheapest = real.length > 1 ? sortPartners(real, "cheapest")[0]!.slug : null;
  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {sorts.length > 0 && (
        <div role="group" aria-label={fr.home.sort} data-testid="partner-sorts" className="flex flex-wrap items-center gap-2 text-[13.5px]">
          <span className="font-semibold text-soft">{fr.home.sort} :</span>
          {sorts.map(key => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              onClick={() => setSort(key)}
              className={`min-h-9 rounded-full border px-3.5 font-bold transition-colors ${sort === key ? "border-dark bg-dark text-white" : "border-line bg-paper text-ink hover:border-mute"}`}
            >
              {fr.home.sorts[key]}
            </button>
          ))}
        </div>
      )}
      <ul className="flex flex-col gap-3 md:gap-4">
        {sorted.map(listing => {
          const shuttle = shuttleBox(listing);
          return (
            <li key={listing.slug}>
              {/* Phones: the photo beside the name and the facts, the price and the button below on the card's whole width. */}
              <article className="card @container grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden md:grid-cols-[220px_minmax(0,1fr)_190px]">
                <div className="relative">
                  <Photo src={listing.photo} alt={listing.title} className="h-full min-h-[120px] w-full md:min-h-[200px]" />
                  {listing.slug === cheapest && (
                    <span className="absolute top-2 left-2 rounded-full bg-accent-bg px-2 py-0.5 text-[10.5px] font-extrabold whitespace-nowrap text-accent-dark md:px-2.5 md:text-[11.5px]">{fr.home.cheapest}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-2 px-3.5 pt-3 pb-3 md:px-5 md:py-5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="font-title text-[19px] leading-snug md:text-[24px]">{listing.title}</h3>
                    {listing.isDemo && <DemoBadge />}
                  </div>
                  {shuttle && <ShuttleBox facts={shuttle} slug={listing.slug} airportSlug={airport.slug} airportCode={airport.code} location={listing.location ?? null} />}
                  <FactChips chips={factChips(listing)} />
                </div>
                <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-soft bg-paper px-3.5 py-3 md:col-span-1 md:flex-col md:items-stretch md:justify-start md:gap-1 md:border-t-0 md:border-l md:p-5">
                  {listing.fromPriceCents !== null ? (
                    <span className="flex flex-col leading-tight">
                      <span className="eyebrow">{fr.home.startingAt}</span>
                      <b className={`text-[24px] font-extrabold tracking-[-.01em] tabular-nums md:text-[28px] ${listing.slug === cheapest ? "text-accent-dark" : "text-ink"}`}>
                        {formatEuros(listing.fromPriceCents)}
                      </b>
                      <span className="text-[12.5px] font-medium text-soft">
                        {listing.fromDays ? `${fromPriceUnit(listing.fromDays)} · ` : ""}
                        {fr.home.exactPrice}
                      </span>
                    </span>
                  ) : (
                    <span />
                  )}
                  <Link href={`/${airport.slug}/${listing.slug}`} className="btn-primary btn-sm md:mt-auto">
                    {listing.fromPriceCents !== null ? fr.home.seePrice : fr.home.seeParking}
                    <span className="sr-only"> {listing.title}</span>
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
