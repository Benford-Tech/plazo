import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { PlatformApps } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.apps;
const PERIODS = [7, 30, 90] as const;
const number = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const card = "flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5";
const dayLabel = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/** Change from the period before, in whole percent; null when there was nothing before. */
export function trend(now: number, before: number): number | null {
  if (before === 0) return null;
  return Math.round(((now - before) / before) * 100);
}

/**
 * Plateforme › Applications (15/11/2026, « Suivre le nombre de téléchargements et d'utilisation de plazo », choix « Mesuré
 * par Plazo »): the Plazo app's installs (first launches) and active phones, its bookings, the Plazo Pro members using it,
 * and a day-by-day chart. Counted by Plazo itself from the day it was released; the stores keep the official downloads.
 */
export default function AppsPage() {
  const [days, setDays] = useState<number>(30);
  const report = useQuery({ queryKey: ["platform", "apps", days], queryFn: () => adminApi.getPlatformApps(days) });
  const r = report.data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <div role="radiogroup" aria-label={t.periodLabel} className="flex gap-1 rounded-full border border-border bg-card p-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={days === p}
              data-testid={`apps-period-${p}`}
              onClick={() => setDays(p)}
              className={cn("min-h-9 rounded-full px-3 text-sm font-semibold", days === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
            >
              {t.periods[p]}
            </button>
          ))}
        </div>
      </div>

      {report.error ? (
        <p className="text-destructive">{describeError(report.error) || t.loadError}</p>
      ) : !r ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {!r.measuredSince && <p className="rounded-[14px] border border-border bg-card p-4 text-sm text-muted-foreground">{t.none}</p>}
          <Plazo r={r} />
          <Pro r={r} />
          <Chart r={r} />
          <p className="text-xs text-muted-foreground">
            {r.measuredSince && `${t.since(new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${r.measuredSince}T12:00:00Z`)))} `}
            {t.storesNote}
          </p>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, testId }: { label: string; value: string; sub?: string; testId?: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Plazo({ r }: { r: PlatformApps }) {
  const p = r.plazo;
  const total = p.platforms.reduce((sum, x) => sum + x.count, 0);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="apps-plazo">
      <h2 id="apps-plazo" className="font-semibold">
        {t.plazo}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile testId="apps-installs" label={t.installs} value={number(p.installs)} sub={t.vsBefore(trend(p.installs, p.installsBefore))} />
        <Tile label={t.activeToday} value={number(p.activeToday)} />
        <Tile label={t.active7} value={number(p.active7)} />
        <Tile label={t.active30} value={number(p.active30)} sub={t.phones(p.phones)} />
        <Tile testId="apps-bookings" label={t.bookings} value={number(p.bookings)} sub={t.bookingsSub(euros(p.bookingsCents))} />
      </div>
      {total > 0 && (
        <div className={card}>
          <p className="text-xs text-muted-foreground">{t.platforms}</p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
            {p.platforms.map((x, i) => (
              <span key={x.platform} className={cn(i === 0 ? "bg-lime-deep" : i === 1 ? "bg-primary" : "bg-muted-foreground/40")} style={{ width: `${(x.count / total) * 100}%` }} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" data-testid="apps-platforms">
            {p.platforms.map((x) => (
              <li key={x.platform}>
                {t.platformNames[x.platform] ?? x.platform} <span className="font-mono tabular-nums">{Math.round((x.count / total) * 100)} %</span>
                <span className="text-muted-foreground"> · {number(x.count)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Pro({ r }: { r: PlatformApps }) {
  const p = r.pro;
  return (
    <section className="flex flex-col gap-3" aria-labelledby="apps-pro">
      <h2 id="apps-pro" className="font-semibold">
        {t.pro}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label={t.activeToday} value={number(p.activeToday)} />
        <Tile testId="apps-pro-week" label={t.active7} value={number(p.active7)} sub={t.members(p.active7, p.members)} />
        <Tile label={t.active30} value={number(p.active30)} sub={t.operators(p.activeOperators7, p.operators)} />
      </div>
      <p className="text-xs text-muted-foreground">{t.proHelp}</p>
    </section>
  );
}

/** Three bars per day: installs, Plazo actives, Plazo Pro actives, on one scale. */
function Chart({ r }: { r: PlatformApps }) {
  const max = Math.max(1, ...r.series.flatMap((d) => [d.installs, d.plazoActive, d.proActive]));
  const legend = [
    { label: t.legendInstalls, className: "bg-primary" },
    { label: t.legendPlazo, className: "bg-lime-deep" },
    { label: t.legendPro, className: "bg-muted-foreground/50" },
  ];
  return (
    <section className={card} aria-labelledby="apps-chart">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="apps-chart" className="font-semibold">
          {t.chart}
        </h2>
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span className={cn("size-2.5 rounded-sm", l.className)} aria-hidden />
              {l.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex h-40 items-end gap-px overflow-x-auto" data-testid="apps-chart">
        {r.series.map((d) => (
          <div
            key={d.date}
            className="flex h-full min-w-[6px] flex-1 items-end gap-px"
            title={`${dayLabel(d.date)} · ${t.legendInstalls} ${d.installs} · ${t.legendPlazo} ${d.plazoActive} · ${t.legendPro} ${d.proActive}`}
          >
            <span className="flex-1 rounded-t-sm bg-primary" style={{ height: `${(d.installs / max) * 100}%` }} />
            <span className="flex-1 rounded-t-sm bg-lime-deep" style={{ height: `${(d.plazoActive / max) * 100}%` }} />
            <span className="flex-1 rounded-t-sm bg-muted-foreground/50" style={{ height: `${(d.proActive / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{dayLabel(r.from)}</span>
        <span>{dayLabel(r.to)}</span>
      </div>
    </section>
  );
}
