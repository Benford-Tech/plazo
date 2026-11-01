import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Car, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlanningTabs } from "@/components/planning/PlanningTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { longDate, shortDay, todayLocal } from "@/lib/datetime";
import {
  FORECAST_VIEWS,
  type ForecastView,
  type GaugeLevel,
  gaugeOf,
  monthGrids,
  monthLabel,
  periodLabel,
  periodOf,
  shiftPeriod,
} from "@/lib/forecast";
import { describeError, fr } from "@/lib/fr";
import type { ForecastDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const BAR: Record<GaugeLevel, string> = { low: "bg-lime/40", mid: "bg-lime", high: "bg-warn", full: "bg-bad" };
const TEXT: Record<GaugeLevel, string> = { low: "text-muted-foreground", mid: "text-lime-deep", high: "text-warn-text", full: "text-bad-text" };

function DayCell({
  date,
  day,
  today,
  big,
  week = false,
  onOpen,
}: {
  date: string;
  day?: ForecastDay;
  today: string;
  big: boolean;
  /** The week view has no weekday header: each cell names its day. */
  week?: boolean;
  onOpen: (d: string) => void;
}) {
  const t = fr.forecast;
  const gauge = day ? gaugeOf(day) : null;
  const full = gauge?.level === "full";
  const load = !day || !gauge ? "" : full ? (day.overbooked ? t.overbooked(day.parked - day.bookable) : t.full) : `${gauge.pct} %`;
  return (
    <button
      type="button"
      data-testid={`forecast-day-${date}`}
      onClick={() => onOpen(date)}
      aria-label={day && gauge ? t.dayLabel(longDate(date), day.arrivals, day.returns, day.parked, full ? load : t.loadPct(gauge.pct)) : longDate(date)}
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg border bg-panel p-1.5 text-left transition hover:border-lime-deep",
        big ? "min-h-28 sm:p-2.5" : "min-h-[76px]",
        full ? "border-bad bg-bad-soft" : "border-panel-line",
        date === today && "ring-2 ring-lime ring-offset-1",
        date < today && "opacity-45",
      )}
    >
      <span className={cn("font-mono font-bold", big ? "text-base" : "text-xs", date === today && "text-lime-deep")}>
        {week ? shortDay(date) : Number(date.slice(8))}
      </span>
      {day && gauge && (
        <>
          <span className={cn("flex flex-wrap gap-x-1.5 font-mono font-semibold leading-tight", big ? "text-sm" : "text-[11px]")}>
            <span className="text-ok-text">↑{day.arrivals}</span>
            <span className="text-info-text">↓{day.returns}</span>
            <span data-testid={`forecast-parked-${date}`} title={t.parkedTitle(day.parked)} className="inline-flex items-center gap-0.5 text-lime-deep">
              <Car className={big ? "h-3.5 w-3.5" : "h-3 w-3"} aria-hidden="true" />
              {day.parked}
            </span>
          </span>
          <span className="mt-auto h-1.5 w-full overflow-hidden rounded-full bg-panel-2" aria-hidden="true">
            <span className={cn("block h-full rounded-full", BAR[gauge.level])} style={{ width: `${Math.min(100, gauge.pct)}%` }} />
          </span>
          <span className={cn("truncate font-mono font-semibold", big ? "text-xs" : "text-[10px]", TEXT[gauge.level])}>{load}</span>
        </>
      )}
    </button>
  );
}

function MonthGrid({ month, weeks, byDate, today, big, onOpen }: {
  month: string;
  weeks: (string | null)[][];
  byDate: Map<string, ForecastDay>;
  today: string;
  big: boolean;
  onOpen: (d: string) => void;
}) {
  const t = fr.forecast;
  return (
    <section aria-label={monthLabel(month)} className="min-w-0 rounded-[14px] border border-panel-line bg-panel p-3">
      <h2 className="mb-2 text-base font-semibold first-letter:uppercase">{monthLabel(month)}</h2>
      <div className="grid grid-cols-7 gap-1">
        {t.weekdays.map(w => (
          <span key={w} className="pb-1 text-center text-[11px] font-semibold uppercase text-muted-foreground">
            {w}
          </span>
        ))}
        {weeks.flat().map((date, i) =>
          date ? <DayCell key={date} date={date} day={byDate.get(date)} today={today} big={big} onOpen={onOpen} /> : <span key={`blank-${i}`} />,
        )}
      </div>
    </section>
  );
}

function Legend() {
  const t = fr.forecast.legend;
  const item = (swatch: React.ReactNode, label: string) => (
    <span className="flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {item(<ArrowUp className="h-4 w-4 text-ok-text" aria-hidden="true" />, t.arrivals)}
      {item(<ArrowDown className="h-4 w-4 text-info-text" aria-hidden="true" />, t.departures)}
      {item(<Car className="h-4 w-4 text-lime-deep" aria-hidden="true" />, t.parked)}
      {item(<span className="h-2 w-5 rounded-full bg-warn" aria-hidden="true" />, t.high)}
      {item(<span className="h-2 w-5 rounded-full bg-bad" aria-hidden="true" />, t.full)}
    </p>
  );
}

export default function ForecastPage() {
  const t = fr.forecast;
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view = (FORECAST_VIEWS as string[]).includes(params.get("vue") ?? "") ? (params.get("vue") as ForecastView) : "mois";
  const anchor = /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") ?? "") ? (params.get("date") as string) : todayLocal();
  const { from, days } = periodOf(view, anchor);
  const { data, isLoading, error } = useQuery({
    queryKey: ["planning-forecast", from, days],
    queryFn: () => adminApi.getPlanningForecast(from, days),
    refetchInterval: 120_000,
  });
  const today = data?.today ?? todayLocal();
  const go = (next: { vue?: ForecastView; date?: string }) => {
    const v = next.vue ?? view;
    const d = next.date ?? anchor;
    setParams({ ...(v !== "mois" ? { vue: v } : {}), ...(d !== todayLocal() ? { date: d } : {}) });
  };
  const open = (date: string) => navigate(date === todayLocal() ? "/planning" : `/planning?date=${date}`);

  const byDate = new Map((data?.days ?? []).map(d => [d.date, d]));
  const shown = data?.days ?? [];
  const arrivals = shown.reduce((n, d) => n + d.arrivals, 0);
  const departures = shown.reduce((n, d) => n + d.returns, 0);
  const busiest = shown.reduce<ForecastDay | null>((best, d) => (!best || d.parked > best.parked ? d : best), null);
  const fullNights = shown.filter(d => gaugeOf(d).level === "full").length;
  const isCurrent = periodOf(view, todayLocal()).from === from;

  return (
    <>
      <PlanningTabs />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            aria-label={t.previous}
            onClick={() => go({ date: shiftPeriod(view, anchor, -1) })}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-panel-line bg-panel hover:bg-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold first-letter:uppercase sm:text-3xl">{periodLabel(view, from, days)}</h1>
          <button
            aria-label={t.next}
            onClick={() => go({ date: shiftPeriod(view, anchor, 1) })}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-panel-line bg-panel hover:bg-accent"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {!isCurrent && (
            <button onClick={() => go({ date: todayLocal() })} className="h-11 rounded-full border border-panel-line bg-panel px-4 font-semibold hover:bg-accent">
              {t.today}
            </button>
          )}
        </div>
        <div role="group" aria-label={t.viewsLabel} className="flex gap-1 rounded-full border border-panel-line bg-panel p-1">
          {FORECAST_VIEWS.map(v => (
            <button
              key={v}
              type="button"
              aria-pressed={v === view}
              onClick={() => go({ vue: v })}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-semibold",
                v === view ? "bg-lime text-lime-ink" : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t.views[v]}
            </button>
          ))}
        </div>
      </div>

      <Legend />
      {error && <p className="text-destructive">{describeError(error)}</p>}
      {isLoading && <Skeleton className="h-96 w-full" />}

      {data && (
        <>
          <p data-testid="forecast-summary" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="font-semibold">{t.summary(arrivals, departures)}</span>
            {busiest && busiest.parked > 0 && <span className="text-muted-foreground">{t.busiest(busiest.parked, gaugeOf(busiest).pct, shortDay(busiest.date))}</span>}
            {fullNights > 0 && <span className="font-semibold text-bad-text">{t.fullNights(fullNights)}</span>}
          </p>
          {view === "semaine" ? (
            <section aria-label={periodLabel(view, from, days)} className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {data.days.map(d => (
                <DayCell key={d.date} date={d.date} day={d} today={today} big week onOpen={open} />
              ))}
            </section>
          ) : (
            <div className={cn("grid gap-4", view === "3mois" && "xl:grid-cols-3")}>
              {monthGrids(from, days).map(g => (
                <MonthGrid key={g.month} month={g.month} weeks={g.weeks} byDate={byDate} today={today} big={view === "mois"} onOpen={open} />
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t.note}</p>
        </>
      )}
    </>
  );
}
