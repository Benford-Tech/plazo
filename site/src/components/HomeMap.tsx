"use client";

import dynamic from "next/dynamic";
import type { MapParking } from "./ResultsMap";
import { fr } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import type { LatLng, SearchResult } from "@/lib/types";

// The map's code (MapLibre) loads in the browser only, after the page.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-soft">{fr.map.loading}</div>,
});

/** The hero's map (T-A): the terminals and the stay's parkings as price pills, the best offer first. */
export function HomeMap({ airport, results, featured }: { airport: { name: string; location: LatLng | null }; results: SearchResult[]; featured: string | null }) {
  const parkings: MapParking[] = results
    .filter(r => r.location)
    .map(r => ({ slug: r.slug, title: r.title, label: r.priceCents === null ? fr.map.noPrice : formatShortEuros(r.priceCents), bookable: r.slug === featured, location: r.location! }));
  return <ResultsMap airport={airport} parkings={parkings} controls={false} padding={{ top: 110, bottom: 150, left: 50, right: 50 }} />;
}
