"use client";

import { useEffect, useState } from "react";
import { useSharedAirportLive } from "./AirportLive";
import { fr } from "@/lib/fr";
import { SHUTTLE_PATH } from "@/lib/shuttle-icon";
import { railPlace, railState } from "@/lib/shuttle-rail";
import type { LatLng } from "@/lib/types";

/** Inner track of the rail: the minibuses run between the P tile (20 px) and the plane tile (20 px). */
const TILE_PX = 20;

/**
 * L3 « Le trajet en direct » (14/10/2026), in the shuttle box of a parking whose shuttles are shown live: « ● Navette en
 * direct » with the age of the freshest position, then a dashed rail from the parking (espresso P) to the terminal
 * (plane), each running shuttle a paper disc with an orange ring at its real progress (at most three). It reads the
 * page's shared poll (`AirportLiveProvider`) and never asks the API itself: without it, or while no shuttle runs, the rail
 * has no minibus and says « Suivie en direct le jour J ». Until the page's first read comes back the status stays empty
 * (it does not know yet). The minibuses glide between two answers; with reduced motion they jump and the dot does not
 * breathe.
 */
export function LiveShuttleRail({
  slug,
  airportSlug,
  airportCode,
  rideMinutes,
  location = null,
}: {
  slug: string;
  airportSlug: string;
  airportCode?: string | null;
  rideMinutes: number | null;
  location?: LatLng | null;
}) {
  const t = fr.highlights.shuttleBox;
  const { state: shared, pending } = useSharedAirportLive(airportSlug);
  const rail = railState(shared?.live ?? null, slug, location);
  const place = railPlace(airportCode ?? shared?.live.airport.code);
  const destination = t[place];
  const hasAge = rail.ageSeconds !== null;
  // The age runs on between two answers (every 12 s), one tick a second, only while there is one to show.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!hasAge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [hasAge]);
  const age = hasAge && shared ? rail.ageSeconds! + Math.max(0, Math.floor((now - shared.receivedAt) / 1000)) : null;

  return (
    <div data-testid="live-rail" className="mt-2.5 border-t border-line-soft pt-2.5">
      {/* On a narrow card the age (or « Suivie en direct le jour J ») goes under the title rather than squeezing it. */}
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="flex items-center gap-[7px] text-[10px] leading-tight font-extrabold tracking-[.12em] whitespace-nowrap text-ink uppercase">
          <span aria-hidden="true" className="live-dot" />
          {t.live}
        </span>
        <span data-testid="live-rail-status" className={`text-[11.5px] leading-tight font-bold whitespace-nowrap tabular-nums ${age !== null ? "text-ok" : "text-soft"}`}>
          {/* A non-breaking space keeps the line while the first read is on its way. */}
          {age !== null ? fr.live.ago(age) : pending ? "\u00a0" : t.dayJ}
        </span>
      </div>
      <div role="img" aria-label={t.rail(place, pending ? null : rail.running, rail.markers.length)} className="relative mx-1 mt-1.5 mb-0.5 h-[30px]">
        <span aria-hidden="true" className="absolute top-1/2 right-3 left-2.5 border-t-2 border-dashed border-mute/60" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 left-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-[6px] bg-dark text-[11px] leading-none font-extrabold text-lilac"
        >
          P
        </span>
        <span aria-hidden="true" className="absolute top-1/2 right-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-[6px] bg-tint text-dark">
          <PlaneIcon />
        </span>
        {rail.markers.map(marker => (
          <span
            key={marker.id}
            aria-hidden="true"
            data-testid="rail-shuttle"
            data-progress={marker.progress.toFixed(2)}
            style={{ left: `calc(${TILE_PX}px + (100% - ${2 * TILE_PX}px) * ${marker.progress.toFixed(4)})` }}
            className="absolute top-1/2 z-[1] flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-paper text-accent-dark shadow-pin transition-[left] duration-[1200ms] ease-out motion-reduce:transition-none"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" className={marker.towardsParking ? "-scale-x-100" : ""}>
              <path d={SHUTTLE_PATH} />
            </svg>
          </span>
        ))}
      </div>
      <div className="flex justify-between gap-2 text-[11px] leading-tight font-semibold text-soft">
        <span>{t.parking}</span>
        <span className="text-right">{t.destination(destination, rideMinutes)}</span>
      </div>
    </div>
  );
}

function PlaneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}
