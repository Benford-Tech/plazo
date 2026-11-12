import { useQuery } from "@tanstack/react-query";
import { EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { DirectBadge } from "@/components/DirectBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { todayLocal } from "@/lib/datetime";
import { isDirectBooking } from "@/lib/direct-booking";
import { formatRate } from "@/lib/commission";
import { fr, statsFr as t } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import { useRevenueHidden } from "@/lib/revenue-mask";
import type { ChannelProfit, RevenueChannels, RevenueMonth } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD = "rounded-[14px] border border-panel-line bg-white p-4 sm:p-5";
const GRID = "grid grid-cols-[1.6fr_repeat(5,minmax(0,1fr))_1.3fr] items-center gap-3";

const channelName = (c: Pick<ChannelProfit, "channel" | "detail">) => c.detail ?? fr.channels[c.channel];
const monthShort = (month: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));
const monthLong = (month: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-15T12:00:00Z`));

/** The net of one channel over the 12 months, as a small line (no axis: its shape only). */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 136 + 2},${26 - ((v - min) / span) * 22}`).join(" ");
  return (
    <svg width="140" height="28" viewBox="0 0 140 28" aria-hidden="true" className="max-w-full">
      <polyline points={points} fill="none" stroke="#1E5E2E" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function ChannelRow({ line }: { line: ChannelProfit }) {
  const direct = isDirectBooking(line.channel);
  return (
    <div
      data-testid={`stats-channel-${line.detail ?? line.channel}`}
      className={cn(
        "border-t border-panel-line px-4 py-3 text-sm first:border-t-0 sm:px-5",
        line.missingRate && "bg-[#FFFBEB]",
      )}
    >
      <div className={cn(GRID, "max-md:hidden")}>
        <span className="flex min-w-0 items-center gap-1.5 font-semibold">
          <span className="truncate">{channelName(line)}</span>
          {direct && <DirectBadge />}
          {line.rateBp !== null && <span className="font-normal text-muted-foreground">· {formatRate(line.rateBp)}</span>}
          {line.missingRate && <span className="font-normal text-[#B45309]">· {t.rateMissing}</span>}
        </span>
        <span className="font-mono">{line.count}</span>
        <span className="font-mono">{euros(line.totalCents)}</span>
        <span className={cn("font-mono", line.commissionCents > 0 ? "text-[#B91C1C]" : "text-muted-foreground")}>
          {line.missingRate ? "?" : line.commissionCents > 0 ? `− ${euros(line.commissionCents)}` : euros(0)}
        </span>
        <strong className="font-mono">{line.missingRate ? "—" : euros(line.netCents)}</strong>
        <span className="font-mono">{line.missingRate || line.netPerBookingCents === null ? "—" : euros(line.netPerBookingCents)}</span>
        {line.missingRate ? (
          <Link to="/parking/reglages" className="text-[13px] font-semibold text-lime-deep hover:underline">
            {t.setRate}
          </Link>
        ) : (
          <Sparkline values={line.monthlyNetCents} />
        )}
      </div>
      {/* Phone: the channel, then its figures under it. */}
      <div className="flex flex-col gap-1 md:hidden">
        <span className="flex items-center gap-1.5 font-semibold">
          {channelName(line)}
          {direct && <DirectBadge />}
          {line.missingRate && <span className="font-normal text-[#B45309]">· {t.rateMissing}</span>}
        </span>
        <span className="text-muted-foreground">
          {line.count} {t.columns.count.toLowerCase()} · {euros(line.totalCents)}
          {!line.missingRate && (
            <>
              {" · "}
              {t.columns.net.toLowerCase()} <strong className="text-foreground">{euros(line.netCents)}</strong>
            </>
          )}
        </span>
      </div>
    </div>
  );
}

/** « Chiffre et net, mois par mois »: a pale bar for the revenue, its dark part for what the parking keeps. */
function MonthsBars({ months }: { months: RevenueMonth[] }) {
  const max = Math.max(...months.map(m => m.totalCents), 1);
  return (
    <section className={cn(CARD, "flex flex-col gap-3")} data-testid="stats-months">
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="flex-1 text-[15px] font-semibold">{t.monthsTitle}</h2>
        <span className="text-xs text-muted-foreground">{t.monthsLegend}</span>
      </div>
      <div className="flex h-56 items-end gap-1.5 sm:gap-2.5">
        {months.map(m => {
          const total = (m.totalCents / max) * 100;
          const net = m.totalCents ? Math.max(0, (m.netCents / m.totalCents) * total) : 0;
          return (
            <div key={m.month} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div
                role="img"
                aria-label={t.monthBar(monthLong(m.month), euros(m.totalCents), euros(m.netCents))}
                className="relative w-full max-w-9 rounded-md bg-[#D9F99D]"
                style={{ height: `${Math.max(total, m.totalCents ? 2 : 0)}%` }}
              >
                <span className="absolute inset-x-0 bottom-0 rounded-md bg-lime-deep" style={{ height: `${total ? (net / total) * 100 : 0}%` }} />
              </div>
              <span className="font-mono text-[10px] text-muted-foreground">{monthShort(m.month)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Takeaways({ data }: { data: RevenueChannels }) {
  const known = data.channels.filter(c => !c.missingRate && c.netPerBookingCents !== null);
  const steady = known.filter(c => c.count >= 3);
  const pool = steady.length ? steady : known;
  const best = [...pool].sort((a, b) => (b.netPerBookingCents ?? 0) - (a.netPerBookingCents ?? 0))[0];
  const worstComparator = [...pool]
    .filter(c => c !== best && c.commissionCents > 0)
    .sort((a, b) => (a.netPerBookingCents ?? 0) - (b.netPerBookingCents ?? 0))[0];
  const missing = data.channels.filter(c => c.missingRate);
  const lines: { tone: string; title: string; text: React.ReactNode; key: string }[] = [];
  if (best)
    lines.push({
      key: "best",
      tone: "bg-[#F0FDF4]",
      title: t.best(channelName(best)),
      text: t.bestText(
        euros(best.netPerBookingCents ?? 0),
        worstComparator ? channelName(worstComparator) : null,
        worstComparator ? euros(worstComparator.netPerBookingCents ?? 0) : null,
      ),
    });
  if (missing.length)
    lines.push({
      key: "missing",
      tone: "bg-[#FFFBEB]",
      title: t.missing(missing.map(channelName).join(", ")),
      text: (
        <>
          {missing.length > 1 ? t.missingTextMany : t.missingText}{" "}
          <Link to="/parking/reglages" className="font-semibold text-lime-deep hover:underline">
            {t.setRate}
          </Link>
        </>
      ),
    });
  if (data.withoutAmount > 0)
    lines.push({
      key: "noPrice",
      tone: "bg-panel-2",
      title: t.noPrice(data.withoutAmount),
      text: (
        <>
          {t.noPriceText}{" "}
          <Link to="/reservations?sansprix=1" className="font-semibold text-lime-deep hover:underline">
            {t.complete}
          </Link>
        </>
      ),
    });
  return (
    <section className={cn(CARD, "flex flex-col gap-3")} data-testid="stats-takeaways">
      <h2 className="text-[15px] font-semibold">{t.takeaways}</h2>
      {lines.map(l => (
        <div key={l.key} className={cn("rounded-xl p-3 text-sm leading-relaxed", l.tone)}>
          <strong>{l.title}</strong>
          <br />
          <span className="text-muted-foreground">{l.text}</span>
        </div>
      ))}
      {!missing.length && !data.withoutAmount && <p className="text-sm text-muted-foreground">{t.allGood}</p>}
      <p className="text-xs text-muted-foreground">{t.netNote}</p>
    </section>
  );
}

/**
 * « Quelles plateformes vous rapportent » (12/11/2026, statistics B of https://claude.ai/artifact/6kXrPDgyh5r71S8KwcRAHi):
 * over the 12 months, each channel's bookings, revenue, commission, net and net per booking, its net month by month,
 * the months' revenue and net, and what to take from it. Managers only; hidden like the revenue by the platform admin.
 */
export default function StatsPage() {
  const [hidden, setHidden] = useRevenueHidden();
  const month = todayLocal().slice(0, 7);
  const query = useQuery({
    queryKey: ["revenue-channels", month],
    queryFn: () => adminApi.getRevenueChannels(month),
    enabled: !hidden,
  });
  const data = query.data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[13px] text-muted-foreground">{t.crumb}</span>
          <h1 className="text-2xl font-bold">{t.title}</h1>
        </div>
        <span className="flex h-9 items-center rounded-full bg-primary px-3.5 text-sm font-semibold text-primary-foreground">{t.period}</span>
      </div>

      {hidden ? (
        <section className={cn(CARD, "flex flex-col items-start gap-3")} data-testid="stats-hidden">
          <EyeOff className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <strong>{t.hidden}</strong>
          <p className="text-sm text-muted-foreground">{fr.revenue.mask.hiddenNote}</p>
          <button type="button" onClick={() => setHidden(false)} className="h-10 rounded-lg border border-panel-line px-3.5 text-sm font-medium">
            {fr.revenue.mask.reveal}
          </button>
        </section>
      ) : query.isError ? (
        <p className="text-sm text-[#B91C1C]">{t.error}</p>
      ) : !data ? (
        <Skeleton className="h-72 w-full" />
      ) : (
        <>
          <section className="overflow-hidden rounded-[14px] border border-panel-line bg-white" data-testid="stats-channels">
            <div className={cn(GRID, "border-b border-panel-line px-5 py-3 text-xs text-muted-foreground max-md:hidden")}>
              <span>{t.columns.channel}</span>
              <span>{t.columns.count}</span>
              <span>{t.columns.total}</span>
              <span>{t.columns.commission}</span>
              <span>{t.columns.net}</span>
              <span>{t.columns.perBooking}</span>
              <span>{t.columns.trend}</span>
            </div>
            {data.channels.length ? (
              data.channels.map(line => <ChannelRow key={`${line.channel}:${line.detail ?? ""}`} line={line} />)
            ) : (
              <p className="px-5 py-6 text-sm text-muted-foreground">{t.empty}</p>
            )}
          </section>
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <MonthsBars months={data.months} />
            </div>
            <div className="lg:col-span-5">
              <Takeaways data={data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
