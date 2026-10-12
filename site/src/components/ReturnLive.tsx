"use client";

import { useEffect, useRef, useState } from "react";
import { Plate } from "./Plate";
import { bookingRequest } from "@/lib/booking-client";
import { fr } from "@/lib/fr";
import { toInstant } from "@/lib/dates";
import { directionsUrl } from "@/lib/listing";
import { ShuttleIcon, shuttleTone } from "@/lib/shuttle-icon";
import type { ReturnNoticeKind, TravellerReturn } from "@/lib/types";

const POLL_MS = 10_000;
/** The ring spans this long before the landing (full at 3 h, empty at touchdown). */
const WINDOW_S = 3 * 3600;

const two = (n: number) => String(n).padStart(2, "0");
export const hms = (s: number) => `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
export const mmss = (s: number) => `${two(Math.floor(Math.max(0, s) / 60))}:${two(Math.max(0, s) % 60)}`;
/**
 * An instant from the API: flight times are ISO instants, `returnAt` is a wall-clock time at the parking
 * ("2026-10-11T15:30"), which `new Date` would read in the runtime's own zone (UTC on the server, so the server and
 * the browser disagreed on « prévu 15:30 »).
 */
const instantOf = (value: string) => toInstant(value) ?? new Date(value);
const hhmm = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(instantOf(iso));
const distance = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);

type Step = "flight" | "meeting" | "shuttle";
export function stepOf(d: TravellerReturn): Step {
  if (d.shuttle || d.atMeetingPointAt) return "shuttle";
  if (d.flight.status === "landed") return "meeting";
  return "flight";
}

/** Boutique: espresso while waiting for the landing, sage once landed or the shuttle is coming, rose if cancelled. */
export type RingTone = "dark" | "ok" | "danger";

/** What the ring shows at `now` (pure, for the tests). */
export function ringState(d: TravellerReturn, now: number): { kicker: string; big: string; sub: string; progress: number; tone: RingTone } {
  const f = d.flight;
  const t = fr.live;
  if (d.shuttle) {
    const left = d.shuttle.etaAt ? Math.round((new Date(d.shuttle.etaAt).getTime() - now) / 1000) : null;
    return {
      kicker: t.shuttleIn,
      big: left === null ? "--:--" : mmss(left),
      sub: d.shuttle.distanceM === null ? t.shuttleWaiting : t.shuttleAway(distance(d.shuttle.distanceM)),
      progress: left === null ? 0 : Math.min(1, Math.max(0.05, 1 - left / 1200)),
      tone: "ok",
    };
  }
  if (f.status === "landed") {
    const at = f.landedAt ?? f.estimatedAt ?? f.scheduledAt;
    return { kicker: t.landed, big: at ? hhmm(at) : "", sub: d.atMeetingPointAt ? t.waitingShuttle : t.goMeeting, progress: 1, tone: "ok" };
  }
  if (f.status === "cancelled" || f.status === "diverted") {
    return { kicker: t.cancelled, big: f.number ?? "", sub: t.cancelledHelp, progress: 0, tone: "danger" };
  }
  const at = f.estimatedAt ?? f.scheduledAt ?? d.returnAt;
  const left = Math.round((instantOf(at).getTime() - now) / 1000);
  const late = f.scheduledAt && f.estimatedAt ? Math.round((new Date(f.estimatedAt).getTime() - new Date(f.scheduledAt).getTime()) / 60000) : 0;
  return {
    kicker: t.landsIn,
    big: left < 0 ? t.anyMinute : hms(left),
    sub: late > 0 ? t.plannedLate(hhmm(at), late) : t.planned(hhmm(at)),
    progress: Math.min(1, Math.max(0.03, 1 - left / WINDOW_S)),
    tone: "dark",
  };
}

const TONE: Record<RingTone, string> = { dark: "var(--color-dark)", ok: "var(--color-ok)", danger: "var(--color-danger)" };

function Ring({ progress, tone }: { progress: number; tone: RingTone }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-tint)" strokeWidth="6" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={TONE[tone]} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none" />
    </svg>
  );
}

/** A countdown or an hour ("01:12:09", "04:10", "15:30", "--:--") is set in JetBrains Mono; a word stays in Manrope. */
const isClock = (value: string) => /^[\d:-]+$/.test(value);

/** Small stroked check mark (replaces the « ✓ » glyph). */
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`flex-none ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** "EN DIRECT · il y a 12 s", counting from the last poll. */
export function LivePill({ at, label, now, dark = false }: { at: number; label?: string; now: number; dark?: boolean }) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  return (
    <span
      className={`pill-float min-h-[26px] flex-none gap-1.5 px-2.5 py-1 text-[10.5px] font-extrabold tracking-[.12em] uppercase ${dark ? "bg-white/10 text-white shadow-none" : ""}`}
    >
      <span aria-hidden="true" className="live-dot" />
      {label ?? fr.live.live}
      <span className={`text-[11.5px] font-semibold tracking-normal normal-case tabular-nums ${dark ? "text-lilac/70" : "text-soft"}`}>· {fr.live.ago(seconds)}</span>
    </span>
  );
}

/**
 * The booking page's return day, live (T-A, 05/10/2026): the ring counting to the landing then to the
 * shuttle, the three steps, the shuttle's position age, and "Retrouver ma voiture" once the valet
 * placed the car. Polls the API every 10 s with the manage token; the clock ticks every second.
 */
export function ReturnLive({ reference, token, initial }: { reference: string; token: string; initial: TravellerReturn | null }) {
  const [data, setData] = useState<TravellerReturn | null>(initial);
  const [fetchedAt, setFetchedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [failed, setFailed] = useState(initial === null);
  const [noticeMode, setNoticeMode] = useState<"buttons" | "other" | "done">("buttons");
  const [noticeText, setNoticeText] = useState("");
  const [noticeBusy, setNoticeBusy] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const load = async () => {
      try {
        const res = await fetch(`/api/public/bookings/${encodeURIComponent(reference)}/return`, { headers: { "x-booking-token": token }, cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as TravellerReturn;
        if (!alive.current) return;
        setData(next);
        setFetchedAt(Date.now());
        setFailed(false);
      } catch {
        if (alive.current && !data) setFailed(true);
      }
    };
    if (!initial) void load();
    const poll = setInterval(load, POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(tick);
      clearInterval(poll);
    };
    // The poll is set up once per booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, token]);

  if (!data) return failed ? <p className="rounded-card bg-tint px-4 py-3 text-sm text-soft">{fr.live.offline}</p> : null;
  if (!data.returnDay) return null;
  const t = fr.live;
  const ring = ringState(data, now);
  const step = stepOf(data);
  // D (06/10/2026): without a tracked flight, the traveller says "J'ai atterri" (as in the app).
  const f = data.flight;
  const needsLanded = step === "flight" && f.status !== "landed" && (!f.number || !data.flightTracked || !f.status || f.status === "unknown");
  const declareLanded = async () => {
    try {
      const next = await bookingRequest<TravellerReturn>(reference, "/return/landed", token, {});
      setData(next);
      setFetchedAt(Date.now());
    } catch {
      // The poll will tell; nothing else to say here.
    }
  };
  const meetingRoute = data.meetingPoint ? directionsUrl(`${data.meetingPoint.lat},${data.meetingPoint.lng}`) : null;
  // E (06/10/2026): "Mon vol a du retard", "Bagage perdu", or a word, pushed to the staff at once.
  const sendNotice = async (kind: ReturnNoticeKind, text?: string) => {
    setNoticeBusy(true);
    try {
      const next = await bookingRequest<TravellerReturn>(reference, "/return/notice", token, { kind, ...(text?.trim() ? { text: text.trim() } : {}) });
      setData(next);
      setFetchedAt(Date.now());
      setNoticeMode("done");
      setNoticeText("");
    } catch {
      // The poll will tell; the buttons stay.
    } finally {
      setNoticeBusy(false);
    }
  };
  const notice = data.notice ?? null;
  const steps: [Step, string][] = [
    ["flight", t.stepLanding],
    ["meeting", t.stepMeeting],
    ["shuttle", t.stepShuttle],
  ];
  const meeting = data.meetingPoint?.label?.trim() || t.meetingDefault;
  const shuttle = data.shuttle;
  const vehicle = shuttle ? [shuttle.vehicle.model, shuttle.vehicle.colour].filter(Boolean).join(" ") || null : null;
  const spot = data.spot;
  // S-C (07/10/2026): on a valet parking the car stands in a file; it beats the spot when both are known.
  const file = data.file ?? null;
  const car = data.car;
  const parkingDestination = data.parking.location ? `${data.parking.location.lat},${data.parking.location.lng}` : (data.parking.address ?? data.parking.name);
  // The recorded GPS fix of the car (06/10/2026) beats the parking's entrance for the route.
  const destination = car ? `${car.lat},${car.lng}` : parkingDestination;
  return (
    <>
      {/* Boutique: the live block floats (shadow-float); « Retrouver ma voiture » follows as its own espresso card. */}
      <section aria-labelledby="retour-direct" data-testid="return-live" className="card flex flex-col gap-4 p-4 shadow-float md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <h2 id="retour-direct" className="text-base font-extrabold">
            {t.title(data.flight.number)}
          </h2>
          <LivePill at={fetchedAt} now={now} />
        </div>
        <ol className="flex gap-1.5">
          {steps.map(([key, label]) => (
            // Tighter capitals under 360 px so that « Atterrissage · Rendez-vous · Navette » stay inside the card.
            <li
              key={key}
              aria-current={step === key ? "step" : undefined}
              className={`pill min-h-7 min-w-0 flex-1 justify-center px-1.5 text-center whitespace-normal max-[359px]:px-1 max-[359px]:text-[10px] max-[359px]:tracking-[.04em] ${step === key ? "pill-dark" : ""}`}
            >
              {label}
            </li>
          ))}
        </ol>
        <div className="relative mx-auto size-[152px] md:size-[168px]">
          {/* A cancelled or diverted flight: the whole ring in rose (there is no countdown to draw). */}
          <Ring progress={ring.tone === "danger" ? 1 : ring.progress} tone={ring.tone} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-5 text-center">
            <span className={`font-title text-[14px] leading-tight ${ring.tone === "danger" ? "text-danger" : "text-soft"}`}>{ring.kicker}</span>
            <span
              role="timer"
              className={
                isClock(ring.big)
                  ? `font-hour leading-tight text-ink ${ring.big.length > 5 ? "text-[25px] md:text-[27px]" : "text-[30px] md:text-[32px]"}`
                  : "text-xl leading-tight font-extrabold text-ink"
              }
            >
              {ring.big}
            </span>
            <span className="text-[11px] leading-tight font-semibold text-soft">{ring.sub}</span>
          </div>
        </div>
        <p className="text-center text-[13.5px] leading-snug font-semibold text-soft">{t.meetingPoint(meeting)}</p>
        {needsLanded && (
          <div className="flex flex-col gap-2">
            {/* Espresso like the current step: the page's one orange button is « Je suis au point de rendez-vous ». */}
            <button type="button" data-testid="landed-button" onClick={declareLanded} className="btn-dark min-h-12 px-6 text-base">
              {t.landedButton}
            </button>
            <p className="text-center text-[13px] leading-snug text-soft">{t.landedHelp}</p>
          </div>
        )}
        <div data-testid="return-notice" className="flex flex-col gap-2.5 rounded-field border border-line-soft px-3.5 py-3.5 md:px-4">
          {notice && noticeMode !== "other" ? (
            <>
              <p className="flex items-start gap-2 text-[14px] leading-snug">
                <CheckIcon className="mt-0.5 size-4 text-ok" />
                <span>
                  {t.noticed(notice.kind === "other" && notice.text ? `« ${notice.text} »` : t.noticeKinds[notice.kind] + (notice.text ? ` · « ${notice.text} »` : ""), hhmm(notice.at))}
                </span>
              </p>
              <button type="button" onClick={() => setNoticeMode("other")} className="link inline-flex min-h-11 items-center self-start text-[14px]">
                {t.noticeAgain}
              </button>
            </>
          ) : (
            <>
              <div>
                <b className="text-[14.5px] font-extrabold">{t.noticeTitle}</b>
                <p className="mt-0.5 text-[13px] leading-snug text-soft">{t.noticeHelp}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={noticeBusy} onClick={() => sendNotice("flight_delayed")} className="chip-toggle">
                  {t.noticeFlightDelayed}
                </button>
                <button type="button" disabled={noticeBusy} onClick={() => sendNotice("luggage")} className="chip-toggle">
                  {t.noticeLuggage}
                </button>
                <button
                  type="button"
                  disabled={noticeBusy}
                  onClick={() => setNoticeMode("other")}
                  aria-expanded={noticeMode === "other"}
                  data-active={noticeMode === "other" || undefined}
                  className="chip-toggle"
                >
                  {t.noticeOther}
                </button>
              </div>
              {noticeMode === "other" && (
                <form
                  className="flex gap-2"
                  onSubmit={e => {
                    e.preventDefault();
                    void sendNotice("other", noticeText);
                  }}
                >
                  <input type="text" value={noticeText} onChange={e => setNoticeText(e.target.value)} maxLength={200} required aria-label={t.noticeOther} placeholder={t.noticeOtherPlaceholder} className="field h-11 flex-1" />
                  <button type="submit" disabled={noticeBusy || !noticeText.trim()} className="btn-dark btn-sm min-h-11 flex-none">
                    {noticeBusy ? t.noticeSending : t.noticeSend}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
        {step === "meeting" && data.meetingPoint && (
          <div data-testid="meeting-help" className="flex flex-col gap-3 rounded-field bg-tint p-3.5 md:p-4">
            {data.meetingPoint.instructions && (
              <p className="text-[14px] leading-relaxed">
                <b>{t.instructions} :</b> {data.meetingPoint.instructions}
              </p>
            )}
            {data.meetingPoint.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.meetingPoint.photoUrl} alt={t.photoAlt} className="max-h-56 w-full rounded-field object-cover" loading="lazy" />
            )}
            {meetingRoute && (
              <a href={meetingRoute} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm min-h-11">
                {t.routeToMeeting}
                <span className="sr-only"> {fr.a11y.opensNewTab}</span>
              </a>
            )}
          </div>
        )}
        {shuttle && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-field bg-tint px-3.5 py-3 text-[14px]">
            <span className="flex items-center gap-2 font-bold">
              <ShuttleIcon tone={shuttleTone(shuttle.direction, !!shuttle.position)} size={20} />
              {t.shuttleLine(shuttle.driverFirstName, vehicle) || t.stepShuttle}
            </span>
            <LivePill label={t.position} at={fetchedAt - (shuttle.positionAgeSeconds ?? 0) * 1000} now={now} />
          </div>
        )}
      </section>
      {(file || spot || car) && (
        <section aria-labelledby="ma-voiture" data-testid="find-car" className="on-dark flex flex-col gap-3.5 rounded-card bg-dark p-4 text-white md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ma-voiture" className="eyebrow text-lilac/60">
              {t.carTitle}
            </h2>
            <Plate plate={data.plate} size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-full bg-accent text-lg font-extrabold text-white">
              P
            </span>
            <div className="min-w-0">
              <div data-testid="car-place" className="text-[22px] leading-tight font-extrabold tracking-[-.01em]">
                {file ? t.carFile(file.code) : spot ? t.carSpot(spot.code) : t.carNoSpot}
                {file?.position != null && (
                  <>
                    {" "}
                    <span className="text-[13.5px] font-semibold tracking-normal whitespace-nowrap text-lilac/70">· {t.carFilePosition(file.position)}</span>
                  </>
                )}
              </div>
              {/* The sub line follows the displayed place: the spot's stay zone only when no file is shown. */}
              <div className="text-[13px] font-semibold text-lilac/70">{(!file && spot?.stayClass && t.carZone[spot.stayClass]) || data.parking.name}</div>
            </div>
          </div>
          {car && (
            <p data-testid="car-position" className="text-[13px] leading-snug text-lilac/80">
              {t.carPosition(car.by, new Date(car.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }), car.accuracyM)}
              {car.note ? ` ${car.note}.` : ""}
            </p>
          )}
          <p className="text-[13px] leading-snug text-lilac/80">{t.carKeys}</p>
          <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-on-dark min-h-11 px-5 text-[14.5px]">
            {car ? t.carRouteToCar : t.carRoute}
            <span className="sr-only"> {fr.a11y.opensNewTab}</span>
          </a>
        </section>
      )}
    </>
  );
}
