import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { longDate } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { PlatformSeo } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.seo;
const PERIODS = [7, 30, 90] as const;
const number = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const position = (n: number | null) => (n === null ? "—" : n.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
const card = "flex flex-col gap-3 rounded-[14px] border border-border bg-card p-5";
const th = "px-2 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground";
const td = "border-t border-border px-2 py-2";
const num = "text-right font-mono tabular-nums";

/**
 * Plateforme › Référencement (06/11/2026, SEO local A + M2 of https://claude.ai/artifact/VjbSdoTMnjn4nGx1uNDipb): the bookings
 * made on the site by origin, the landing pages with their visits and bookings, and Google's positions from Search Console.
 */
export default function SeoPage() {
  const [days, setDays] = useState<number>(30);
  const report = useQuery({ queryKey: ["platform", "seo", days], queryFn: () => adminApi.getPlatformSeo(days) });
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
              data-testid={`seo-period-${p}`}
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
          <Kpis r={r} />
          <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
            <Sources r={r} />
            <Pages r={r} />
          </div>
          <SearchConsole r={r} />
        </>
      )}
    </div>
  );
}

function Kpis({ r }: { r: PlatformSeo }) {
  const share = r.bookings.total ? Math.round((r.bookings.search.count / r.bookings.total) * 100) : 0;
  const tiles = [
    { label: t.kpis.searchBookings, value: number(r.bookings.search.count), sub: t.ofBookings(r.bookings.total) },
    { label: t.kpis.searchRevenue, value: euros(r.bookings.search.revenueCents), sub: euros(r.bookings.revenueCents) },
    { label: t.kpis.share, value: `${share} %`, sub: t.ofBookings(r.bookings.total) },
    { label: t.kpis.searchVisits, value: number(r.visits.search), sub: t.ofVisits(r.visits.total) },
  ];
  return (
    <div data-testid="seo-kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {tiles.map((k) => (
        <div key={k.label} className="rounded-[14px] border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">{k.label}</p>
          <p className="font-mono text-2xl font-bold tabular-nums">{k.value}</p>
          <p className="text-xs text-muted-foreground">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

function Sources({ r }: { r: PlatformSeo }) {
  return (
    <section className={card} aria-labelledby="seo-sources">
      <h2 id="seo-sources" className="font-semibold">
        {t.sources}
      </h2>
      {r.bookings.bySource.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <ul className="flex flex-col text-sm" data-testid="seo-sources">
          {r.bookings.bySource.map((s) => (
            <li key={`${s.source}-${s.detail}`} className="flex items-baseline justify-between gap-3 border-t border-border py-2 first:border-t-0">
              <span className="min-w-0">
                {t.sourceNames[s.source] ?? s.source}
                {s.detail && <span className="text-muted-foreground"> · {s.detail}</span>}
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {s.count} · {euros(s.revenueCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Pages({ r }: { r: PlatformSeo }) {
  return (
    <section className={card} aria-labelledby="seo-pages">
      <h2 id="seo-pages" className="font-semibold">
        {t.pages}
      </h2>
      {r.pages.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.noPages}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm" data-testid="seo-pages">
            <thead>
              <tr>
                <th className={th}>{t.pageCols.page}</th>
                <th className={cn(th, "text-right")}>{t.pageCols.visits}</th>
                <th className={cn(th, "text-right")}>{t.pageCols.search}</th>
                <th className={cn(th, "text-right")}>{t.pageCols.bookings}</th>
                <th className={cn(th, "text-right")}>{t.pageCols.revenue}</th>
              </tr>
            </thead>
            <tbody>
              {r.pages.map((p) => (
                <tr key={p.landing}>
                  <td className={cn(td, "max-w-[280px] truncate font-mono text-xs")} title={p.landing}>
                    {p.landing}
                  </td>
                  <td className={cn(td, num)}>{number(p.visits)}</td>
                  <td className={cn(td, num)}>{number(p.searchVisits)}</td>
                  <td className={cn(td, num)}>{p.bookings}</td>
                  <td className={cn(td, num)}>{euros(p.revenueCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Trend({ now, before }: { now: number | null; before: number | null }) {
  if (now === null || before === null) return null;
  const delta = Math.round((before - now) * 10) / 10;
  if (Math.abs(delta) < 0.5) return null;
  const label = position(Math.abs(delta));
  return delta > 0 ? (
    <span className="ml-1 text-ok-text" title={t.better(label)}>
      ↑{label}
    </span>
  ) : (
    <span className="ml-1 text-bad-text" title={t.worse(label)}>
      ↓{label}
    </span>
  );
}

function SearchConsole({ r }: { r: PlatformSeo }) {
  const g = r.searchConsole;
  const [tab, setTab] = useState<"queries" | "pages">("queries");
  return (
    <section className={card} aria-labelledby="seo-gsc" data-testid="seo-gsc">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="seo-gsc" className="font-semibold">
          {t.gsc}
        </h2>
        {g.lastDate && <span className="text-xs text-muted-foreground">{t.gscSynced(longDate(g.lastDate))}</span>}
      </div>
      {g.lastError && <p className="text-sm text-bad-text">{t.gscError(t.gscErrors[g.lastError] ?? g.lastError)}</p>}
      {!g.configured ? (
        <div className="flex flex-col gap-2 text-sm" data-testid="seo-gsc-off">
          <p className="font-medium">{t.gscOff}</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            {t.gscSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="font-mono text-xs text-muted-foreground">{g.property}</p>
        </div>
      ) : !g.totals ? (
        <p className="text-sm text-muted-foreground">{t.gscNoData}</p>
      ) : (
        <>
          <p className="text-sm">{t.gscTotals(number(g.totals.clicks), number(g.totals.impressions), position(g.totals.position))}</p>
          <div className="flex gap-1">
            {(["queries", "pages"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={tab === k}
                onClick={() => setTab(k)}
                className={cn("min-h-9 rounded-full px-3 text-sm font-semibold", tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
              >
                {k === "queries" ? t.gscQueries : t.gscPages}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr>
                  <th className={th}>{tab === "queries" ? t.gscCols.query : t.gscCols.page}</th>
                  {tab === "queries" && <th className={th}>{t.gscCols.page}</th>}
                  <th className={cn(th, "text-right")}>{t.gscCols.position}</th>
                  <th className={cn(th, "text-right")}>{t.gscCols.clicks}</th>
                  <th className={cn(th, "text-right")}>{t.gscCols.impressions}</th>
                </tr>
              </thead>
              <tbody>
                {tab === "queries"
                  ? g.queries.map((q) => (
                      <tr key={q.query}>
                        <td className={td}>{q.query}</td>
                        <td className={cn(td, "max-w-[220px] truncate font-mono text-xs")} title={q.page}>
                          {q.page}
                        </td>
                        <td className={cn(td, num)}>
                          {position(q.position)}
                          <Trend now={q.position} before={q.previous} />
                        </td>
                        <td className={cn(td, num)}>{number(q.clicks)}</td>
                        <td className={cn(td, num)}>{number(q.impressions)}</td>
                      </tr>
                    ))
                  : g.pages.map((p) => (
                      <tr key={p.page}>
                        <td className={cn(td, "font-mono text-xs")}>{p.page}</td>
                        <td className={cn(td, num)}>
                          {position(p.position)}
                          <Trend now={p.position} before={p.previous} />
                        </td>
                        <td className={cn(td, num)}>{number(p.clicks)}</td>
                        <td className={cn(td, num)}>{number(p.impressions)}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
