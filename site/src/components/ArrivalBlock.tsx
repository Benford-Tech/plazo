"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fr } from "@/lib/fr";
import { BookingClientError, bookingRequest, dayAndTime, durationLabel, hhmm } from "@/lib/booking-client";
import type { ArrivalKind, TravellerArrival } from "@/lib/types";

/** Polled every 10 s while a signal is live, every minute otherwise (the moment opens on its own). */
const LIVE_POLL_MS = 10_000;
const IDLE_TICKS = 6;

type LocationProblem = "denied" | "unavailable" | null;

function errorText(code: string): string {
  return fr.arrival.errors[code] ?? fr.errors[code] ?? fr.errors.unknown;
}

function meetingLabel(point: TravellerArrival["meetingPoint"], kind: ArrivalKind): string {
  const label = point?.label?.trim();
  if (label) return label;
  return kind === "outbound" ? fr.arrival.meetingReception : fr.arrival.meetingReturn;
}

/**
 * D (06/10/2026): "Prévenir de mon arrivée" on the site, the app's block with the same words and
 * routes. Drop-off day: share the live position (the browser's geolocation, explicit consent = the
 * button under the explanation; one position per 10 s at most) or "J'arrive dans 10 / 20 / 30 min".
 * Return day: "Je suis au point de rendez-vous" (with an optional one-off position) or "J'y suis
 * dans N min". The server decides when each moment is open; the block hides itself otherwise.
 */
export function ArrivalBlock({ reference, token, initial = null }: { reference: string; token: string; initial?: TravellerArrival | null }) {
  const t = fr.arrival;
  const [data, setData] = useState<TravellerArrival | null>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [withPosition, setWithPosition] = useState(false);
  const [problem, setProblem] = useState<LocationProblem>(null);
  const [now, setNow] = useState(() => Date.now());
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const stopWatching = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined" && navigator.geolocation) navigator.geolocation.clearWatch(watchId.current);
    watchId.current = null;
  }, []);

  const call = useCallback(
    async (path: string, body?: unknown): Promise<TravellerArrival | null> => {
      try {
        const next = await bookingRequest<TravellerArrival>(reference, path, token, body);
        setData(next);
        setError(null);
        return next;
      } catch (e) {
        const code = e instanceof BookingClientError ? e.code : "unknown";
        // Too fast for the server: nothing to tell the traveller, the next position will do.
        if (code !== "too_many_positions") setError(errorText(code));
        if (code === "not_sharing" || code === "arrival_window_closed") void bookingRequest<TravellerArrival>(reference, "/arrival", token).then(setData, () => {});
        return null;
      }
    },
    [reference, token],
  );

  // The state, then the poll (faster while a signal is live) and the clock of the countdown.
  useEffect(() => {
    let ticks = 0;
    const load = () => void bookingRequest<TravellerArrival>(reference, "/arrival", token).then(setData, () => {});
    if (!initial) load();
    const poll = setInterval(() => {
      ticks += 1;
      const state = dataRef.current?.signal?.state;
      if (state === "sharing" || state === "announced" || ticks % IDLE_TICKS === 0) load();
    }, LIVE_POLL_MS);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
      stopWatching();
    };
  }, [reference, token, initial, stopWatching]);

  // The sharing ended on the server (arrived, expired, stopped elsewhere): stop reading the position.
  useEffect(() => {
    if (data?.signal?.state !== "sharing") stopWatching();
  }, [data, stopWatching]);

  const sendPosition = useCallback(
    (position: GeolocationPosition) => {
      const interval = (dataRef.current?.rules.positionIntervalSeconds ?? 10) * 1000;
      if (Date.now() - lastSentAt.current < interval) return;
      lastSentAt.current = Date.now();
      void call("/arrival/position", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        recordedAt: new Date(position.timestamp).toISOString(),
      });
    },
    [call],
  );

  const share = async () => {
    setProblem(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setProblem("unavailable");
      return;
    }
    setBusy(true);
    // The tap on this button, right under the explanation, is the consent.
    const next = await call("/arrival/start", { kind: "outbound", consent: true });
    setBusy(false);
    if (!next || next.signal?.state !== "sharing") return;
    lastSentAt.current = 0;
    stopWatching();
    watchId.current = navigator.geolocation.watchPosition(sendPosition, () => setProblem("denied"), { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  };

  const announce = async (kind: ArrivalKind, minutes: number) => {
    setBusy(true);
    await call("/arrival/announce", { kind, minutes });
    setBusy(false);
    setShowAnnounce(false);
  };

  const atMeetingPoint = async () => {
    setBusy(true);
    let position: { lat: number; lng: number } | null = null;
    if (withPosition && typeof navigator !== "undefined" && navigator.geolocation) {
      position = await new Promise(resolve =>
        navigator.geolocation.getCurrentPosition(
          p => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve(null),
          { timeout: 10000, maximumAge: 30000 },
        ),
      );
    }
    await call("/arrival/at-meeting-point", { kind: "return", ...(position ?? {}) });
    setBusy(false);
  };

  const stop = async (kind: ArrivalKind) => {
    stopWatching();
    setBusy(true);
    await call("/arrival/stop", { kind });
    setBusy(false);
  };

  const moment = data?.moment;
  if (!data || !moment) return null;
  const signal = data.signal && data.signal.kind === moment.kind ? data.signal : null;
  const kind = moment.kind;
  const meeting = meetingLabel(data.meetingPoint, kind);

  const notice = (text: string, tone: "plain" | "error" = "plain") => (
    <p role={tone === "error" ? "alert" : undefined} className={`rounded-[16px] px-3.5 py-3 text-sm ${tone === "error" ? "bg-danger-bg text-danger" : "bg-tint text-ink"}`}>
      {text}
    </p>
  );
  const done = (title: string, text: string) => (
    <div data-testid="arrival-done" className="flex flex-col gap-1.5 rounded-[18px] border-[1.6px] border-peach bg-white px-4 py-3.5">
      <b className="flex items-center gap-2 text-base">
        <span aria-hidden="true" className="text-peach">
          ✓
        </span>
        {title}
      </b>
      <p className="text-sm text-soft">{text}</p>
    </div>
  );
  const announced = signal?.state === "announced" && (
    <div data-testid="arrival-announced" className="flex flex-wrap items-center gap-3 rounded-[18px] border-[1.6px] border-peach bg-white px-4 py-3.5 text-[14.5px]">
      <span aria-hidden="true" className="text-peach">
        ✓
      </span>
      <span className="min-w-0 flex-1">
        {(kind === "outbound" ? t.announcedText : t.announcedReturnText)(signal.announcedMinutes ?? signal.etaMinutes ?? 0, signal.etaAt ? hhmm(signal.etaAt) : "")}
      </span>
      <button type="button" disabled={busy} onClick={() => stop(kind)} className="text-sm font-semibold text-accent underline-offset-2 hover:underline">
        {t.cancelAnnounce}
      </button>
    </div>
  );
  const announceChips = (label: (m: number) => string) => (
    <>
      <button type="button" onClick={() => setShowAnnounce(v => !v)} className="btn-secondary h-12 text-[15px]" aria-expanded={showAnnounce}>
        {t.announceToggle}
      </button>
      {showAnnounce && (
        <div className="flex flex-wrap justify-center gap-2">
          {data.rules.announceMinutes.map(m => (
            <button key={m} type="button" disabled={busy} onClick={() => announce(kind, m)} className="h-10 rounded-full border border-accent bg-white px-4 text-sm font-semibold text-dark hover:bg-tint">
              {label(m)}
            </button>
          ))}
        </div>
      )}
    </>
  );

  let body: React.ReactNode;
  if (!moment.open) {
    body = notice((kind === "outbound" ? t.notYetOutbound : t.notYetReturn)(dayAndTime(moment.opensAt)));
  } else if (kind === "outbound") {
    if (signal?.state === "sharing") {
      const left = Math.max(0, Math.round((new Date(signal.expiresAt).getTime() - now) / 1000));
      body = (
        <div data-testid="arrival-sharing" className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-base font-extrabold text-accent">
            <span aria-hidden="true" className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex size-2.5 rounded-full bg-accent" />
            </span>
            {t.live}
          </p>
          <div className="flex items-center justify-between gap-3 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,.3)]">
            <div>
              <div className="text-sm">{t.etaLabel}</div>
              <div data-testid="arrival-eta" className="text-[28px] leading-tight font-extrabold tabular-nums">
                {signal.etaMinutes === null ? t.etaUnknown : t.etaMinutes(signal.etaMinutes)}
              </div>
            </div>
            <div className="text-right text-sm text-soft">
              {signal.distanceM !== null && <div>{signal.distanceM < 1000 ? `${signal.distanceM} m` : `${(signal.distanceM / 1000).toFixed(1).replace(".", ",")} km`}</div>}
              {signal.etaAt && <div>{t.arrivalAround(hhmm(signal.etaAt))}</div>}
              {signal.etaMinutes === null && <div>{t.waitingPosition}</div>}
            </div>
          </div>
          {notice(`✓ ${t.notified}`)}
          <p className="text-sm text-soft">{t.autoStop(durationLabel(left))}</p>
          <button type="button" disabled={busy} onClick={() => stop("outbound")} className="btn-secondary h-12 text-[15px]">
            {t.stop}
          </button>
        </div>
      );
    } else if (signal?.state === "at_meeting_point") {
      body = done(t.arrivedTitle, t.arrivedText);
    } else {
      body = (
        <>
          {announced}
          {signal?.state === "ended" && notice(signal.endReason === "expired" ? t.endedExpired : t.endedStopped)}
          <div className="rounded-[18px] bg-white px-4 py-3.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,.3)]">
            <b>{t.explainTitle}</b>
            <p className="mt-1.5 text-sm text-soft">
              {t.explainBefore}
              <b className="text-ink">{t.explainOnly}</b>
              {t.explainAfter}
            </p>
          </div>
          <button type="button" disabled={busy} onClick={share} className="btn-primary h-[52px] text-base">
            {busy ? t.sharing : t.share}
          </button>
          {announceChips(t.announceIn)}
          <p className="text-sm text-soft">{t.stopAnytime}</p>
        </>
      );
    }
  } else if (signal?.state === "at_meeting_point") {
    body = done(t.atPointDoneTitle, t.atPointDoneText(meeting));
  } else {
    body = (
      <>
        {announced}
        <div className="rounded-[18px] bg-white px-4 py-3.5 shadow-[0_10px_24px_-14px_rgba(0,0,0,.3)]">
          <b>{t.returnExplainTitle}</b>
          <p className="mt-1.5 text-sm text-soft">{t.returnExplain(meeting)}</p>
        </div>
        <button type="button" disabled={busy} onClick={atMeetingPoint} className="btn-primary h-[52px] text-base">
          {t.atPoint}
        </button>
        <label className="flex items-start gap-2.5 text-sm text-soft">
          <input type="checkbox" checked={withPosition} onChange={e => setWithPosition(e.target.checked)} className="mt-0.5 size-4 accent-accent" />
          {t.withPosition}
        </label>
        {announceChips(t.returnAnnounceIn)}
      </>
    );
  }

  return (
    <section aria-labelledby="prevenir" data-testid="arrival-block" className="card flex flex-col gap-3 p-4 md:p-[22px]">
      <h2 id="prevenir" className="text-base font-extrabold">
        {t.title}
      </h2>
      {body}
      {problem && notice(problem === "denied" ? t.locationDenied : t.locationUnavailable)}
      {error && notice(error, "error")}
    </section>
  );
}
