"use client";

import Link from "next/link";
import { useState } from "react";
import { useAirportLive } from "./AirportLive";
import { HomeMap, shuttlesOf } from "./HomeMap";
import { ChevronIcon } from "./stay/pill";
import { daysLabel, stayQuery } from "@/lib/dates";
import { fr, fromPriceUnit } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import type { LatLng, SearchResult } from "@/lib/types";

const km = (value: number) => (value < 10 ? value.toFixed(1).replace(".", ",") : String(Math.round(value)));

/**
 * K-A (06/10/2026), the "carte vivante": the hero's map is interactive (drag, zoom; two fingers on a
 * phone), shows every parking of the stay as a pill and the shuttles on the road as moving markers
 * (polled every 12 s; the page's shared poll inside an `AirportLiveProvider`). Tapping a pill puts that parking in the
 * card at the bottom.
 *
 * Boutique (11/10/2026): the map is a card with the warm hairline (no shadow); two floating pills (how many
 * parkings for how many days, the shuttles on the road with the live dot); the bottom card is a white
 * floating card, « Le moins cher » in small orange capitals and the price in orange on the right. A full
 * parking keeps a legible card: a « Complet » state pill, its name and its facts at full colour.
 */
export function HomeMapPanel({
  airport,
  results,
  featured,
  arrivee,
  retour,
  days,
}: {
  airport: { slug: string; name: string; location: LatLng | null };
  results: SearchResult[];
  /** Slug of the cheapest bookable parking: the card until the traveller picks another one. */
  featured: string | null;
  arrivee: string;
  retour: string;
  days: number;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const live = useAirportLive(airport.slug);
  const bookable = results.filter(r => r.available && r.priceCents !== null);
  const selected = results.find(r => r.slug === picked) ?? results.find(r => r.slug === featured) ?? null;
  const shuttles = shuttlesOf(live, new Map(results.map(r => [r.slug, r.title])));
  const isBookable = !!selected && selected.available && selected.priceCents !== null;
  const facts = selected
    ? [fr.home.featuredSub(selected.services.includes("valet"), selected.shuttleMinutes), selected.distanceKm === null ? null : fr.home.mapDistance(km(selected.distanceKm), null)]
        .filter(Boolean)
        .join(" · ")
    : "";
  return (
    <div
      className="relative min-h-[380px] overflow-hidden rounded-card border border-line bg-map sm:min-h-[440px] lg:h-full lg:min-h-[520px]"
      data-testid="home-map"
      data-home-map
    >
      <div className="absolute inset-0">
        {/* The cheapest is the orange pin; another parking the traveller picks turns espresso. */}
        <HomeMap
          airport={{ name: airport.name, location: airport.location }}
          results={results}
          featured={featured}
          selected={selected && selected.slug !== featured ? selected.slug : null}
          onSelect={setPicked}
          shuttles={shuttles}
        />
      </div>
      <div className="pointer-events-none absolute top-3 right-3 left-3 flex flex-wrap items-start justify-between gap-2">
        <span className="pill-float" data-testid="home-map-count">
          {fr.home.mapAvailable(bookable.length)}
          <span className="-ml-0.5 font-semibold text-soft">· {daysLabel(days)}</span>
        </span>
        {/* Only while shuttles are running: no "none" pill on a quiet map. */}
        {live && live.shuttles.length > 0 && (
          <span className="pill-float ml-auto" data-testid="home-map-shuttles">
            <span aria-hidden="true" className="live-dot" />
            {fr.home.mapShuttles(live.shuttles.length)}
          </span>
        )}
      </div>
      {selected && (
        <Link
          href={`/${airport.slug}/${selected.slug}${stayQuery({ arrivee, retour })}`}
          data-testid="home-featured"
          aria-label={fr.home.featuredSee(selected.title)}
          className="card absolute right-3 bottom-3 left-3 flex items-center gap-3 bg-paper px-4 py-3 text-ink no-underline shadow-float hover:border-soft/50 hover:text-ink"
        >
          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
            {!isBookable ? (
              <span className="pill pill-danger mb-0.5">{fr.home.mapFull}</span>
            ) : selected.slug === featured ? (
              <span className="eyebrow text-accent-dark">{fr.results.cheapest}</span>
            ) : null}
            <span className="font-title block max-w-full truncate text-[19px] leading-tight">{selected.title}</span>
            <span className="block text-[12.5px] leading-snug font-semibold text-soft">{facts}</span>
          </span>
          {isBookable ? (
            <span className="flex flex-none flex-col items-end self-end text-right whitespace-nowrap">
              <span className="text-[12px] leading-tight font-semibold text-soft">{fr.home.from}</span>{" "}
              <b className="text-[22px] leading-[1.1] font-extrabold tracking-[-.01em] text-brand-deep tabular-nums">{formatShortEuros(selected.priceCents!)}</b>
              <span className="text-[12px] leading-tight font-semibold text-soft">{fromPriceUnit(selected.days || days)}</span>
            </span>
          ) : (
            <span aria-hidden="true" className="flex size-11 flex-none items-center justify-center rounded-full bg-tint text-soft">
              <ChevronIcon direction="right" size={18} />
            </span>
          )}
        </Link>
      )}
    </div>
  );
}
