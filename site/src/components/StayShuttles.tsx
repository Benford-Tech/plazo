"use client";

import { useEffect, useState } from "react";
import { LivePill } from "./ReturnLive";
import { Plate } from "./Plate";
import { bookingRequest } from "@/lib/booking-client";
import { fr } from "@/lib/fr";
import { ShuttleIcon, shuttleTone } from "@/lib/shuttle-icon";
import type { StayShuttles as StayShuttlesData } from "@/lib/types";

const POLL_MS = 12_000;

/**
 * D (06/10/2026): the "Navette" block of a booking during its stay (S-A in the app), from the
 * arrival day to the return day: the parking's shuttles on the road, the traveller's own flagged.
 * The server says when the block applies (`phase`); it hides itself otherwise.
 */
export function StayShuttles({ reference, token, initial = null }: { reference: string; token: string; initial?: StayShuttlesData | null }) {
  const t = fr.stayShuttles;
  const [data, setData] = useState<StayShuttlesData | null>(initial);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let alive = true;
    const load = () =>
      void bookingRequest<StayShuttlesData>(reference, "/shuttles", token).then(
        next => {
          if (!alive) return;
          setData(next);
          setFetchedAt(Date.now());
        },
        () => {},
      );
    if (!initial) load();
    const poll = setInterval(load, POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [reference, token, initial]);

  if (!data || !data.phase) return null;
  const shuttles = data.shuttles;
  return (
    <section aria-labelledby="navette-sejour" data-testid="stay-shuttles" className="card flex flex-col gap-3.5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h2 id="navette-sejour" className="flex items-center gap-2 text-base font-extrabold">
          {/* The heading's bus only illustrates it (ink); the rows below carry each shuttle's direction colour. */}
          <ShuttleIcon tone="plain" size={20} />
          {shuttles.length ? t.titleLive(shuttles.length) : t.title}
        </h2>
        {shuttles.length > 0 && <LivePill at={fetchedAt} now={now} />}
      </div>
      {shuttles.length === 0 ? (
        <p className="rounded-field bg-tint px-3.5 py-3 text-sm leading-snug">{t.none[data.phase]}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {shuttles.map(s => {
            const eta = s.etaMinutes;
            const where = eta === null ? t.noPosition : s.destination?.kind === "meeting_point" ? t.etaMeeting(eta) : t.etaParking(eta);
            return (
              // Boutique: the traveller's own shuttle gets an espresso hairline and pill (it was peach); the others a soft one.
              <li key={s.tripId} data-testid={`stay-shuttle-${s.tripId}`} className={`flex flex-col gap-1.5 rounded-field border px-4 py-3 ${s.mine ? "border-dark" : "border-line-soft"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b className="flex items-center gap-2 text-[15px]">
                    <ShuttleIcon tone={shuttleTone(s.direction, !!s.position)} size={20} />
                    {t.vehicle(s.vehicle.colour)}
                  </b>
                  {s.mine ? <span className="pill pill-dark">{t.mine}</span> : <span className="chip">{t.direction[s.direction]}</span>}
                </div>
                {(s.vehicle.model || s.vehicle.plate) && (
                  <div className="flex items-center gap-2 text-[13px] font-medium text-soft">
                    {s.vehicle.model}
                    {s.vehicle.plate && <Plate plate={s.vehicle.plate} size="sm" />}
                  </div>
                )}
                <p className="text-[13.5px] leading-snug">{[t.driver(s.driverFirstName), s.mine ? t.direction[s.direction] : null, where].filter(Boolean).join(" · ")}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
