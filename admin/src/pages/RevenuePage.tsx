import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { addDays, dateTimeShort, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { euros, parseEuros } from "@/lib/pricing";
import type { RevenueBasis, RevenueChannel, RevenueReport } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.revenue;
const CARD = "rounded-xl border border-panel-line bg-panel p-4 sm:p-5";
const PILL = "flex h-9 items-center rounded-full border px-3.5 text-sm";
const BUTTON = "flex h-10 items-center justify-center gap-2 rounded-lg border border-panel-line bg-panel px-3.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-50";

type PeriodKey = "today" | "week" | "month" | "lastMonth" | "custom";
interface Period {
  key: PeriodKey;
  from: string;
  to: string;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = (date: string) => capitalise(new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`)));
/** « 9 oct. » */
const dayMonth = (date: string) => new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
const lastDayOfMonth = (first: string) => addDays(`${addDays(first, 32).slice(0, 7)}-01`, -1);

/** The ready-made periods, as of the parking's today. */
function periodsOf(today: string): Record<Exclude<PeriodKey, "custom">, Period> {
  const monthStart = `${today.slice(0, 7)}-01`;
  const lastMonthStart = `${addDays(monthStart, -1).slice(0, 7)}-01`;
  return {
    today: { key: "today", from: today, to: today },
    week: { key: "week", from: addDays(today, -6), to: today },
    month: { key: "month", from: monthStart, to: lastDayOfMonth(monthStart) },
    lastMonth: { key: "lastMonth", from: lastMonthStart, to: addDays(monthStart, -1) },
  };
}

function channelName(line: Pick<RevenueChannel, "channel" | "detail">): string {
  return line.detail ?? fr.channels[line.channel];
}

/** Saves the CSV the API sends under its own name. */
function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** The bookings of the period without an amount: one field each (CA-B « Les compléter »). */
function MissingAmounts({ report }: { report: RevenueReport }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const saveAmount = useMutation({
    mutationFn: ({ id, cents }: { id: string; cents: number }) => adminApi.setReservationPrice(id, cents),
    onSuccess: () => {
      toast.success(t.saved);
      void queryClient.invalidateQueries({ queryKey: ["revenue"] });
    },
    onError: error => toast.error(describeError(error)),
  });
  return (
    <div className="space-y-2" data-testid="revenue-missing">
      <h3 className="text-sm font-semibold">{t.missingTitle}</h3>
      <ul className="divide-y divide-panel-line">
        {report.missing.map(m => {
          const value = values[m.id] ?? "";
          const cents = parseEuros(value);
          return (
            <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
              <span className="min-w-0 flex-[1_1_14rem]">
                <span className="font-medium">{m.customerName}</span>{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {m.reference} · {dateTimeShort(m.arrivalAt)} · {channelName(m)}
                </span>
              </span>
              <form
                className="flex items-center gap-2"
                onSubmit={e => {
                  e.preventDefault();
                  if (cents === null) {
                    toast.error(t.invalidAmount);
                    return;
                  }
                  saveAmount.mutate({ id: m.id, cents });
                }}
              >
                <input
                  aria-label={t.amountLabel(m.reference)}
                  inputMode="decimal"
                  value={value}
                  onChange={e => setValues(v => ({ ...v, [m.id]: e.target.value }))}
                  placeholder="0,00"
                  className="h-10 w-28 rounded-lg border border-panel-line bg-panel px-2.5 text-right font-mono text-sm"
                />
                <span className="text-sm text-muted-foreground">€</span>
                <button type="submit" disabled={!value || saveAmount.isPending} className={BUTTON}>
                  {t.save}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      {report.withoutAmount > report.missing.length && <p className="text-xs text-muted-foreground">{t.missingMore}</p>}
    </div>
  );
}

/** CA-B (09/10/2026, chosen with the CA-A tile): the revenue of a period, by channel and by day. Managers only. */
export default function RevenuePage() {
  const today = todayLocal();
  const presets = periodsOf(today);
  const [period, setPeriod] = useState<Period>(presets.month);
  const [draft, setDraft] = useState({ from: presets.month.from, to: today });
  const [basis, setBasis] = useState<RevenueBasis>("arrival");
  const [showMissing, setShowMissing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const query = useQuery({
    queryKey: ["revenue", period.from, period.to, basis],
    queryFn: () => adminApi.getRevenue(period.from, period.to, basis),
  });
  const report = query.data;

  const labels: Record<Exclude<PeriodKey, "custom">, string> = {
    today: t.today,
    week: t.week,
    month: monthName(presets.month.from),
    lastMonth: monthName(presets.lastMonth.from),
  };
  const totalLabel = period.key === "month" || period.key === "lastMonth" ? labels[period.key].toLowerCase() : t.span(dayMonth(period.from), dayMonth(period.to));
  const max = Math.max(1, ...(report?.byDay.map(d => d.totalCents) ?? [0]));

  async function exportCsv() {
    setExporting(true);
    try {
      const { blob, filename } = await adminApi.exportRevenue(period.from, period.to, basis);
      save(blob, filename ?? `chiffre-affaires_${period.from}_${period.to}.csv`);
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div role="group" aria-label={t.periods} className="flex flex-wrap gap-1.5">
          {(Object.keys(labels) as Exclude<PeriodKey, "custom">[]).map(key => (
            <button
              key={key}
              type="button"
              aria-pressed={period.key === key}
              onClick={() => setPeriod(presets[key])}
              className={cn(PILL, period.key === key ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-panel-line bg-panel hover:bg-panel-2")}
            >
              {labels[key]}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={period.key === "custom"}
            onClick={() => setPeriod({ key: "custom", from: draft.from, to: draft.to })}
            className={cn(PILL, period.key === "custom" ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-panel-line bg-panel hover:bg-panel-2")}
          >
            {t.custom}
          </button>
        </div>
      </div>

      {period.key === "custom" && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={e => {
            e.preventDefault();
            if (draft.from && draft.to && draft.from <= draft.to) setPeriod({ key: "custom", ...draft });
          }}
        >
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t.from}
            <input type="date" value={draft.from} onChange={e => setDraft(d => ({ ...d, from: e.target.value }))} className="h-10 rounded-lg border border-panel-line bg-panel px-2.5 font-mono text-sm text-foreground" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t.to}
            <input type="date" value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} className="h-10 rounded-lg border border-panel-line bg-panel px-2.5 font-mono text-sm text-foreground" />
          </label>
          <button type="submit" className={BUTTON}>
            {t.apply}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <span>{t.countBy}</span>
        {(["arrival", "booked"] as RevenueBasis[]).map(b => (
          <button
            key={b}
            type="button"
            aria-pressed={basis === b}
            onClick={() => setBasis(b)}
            className={cn("flex h-8 items-center rounded-full border px-3", basis === b ? "border-lime-deep font-semibold text-lime-deep" : "border-panel-line bg-panel")}
          >
            {t.basis[b]}
          </button>
        ))}
        <span>· {t.cancelledOut}</span>
      </div>

      {query.isError ? (
        <p className={CARD}>{describeError(query.error)}</p>
      ) : !report ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={cn(CARD, "border-2 border-primary")} data-testid="revenue-total">
              <p className="font-mono text-xs uppercase tracking-wider text-lime-deep">{t.total(totalLabel)}</p>
              <p className="tabular mt-1 font-mono text-3xl font-medium">{euros(report.totalCents)}</p>
            </div>
            <div className={CARD}>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.bookings}</p>
              <p className="tabular mt-1 font-mono text-3xl font-medium" data-testid="revenue-count">
                {report.count}
              </p>
              <p className="text-[13px] text-muted-foreground">{t.bookingsSub(report.withoutAmount)}</p>
            </div>
            <div className={CARD}>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t.average}</p>
              <p className="tabular mt-1 font-mono text-3xl font-medium">{report.averageCents === null ? "—" : euros(report.averageCents)}</p>
              <p className="text-[13px] text-muted-foreground">{t.averageSub(report.averageDays)}</p>
            </div>
          </div>

          <section aria-labelledby="revenue-channels" className={cn(CARD, "space-y-3")}>
            <h2 id="revenue-channels" className="text-base font-semibold">
              {t.byChannel}
            </h2>
            {report.byChannel.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noRevenue}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th scope="col" className="px-1.5 py-2 font-medium">
                        {t.channel}
                      </th>
                      <th scope="col" className="px-1.5 py-2 text-right font-medium">
                        {t.count}
                      </th>
                      <th scope="col" className="px-1.5 py-2 text-right font-medium">
                        {t.amount}
                      </th>
                      <th scope="col" className="hidden w-1/3 px-1.5 py-2 font-medium sm:table-cell">
                        {t.share}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byChannel.map(line => {
                      const share = report.totalCents ? Math.round((line.totalCents / report.totalCents) * 100) : 0;
                      return (
                        <tr key={`${line.channel}:${line.detail ?? ""}`} className="border-t border-panel-line">
                          <th scope="row" className="px-1.5 py-2.5 text-left font-semibold">
                            {channelName(line)}
                          </th>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono">{line.count}</td>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono">
                            {euros(line.totalCents)}
                            <span className="block text-xs text-muted-foreground sm:hidden">{share} %</span>
                          </td>
                          <td className="hidden px-1.5 py-2.5 sm:table-cell">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 flex-1 rounded-full bg-panel-2">
                                <span className="block h-2.5 rounded-full bg-lime-deep" style={{ width: `${share}%` }} />
                              </span>
                              <span className="w-10 text-right font-mono text-xs text-muted-foreground">{share} %</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {report.withoutAmount > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FEF3C7] px-3 py-2 text-[13px] text-[#92400E]">
                  <span>{t.missing(report.withoutAmount)}</span>
                  <button type="button" onClick={() => setShowMissing(s => !s)} aria-expanded={showMissing} className="font-semibold underline underline-offset-2">
                    {showMissing ? t.hide : t.complete}
                  </button>
                </div>
                {showMissing && <MissingAmounts report={report} />}
              </div>
            )}
          </section>

          <section aria-labelledby="revenue-days" className={cn(CARD, "space-y-3")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="revenue-days" className="text-base font-semibold">
                {t.byDay}
              </h2>
              <button type="button" onClick={() => void exportCsv()} disabled={exporting} className={BUTTON}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {exporting ? t.exporting : t.export}
              </button>
            </div>
            <ol className="flex h-40 items-end gap-1 border-b border-panel-line" data-testid="revenue-days">
              {report.byDay.map(day => (
                <li key={day.date} className="flex h-full flex-1 items-end" title={t.dayLabel(dayMonth(day.date), euros(day.totalCents), day.count)}>
                  <span className="sr-only">{t.dayLabel(dayMonth(day.date), euros(day.totalCents), day.count)}</span>
                  <span
                    aria-hidden="true"
                    className={cn("block w-full rounded-t", day.date === today ? "bg-lime-deep" : day.date > today ? "bg-panel-line" : "bg-primary")}
                    style={{ height: `${Math.max(day.totalCents ? 4 : 2, Math.round((day.totalCents / max) * 100))}%` }}
                  />
                </li>
              ))}
            </ol>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>{dayMonth(report.from)}</span>
              {report.from < today && today < report.to && <span>{`${dayMonth(today)} (${t.todayMark})`}</span>}
              <span>{dayMonth(report.to)}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
