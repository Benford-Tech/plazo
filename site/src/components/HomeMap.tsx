"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { MapParking, MapShuttle } from "./ResultsMap";
import { fr } from "@/lib/fr";
import { formatShortEuros } from "@/lib/money";
import { bearing, shuttleTone } from "@/lib/shuttle-icon";
import type { AirportLive, LatLng, SearchResult } from "@/lib/types";

// The map's code (MapLibre) loads in the browser only, after the page.
const ResultsMap = dynamic(() => import("./ResultsMap"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-soft">{fr.map.loading}</div>,
});

/** How often the home map asks for the shuttles on the road (K-A). */
export const LIVE_POLL_MS = 12_000;

/**
 * K-A (06/10/2026): the home map's live layer — every 12 s the browser reads the airport's
 * shuttles on the road (anonymous: a position, a direction, a vehicle) and the map moves them.
 * Null until the first answer, or while the API is unreachable (the map works without it).
 */
export function useAirportLive(slug: string): AirportLive | null {
  const [live, setLive] = useState<AirportLive | null>(null);
  // I-C: the heading of each shuttle comes from its previous position (the API gives none).
  const previous = useRef(new Map<string, { position: LatLng; heading: number | null }>());
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/public/airports/${encodeURIComponent(slug)}/live`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as AirportLive;
        const next = new Map<string, { position: LatLng; heading: number | null }>();
        for (const s of data.shuttles) {
          if (!s.position) continue;
          const before = previous.current.get(s.id);
          const heading = before ? (bearing(before.position, s.position) ?? before.heading) : null;
          next.set(s.id, { position: s.position, heading });
          s.heading = heading;
        }
        previous.current = next;
        if (!cancelled) setLive(data);
      } catch {
        // Offline or the API is down: the last answer stays, the map still shows the parkings.
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), LIVE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [slug]);
  return live;
}

/** The map's pins for the stay's results: price pills (orange = the selected one, bookable) or "Complet". */
export function pinsOf(results: SearchResult[]): MapParking[] {
  return results
    .filter(r => r.location)
    .map(r => ({
      slug: r.slug,
      title: r.title,
      label: r.available && r.priceCents !== null ? formatShortEuros(r.priceCents) : r.priceCents === null ? fr.map.noPrice : fr.map.full,
      bookable: r.available && r.priceCents !== null,
      location: r.location!,
      live: r.liveShuttle === true,
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

/** The hero's map (T-A, then K-A): the terminals, the stay's parkings as price pills and the shuttles on the road. */
export function HomeMap({
  airport,
  results,
  selected,
  onSelect,
  shuttles,
}: {
  airport: { name: string; location: LatLng | null };
  results: SearchResult[];
  selected: string | null;
  onSelect: (slug: string) => void;
  shuttles: MapShuttle[];
}) {
  return (
    <ResultsMap
      airport={airport}
      parkings={pinsOf(results)}
      controls
      controlsPosition="bottom-right"
      padding={{ top: 120, bottom: 150, left: 50, right: 50 }}
      shuttles={shuttles}
      selected={selected}
      onSelect={onSelect}
    />
  );
}
