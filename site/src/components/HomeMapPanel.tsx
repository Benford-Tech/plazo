"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeMap, shuttlesOf, useAirportLive } from "./HomeMap";
import { stayQuery } from "@/lib/dates";
import { fr } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import type { LatLng, SearchResult } from "@/lib/types";

const km = (value: number) => (value < 10 ? value.toFixed(1).replace(".", ",") : String(Math.round(value)));

/**
 * K-A (06/10/2026), the "carte vivante": the hero's map is interactive (drag, zoom; two fingers on a
 * phone), shows every parking of the stay as a pill and the shuttles on the road as moving orange
 * markers (polled every 12 s). Tapping a pill puts that parking in the orange card at the bottom.
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
  const distanceLabel = selected ? fr.home.mapDistance(selected.distanceKm === null ? null : km(selected.distanceKm), selected.shuttleMinutes) : "";
  const isBookable = !!selected && selected.available && selected.priceCents !== null;
  return (
    <div className="relative overflow-hidden rounded-[22px] bg-[#e6e6e9] shadow-[0_24px_50px_-24px_rgba(30,20,10,.45)]" style={{ minHeight: 420 }} data-testid="home-map" data-home-map>
      <div className="absolute inset-0">
        <HomeMap airport={{ name: airport.name, location: airport.location }} results={results} selected={selected?.slug ?? null} onSelect={setPicked} shuttles={shuttles} />
      </div>
      <div className="pointer-events-none absolute top-3 left-3 flex flex-col items-start gap-2">
        <span className="pill-float" data-testid="home-map-count">
          {bookable.length > 0 && <span className="flex size-6 items-center justify-center rounded-full bg-ground text-xs">{bookable.length}</span>}
          {fr.home.mapAvailable(bookable.length)}
        </span>
        <span className="pill-float text-soft">{fr.home.mapStay(days)}</span>
        {live && (
          <span className="pill-float" data-testid="home-map-shuttles">
            <span aria-hidden="true" className="relative flex size-2.5">
              {live.shuttles.length > 0 && <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />}
              <span className={`relative inline-flex size-2.5 rounded-full ${live.shuttles.length > 0 ? "bg-accent" : "bg-line"}`} />
            </span>
            {fr.home.mapShuttles(live.shuttles.length)}
          </span>
        )}
      </div>
      {distanceLabel && (
        <span className="pill-float pointer-events-none absolute top-3 right-3" data-testid="home-map-distance">
          {distanceLabel}
        </span>
      )}
      {selected && (
        <Link
          href={`/${airport.slug}/${selected.slug}${stayQuery({ arrivee, retour })}`}
          data-testid="home-featured"
          aria-label={fr.home.featuredSee(selected.title)}
          className={`absolute right-3 bottom-3 left-3 flex items-center gap-3 rounded-[20px] p-4 no-underline ${
            isBookable ? "bg-accent text-white shadow-[0_18px_40px_-14px_rgba(255,102,0,.6)] hover:text-white" : "bg-dark text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,.6)] hover:text-white"
          }`}
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[13px] font-bold text-white/85">{isBookable ? fr.home.featuredFrom(formatShortEuros(selected.priceCents!)) : fr.home.mapFull}</span>
            <span className="truncate text-[19px] font-extrabold">{selected.title}</span>
            <span className="truncate text-[13px] font-semibold text-white/85">{fr.home.featuredSub(selected.services.includes("valet"), selected.shuttleMinutes)}</span>
          </span>
          <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-xl font-extrabold ${isBookable ? "text-accent" : "text-dark"}`}>
            ↗
          </span>
        </Link>
      )}
    </div>
  );
}
