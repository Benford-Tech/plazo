"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { bearing } from "@/lib/shuttle-icon";
import type { AirportLive, LatLng } from "@/lib/types";

/** How often the live layer asks for the shuttles on the road (K-A). */
export const LIVE_POLL_MS = 12_000;

export interface AirportLiveState {
  live: AirportLive;
  /** When the browser received this answer (Date.now()): the positions' ages run on from there. */
  receivedAt: number;
}

interface LivePoll {
  state: AirportLiveState | null;
  /** The first read has come back, with an answer or without one (the API unreachable). */
  settled: boolean;
}

/**
 * K-A (06/10/2026): every 12 s the browser reads the airport's shuttles on the road (anonymous: a position, a
 * direction, a vehicle). `state` is null until the first answer, or while the API is unreachable (the pages work
 * without it). No request while `slug` is null.
 */
function useLivePoll(slug: string | null): LivePoll {
  const [state, setState] = useState<AirportLiveState | null>(null);
  const [settled, setSettled] = useState(false);
  // I-C: the heading of each shuttle comes from its previous position (the API gives none).
  const previous = useRef(new Map<string, { position: LatLng; heading: number | null }>());
  useEffect(() => {
    if (!slug) return;
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
        if (!cancelled) setState({ live: data, receivedAt: Date.now() });
      } catch {
        // Offline or the API is down: the last answer stays, the pages still show the parkings.
      } finally {
        if (!cancelled) setSettled(true);
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), LIVE_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [slug]);
  return { state, settled };
}

interface Shared {
  slug: string;
  state: AirportLiveState | null;
  /** No read has come back yet: the page does not know whether a shuttle runs. */
  pending: boolean;
  /** A reader joins the poll; the function it returns leaves it. */
  retain: () => () => void;
}

const LiveContext = createContext<Shared | null>(null);

/**
 * 14/10/2026 (L3): ONE poll of the airport's live answer for a whole page (the home map, the cards' live rails),
 * never one request per card. It only runs while something on the page reads it: a page without a live parking asks
 * for nothing.
 */
export function AirportLiveProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const [readers, setReaders] = useState(0);
  const retain = useCallback(() => {
    setReaders(n => n + 1);
    return () => setReaders(n => n - 1);
  }, []);
  const { state, settled } = useLivePoll(readers > 0 ? slug : null);
  const pending = state === null && !settled;
  const value = useMemo(() => ({ slug, state, pending, retain }), [slug, state, pending, retain]);
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

/**
 * The page's shared answer for this airport: `state` is null outside an `AirportLiveProvider` of the same airport (no
 * poll then, never `pending`), and `pending` until the page's first read has come back (in the server's HTML too).
 */
export function useSharedAirportLive(slug: string): { state: AirportLiveState | null; pending: boolean } {
  const ctx = useContext(LiveContext);
  const shared = ctx?.slug === slug ? ctx : null;
  const retain = shared?.retain;
  useEffect(() => retain?.(), [retain]);
  return { state: shared?.state ?? null, pending: shared?.pending ?? false };
}

/**
 * The airport's shuttles on the road: the page's shared poll inside an `AirportLiveProvider`, else a poll of its own
 * (the home map on its own).
 */
export function useAirportLive(slug: string): AirportLive | null {
  const ctx = useContext(LiveContext);
  const isShared = ctx?.slug === slug;
  const shared = useSharedAirportLive(slug).state;
  const own = useLivePoll(isShared ? null : slug).state;
  return (isShared ? shared : own)?.live ?? null;
}
