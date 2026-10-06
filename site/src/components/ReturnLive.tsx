"use client";

import { useEffect, useRef, useState } from "react";
import { Plate } from "./Plate";
import { bookingRequest } from "@/lib/booking-client";
import { fr } from "@/lib/fr";
import { directionsUrl } from "@/lib/listing";
import type { ReturnNoticeKind, TravellerReturn } from "@/lib/types";

const POLL_MS = 10_000;
/** The ring spans this long before the landing (full at 3 h, empty at touchdown). */
const WINDOW_S = 3 * 3600;

const two = (n: number) => String(n).padStart(2, "0");
export const hms = (s: number) => `${two(Math.floor(s / 3600))}:${two(Math.floor((s % 3600) / 60))}:${two(s % 60)}`;
export const mmss = (s: number) => `${two(Math.floor(Math.max(0, s) / 60))}:${two(Math.max(0, s) % 60)}`;
const hhmm = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));
const distance = (m: number) => (m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1).replace(".", ",")} km`);

type Step = "flight" | "meeting" | "shuttle";
export function stepOf(d: TravellerReturn): Step {
  if (d.shuttle || d.atMeetingPointAt) return "shuttle";
  if (d.flight.status === "landed") return "meeting";
  return "flight";
}

/** What the ring shows at `now` (pure, for the tests). */
export function ringState(d: TravellerReturn, now: number): { kicker: string; big: string; sub: string; progress: number; tone: "accent" | "peach" | "danger" } {
  const f = d.flight;
  const t = fr.live;
  if (d.shuttle) {
    const left = d.shuttle.etaAt ? Math.round((new Date(d.shuttle.etaAt).getTime() - now) / 1000) : null;
    return {
      kicker: t.shuttleIn,
      big: left === null ? "--:--" : mmss(left),
      sub: d.shuttle.distanceM === null ? t.shuttleWaiting : t.shuttleAway(distance(d.shuttle.distanceM)),
      progress: left === null ? 0 : Math.min(1, Math.max(0.05, 1 - left / 1200)),
      tone: "peach",
    };
  }
  if (f.status === "landed") {
    const at = f.landedAt ?? f.estimatedAt ?? f.scheduledAt;
    return { kicker: t.landed, big: at ? hhmm(at) : "", sub: d.atMeetingPointAt ? t.waitingShuttle : t.goMeeting, progress: 1, tone: "accent" };
  }
  if (f.status === "cancelled" || f.status === "diverted") {
    return { kicker: t.cancelled, big: f.number ?? "", sub: t.cancelledHelp, progress: 0, tone: "danger" };
  }
  const at = f.estimatedAt ?? f.scheduledAt ?? d.returnAt;
  const left = Math.round((new Date(at).getTime() - now) / 1000);
  const late = f.scheduledAt && f.estimatedAt ? Math.round((new Date(f.estimatedAt).getTime() - new Date(f.scheduledAt).getTime()) / 60000) : 0;
  return {
    kicker: t.landsIn,
    big: left < 0 ? t.anyMinute : hms(left),
    sub: late > 0 ? t.plannedLate(hhmm(at), late) : t.planned(hhmm(at)),
    progress: Math.min(1, Math.max(0.03, 1 - left / WINDOW_S)),
    tone: "accent",
  };
}

const TONE = { accent: "#ff6600", peach: "#f0a36b", danger: "#8f0f35" };

function Ring({ progress, tone }: { progress: number; tone: keyof typeof TONE }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="h-full w-full -rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#f5f5f7" strokeWidth="9" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={TONE[tone]} strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} className="transition-[stroke-dashoffset] duration-700" />
    </svg>
  );
}

/** "EN DIRECT · il y a 12 s", counting from the last poll. */
export function LivePill({ at, label, now, dark = false }: { at: number; label?: string; now: number; dark?: boolean }) {
  const seconds = Math.max(0, Math.round((now - at) / 1000));
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[.06em] uppercase ${dark ? "bg-white/15 text-white" : "bg-white text-ink shadow-[0_4px_12px_-4px_rgba(0,0,0,.2)]"}`}>
      <span aria-hidden="true" className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex size-2 rounded-full bg-accent" />
      </span>
      {label ?? fr.live.live}
      <span className={`font-semibold normal-case tracking-normal tabular-nums ${dark ? "text-white/70" : "text-soft"}`}>{fr.live.ago(seconds)}</span>
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

  if (!data) return failed ? <p className="text-sm text-soft">{fr.live.offline}</p> : null;
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
  const car = data.car;
  const parkingDestination = data.parking.location ? `${data.parking.location.lat},${data.parking.location.lng}` : (data.parking.address ?? data.parking.name);
  // The recorded GPS fix of the car (06/10/2026) beats the parking's entrance for the route.
  const destination = car ? `${car.lat},${car.lng}` : parkingDestination;
  return (
    <section aria-labelledby="retour-direct" data-testid="return-live" className="card flex flex-col gap-3.5 p-4 md:p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h2 id="retour-direct" className="text-base font-extrabold">
          {t.title(data.flight.number)}
        </h2>
        <LivePill at={fetchedAt} now={now} />
      </div>
      <ol className="flex gap-1.5 text-[12.5px] font-bold">
        {steps.map(([key, label]) => (
          <li key={key} aria-current={step === key ? "step" : undefined} className={`flex-1 rounded-full py-2 text-center ${step === key ? "bg-accent text-white" : "bg-tint text-soft"}`}>
            {label}
          </li>
        ))}
      </ol>
      <div className="relative mx-auto size-[180px]">
        <Ring progress={ring.progress} tone={ring.tone} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
          <span className="font-title text-sm text-dark">{ring.kicker}</span>
          <span role="timer" className={`font-extrabold tabular-nums tracking-tight ${ring.big.length > 8 ? "text-xl" : "text-[28px]"}`}>
            {ring.big}
          </span>
          <span className="text-[11px] leading-tight text-soft">{ring.sub}</span>
        </div>
      </div>
      <p className="text-center text-sm text-soft">{t.meetingPoint(meeting)}</p>
      {needsLanded && (
        <div className="flex flex-col gap-2">
          <button type="button" data-testid="landed-button" onClick={declareLanded} className="btn-primary h-[52px] text-base">
            {t.landedButton}
          </button>
          <p className="text-center text-[13px] text-soft">{t.landedHelp}</p>
        </div>
      )}
      <div data-testid="return-notice" className="flex flex-col gap-2 rounded-[18px] border border-line bg-white px-4 py-3.5">
        {notice && noticeMode !== "other" ? (
          <>
            <p className="text-sm">
              <span aria-hidden="true" className="text-peach">
                ✓{" "}
              </span>
              {t.noticed(notice.kind === "other" && notice.text ? `« ${notice.text} »` : t.noticeKinds[notice.kind] + (notice.text ? ` · « ${notice.text} »` : ""), hhmm(notice.at))}
            </p>
            <button type="button" onClick={() => setNoticeMode("other")} className="self-start text-sm font-semibold text-accent underline-offset-2 hover:underline">
              {t.noticeAgain}
            </button>
          </>
        ) : (
          <>
            <b className="text-[15px]">{t.noticeTitle}</b>
            <p className="text-[13px] text-soft">{t.noticeHelp}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={noticeBusy} onClick={() => sendNotice("flight_delayed")} className="h-10 rounded-full border border-accent bg-white px-4 text-sm font-semibold text-dark hover:bg-tint">
                {t.noticeFlightDelayed}
              </button>
              <button type="button" disabled={noticeBusy} onClick={() => sendNotice("luggage")} className="h-10 rounded-full border border-accent bg-white px-4 text-sm font-semibold text-dark hover:bg-tint">
                {t.noticeLuggage}
              </button>
              <button type="button" disabled={noticeBusy} onClick={() => setNoticeMode("other")} aria-expanded={noticeMode === "other"} className="h-10 rounded-full border border-line bg-white px-4 text-sm font-semibold text-dark hover:bg-tint">
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
                <input type="text" value={noticeText} onChange={e => setNoticeText(e.target.value)} maxLength={200} required aria-label={t.noticeOther} placeholder={t.noticeOtherPlaceholder} className="field h-10 flex-1" />
                <button type="submit" disabled={noticeBusy || !noticeText.trim()} className="btn-primary h-10 px-4 text-sm">
                  {noticeBusy ? t.noticeSending : t.noticeSend}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      {step === "meeting" && data.meetingPoint && (
        <div data-testid="meeting-help" className="flex flex-col gap-2.5 rounded-[18px] bg-tint px-4 py-3.5">
          {data.meetingPoint.instructions && (
            <p className="text-sm">
              <b>{t.instructions} :</b> {data.meetingPoint.instructions}
            </p>
          )}
          {data.meetingPoint.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.meetingPoint.photoUrl} alt={t.photoAlt} className="max-h-56 w-full rounded-[14px] object-cover" loading="lazy" />
          )}
          {meetingRoute && (
            <a href={meetingRoute} target="_blank" rel="noopener noreferrer" className="btn-secondary h-11 text-[15px]">
              {t.routeToMeeting}
              <span className="sr-only"> {fr.a11y.opensNewTab}</span>
            </a>
          )}
        </div>
      )}
      {shuttle && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] bg-tint px-3.5 py-3 text-sm">
          <span className="font-semibold">{t.shuttleLine(shuttle.driverFirstName, vehicle) || t.stepShuttle}</span>
          <LivePill label={t.position} at={fetchedAt - (shuttle.positionAgeSeconds ?? 0) * 1000} now={now} />
        </div>
      )}
      {(spot || car) && (
        <div data-testid="find-car" className="flex flex-col gap-3 rounded-[18px] bg-dark p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-bold tracking-[.04em] text-white/70 uppercase">{t.carTitle}</span>
            <Plate plate={data.plate} size="sm" />
          </div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-accent text-xl font-extrabold">
              P
            </span>
            <div>
              <div className="text-[26px] leading-none font-extrabold">{spot ? t.carSpot(spot.code) : t.carNoSpot}</div>
              <div className="text-[13px] text-white/75">{(spot?.stayClass && t.carZone[spot.stayClass]) || data.parking.name}</div>
            </div>
          </div>
          {car && (
            <p data-testid="car-position" className="text-[13px] text-white/75">
              {t.carPosition(car.by, new Date(car.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }), car.accuracyM)}
              {car.note ? ` ${car.note}.` : ""}
            </p>
          )}
          <p className="text-[13px] text-white/75">{t.carKeys}</p>
          <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-primary h-11 text-[15px]">
            {car ? t.carRouteToCar : t.carRoute}
            <span className="sr-only"> {fr.a11y.opensNewTab}</span>
          </a>
        </div>
      )}
    </section>
  );
}
