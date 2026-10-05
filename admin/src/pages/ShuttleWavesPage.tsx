import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, BusFront, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, type BadgeTone } from "@/components/dashboard/Badge";
import { Plate } from "@/components/Plate";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { addDays, shortDay, timeAgo, timeOf, todayLocal } from "@/lib/datetime";
import { describeError, shuttleWavesFr as t } from "@/lib/fr";
import type { ShuttleWave, WaveMember } from "@/lib/types";
import { cn } from "@/lib/utils";

const POLL_MS = 30_000;

/** The tone and label of a member's flight (take-off for a drop-off, landing for a pick-up). */
function flightBadge(m: WaveMember): { tone: BadgeTone; text: string } {
  const f = t.wave.flight;
  if (!m.flight) return { tone: "line", text: f.none };
  const { status, scheduledAt, estimatedAt } = m.flight;
  if (status === "cancelled") return { tone: "bad", text: f.cancelled };
  if (status === "diverted") return { tone: "bad", text: f.diverted };
  if (status === "landed") return { tone: "ok", text: m.direction === "pickup" ? f.landed : f.departed };
  if (status === "departed") return { tone: "ok", text: m.direction === "pickup" ? f.scheduled : f.departed };
  if (status === "unknown") return { tone: "warn", text: f.unknown };
  const late = scheduledAt && estimatedAt ? Math.round((new Date(estimatedAt).getTime() - new Date(scheduledAt).getTime()) / 60000) : 0;
  if (status === "delayed" || late >= 15) return { tone: "warn", text: f.delayed(Math.max(late, 1)) };
  if (!status) return { tone: "line", text: m.flight.number };
  return { tone: "ok", text: f.scheduled };
}

/** "Décollage 07:45" / "Atterrissage 09:50" / "Heure saisie 11:30". */
function flightTime(m: WaveMember): string {
  const w = t.wave;
  if (m.flight) {
    const at = m.flight.actualAt ?? m.flight.estimatedAt ?? m.flight.scheduledAt;
    if (at) return m.direction === "dropoff" ? w.takeOff(timeOf(at)) : w.landing(timeOf(at));
  }
  return w.bookingTime(timeOf(m.direction === "pickup" && m.meetAt ? m.meetAt : m.leaveAt));
}

const STATE_TONE: Record<ShuttleWave["state"], BadgeTone> = { planned: "accent", running: "info", done: "line" };

function WaveCard({ wave }: { wave: ShuttleWave }) {
  const w = t.wave;
  const over = (wave.vehiclesNeeded ?? 1) > 1;
  const IconC = wave.direction === "dropoff" ? ArrowUpFromLine : ArrowDownToLine;
  return (
    <li
      data-testid="wave"
      data-state={wave.state}
      className={cn("rounded-xl border bg-panel p-3.5", wave.state === "done" ? "border-panel-line opacity-60" : over ? "border-bad" : "border-panel-line")}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="tabular font-mono text-2xl font-semibold leading-none text-lime-deep">{timeOf(wave.leaveAt)}</span>
        <span className="flex items-center gap-1.5 text-[15px] font-semibold">
          <IconC className="h-4 w-4 text-lime-deep" aria-hidden="true" />
          {w.direction[wave.direction]} · {wave.stopName ?? w.airport}
        </span>
        {wave.direction === "pickup" && wave.meetAt && <span className="font-mono text-xs text-muted-foreground">{w.meetAt(timeOf(wave.meetAt))}</span>}
        <span className="ml-auto flex items-center gap-2">
          <span className={cn("tabular font-mono text-lg font-semibold", over && "text-bad-text")}>{w.passengers(wave.passengers, wave.seats)}</span>
          {over && <Badge tone="bad">{w.vehicles(wave.vehiclesNeeded!)}</Badge>}
          {wave.noFlight > 0 && <Badge tone="warn">{w.noFlight(wave.noFlight)}</Badge>}
          <Badge tone={STATE_TONE[wave.state]}>{w.state[wave.state]}</Badge>
        </span>
      </div>
      <ul className="mt-2.5 divide-y divide-panel-line">
        {wave.members.map(m => {
          const badge = flightBadge(m);
          return (
            <li key={m.reservationId}>
              <Link to={`/reservations/${m.reservationId}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 hover:bg-panel-2">
                <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                  {m.customerName} <span className="text-muted-foreground">· {w.pax(m.passengers)}</span>
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {m.flight ? `${m.flight.number} · ` : ""}
                  {flightTime(m)}
                </span>
                <Badge tone={badge.tone}>{badge.text}</Badge>
                <Plate value={m.plate} size="sm" className="hidden sm:inline-flex" />
              </Link>
            </li>
          );
        })}
      </ul>
    </li>
  );
}

/** V-A "Ligne du jour" (05/10/2026): the day's shuttle waves, both directions on one timeline. */
export default function ShuttleWavesPage() {
  const today = todayLocal();
  const [date, setDate] = useState(today);
  const [now, setNow] = useState(() => Date.now());
  const forecast = useQuery({ queryKey: ["shuttle-forecast", date], queryFn: () => adminApi.getShuttleForecast(date), refetchInterval: POLL_MS });
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(id);
  }, []);
  const days = [today, addDays(today, 1), addDays(today, 2)];
  const labels = [t.today, t.tomorrow, shortDay(days[2])];
  const d = forecast.data;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
        <h1 className="flex items-center gap-2 font-sans text-2xl font-bold uppercase tracking-wide">
          <BusFront className="h-6 w-6 text-lime-deep" aria-hidden="true" />
          {t.title}
        </h1>
        <span className="text-[13px] text-muted-foreground">{t.subtitle}</span>
        {d && <span className="ml-auto rounded-full border border-panel-line bg-panel px-3 py-1.5 font-mono text-xs text-muted-foreground">{t.refreshed(timeAgo(d.serverTime, now))}</span>}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-1" role="tablist">
        {days.map((day, i) => (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={date === day}
            onClick={() => setDate(day)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold",
              date === day ? "border-primary bg-primary text-primary-foreground" : "border-panel-line bg-panel text-muted-foreground hover:bg-panel-2",
            )}
          >
            {labels[i]}
            {date === day && d ? ` · ${t.wave.count(d.waves.length)}` : ""}
          </button>
        ))}
        {d && (
          <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
            <span>{t.seats(d.seats, d.vehiclesInService)}</span>
            <Link to="/parking/reglages" className="flex items-center gap-1 text-lime-deep hover:underline">
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              {t.settings}
            </Link>
          </span>
        )}
      </div>
      {d && <p className="px-1 font-mono text-xs text-muted-foreground">{t.times(d.times.terminalLeadMinutes, d.times.landingDelayMinutes, d.times.shuttleTravelMinutes)}</p>}

      {forecast.isError ? (
        <p className="rounded-xl border border-bad bg-bad-soft p-3 text-sm text-bad-text">{describeError(forecast.error) || t.loadError}</p>
      ) : !d ? (
        <div className="space-y-2">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : d.waves.length === 0 ? (
        <p className="rounded-xl border border-panel-line bg-panel p-4 text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <ol className="space-y-2">
          {d.waves.map(wave => (
            <WaveCard key={wave.id} wave={wave} />
          ))}
        </ol>
      )}
    </div>
  );
}
