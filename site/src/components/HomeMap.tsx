"use client";

import dynamic from "next/dynamic";
import type { MapParking, MapShuttle } from "./ResultsMap";
import { fr } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import { shuttleTone } from "@/lib/shuttle-icon";
import type { AirportLive, LatLng, SearchResult } from "@/lib/types";

// The map's code (MapLibre) loads in the browser only, after the page.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  // The message sits on a paper pill: warm grey on the map ground itself would be under 4.5:1 (and without JavaScript
  // this is all the home map shows).
  loading: () => (
    <div className="flex h-full items-center justify-center bg-map">
      <span className="pill-float font-semibold">{fr.map.loading}</span>
    </div>
  ),
});

/**
 * The map's pins for the stay's results: price pills (bookable) or "Complet". `best` (the cheapest, shown in the
 * « Le moins cher » card) is the orange pin.
 */
export function pinsOf(results: SearchResult[], best: string | null = null): MapParking[] {
  return results
    .filter(r => r.location)
    .map(r => ({
      slug: r.slug,
      title: r.title,
      label: r.available && r.priceCents !== null ? formatShortEuros(r.priceCents) : r.priceCents === null ? fr.map.noPrice : fr.map.full,
      bookable: r.available && r.priceCents !== null,
      location: r.location!,
      live: r.liveShuttle === true,
      best: r.slug === best,
    }));
}

/** The shuttles the map can draw: those with a position, named after their parking. */
export function shuttlesOf(live: AirportLive | null, titles: Map<string, string>): MapShuttle[] {
  return (live?.shuttles ?? [])
    .filter(s => s.position)
    .map(s => ({
      id: s.id,
      title: fr.map.shuttle(titles.get(s.parking) ?? live?.parkings.find(p => p.slug === s.parking)?.title ?? s.parking, s.direction),
      position: s.position!,
      age: s.positionAgeSeconds === null ? null : fr.map.shuttleAge(s.positionAgeSeconds),
      tone: shuttleTone(s.direction, true),
      heading: s.heading ?? null,
    }));
}

/**
 * The hero's map (T-A, then K-A): the terminals, the stay's parkings as price pills and the shuttles on the
 * road. The padding keeps the pins clear of the pills at the top and of the « Le moins cher » card at the bottom.
 */
export function HomeMap({
  airport,
  results,
  featured = null,
  selected,
  onSelect,
  shuttles,
}: {
  airport: { name: string; location: LatLng | null };
  results: SearchResult[];
  /** The cheapest bookable parking: its pin is orange (Boutique: orange = the best price, espresso = the selection). */
  featured?: string | null;
  selected: string | null;
  onSelect: (slug: string) => void;
  shuttles: MapShuttle[];
}) {
  return (
    <ResultsMap
      airport={airport}
      parkings={pinsOf(results, featured)}
      controls
      controlsPosition="bottom-right"
      padding={{ top: 90, bottom: 140, left: 50, right: 50 }}
      shuttles={shuttles}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
