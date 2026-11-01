import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { addDays, dateTimeShort, todayLocal } from "@/lib/datetime";
import { describeError, fr } from "@/lib/fr";
import { formatRate, parsePercent, rateToInput } from "@/lib/commission";
import { euros, parseEuros } from "@/lib/pricing";
import { useRevenueHidden } from "@/lib/revenue-mask";
import type {
  RevenueBasis,
  RevenueChannel,
  RevenueMonth,
  RevenueReport,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.revenue;
const CARD = "rounded-xl border border-panel-line bg-panel p-4 sm:p-5";
const PILL = "flex h-9 items-center rounded-full border px-3.5 text-sm";
const BUTTON =
  "flex h-10 items-center justify-center gap-2 rounded-lg border border-panel-line bg-panel px-3.5 text-sm font-medium hover:bg-panel-2 disabled:opacity-50";

type PeriodKey = "today" | "week" | "month" | "custom";
interface Period {
  key: PeriodKey;
  from: string;
  to: string;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = (date: string) =>
  capitalise(
    new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
      new Date(`${date}T12:00:00Z`),
    ),
  );
/** « 9 oct. » */
const dayMonth = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
const lastDayOfMonth = (first: string) =>
  addDays(`${addDays(first, 32).slice(0, 7)}-01`, -1);
/** « Novembre 2026 » */
const monthYear = (date: string) =>
  capitalise(
    new Intl.DateTimeFormat("fr-FR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`)),
  );
/** « nov. » */
const monthShort = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
/** The month of `first` (« YYYY-MM-01 »), `delta` months away, as a period. */
function monthPeriod(first: string, delta = 0): Period {
  let from = `${first.slice(0, 7)}-01`;
  for (let i = 0; i < Math.abs(delta); i++)
    from =
      delta > 0
        ? `${addDays(from, 32).slice(0, 7)}-01`
        : `${addDays(from, -1).slice(0, 7)}-01`;
  return { key: "month", from, to: lastDayOfMonth(from) };
}
/** « 4,3 k » above a bar. */
const shortEuros = (cents: number) =>
  cents >= 100000
    ? `${(cents / 100000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} k`
    : `${Math.round(cents / 100)}`;

/** The ready-made periods, as of the parking's today. */
function periodsOf(
  today: string,
): Record<Exclude<PeriodKey, "custom">, Period> {
  return {
    today: { key: "today", from: today, to: today },
    week: { key: "week", from: addDays(today, -6), to: today },
    month: monthPeriod(today),
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
    mutationFn: ({ id, cents }: { id: string; cents: number }) =>
      adminApi.setReservationPrice(id, cents),
    onSuccess: () => {
      toast.success(t.saved);
      void queryClient.invalidateQueries({ queryKey: ["revenue"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });
  return (
    <div className="space-y-2" data-testid="revenue-missing">
      <h3 className="text-sm font-semibold">{t.missingTitle}</h3>
      <ul className="divide-y divide-panel-line">
        {report.missing.map((m) => {
          const value = values[m.id] ?? "";
          const cents = parseEuros(value);
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5"
            >
              <span className="min-w-0 flex-[1_1_14rem]">
                <span className="font-medium">{m.customerName}</span>{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {m.reference} · {dateTimeShort(m.arrivalAt)} ·{" "}
                  {channelName(m)}
                </span>
              </span>
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
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
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [m.id]: e.target.value }))
                  }
                  placeholder="0,00"
                  className="h-10 w-28 rounded-lg border border-panel-line bg-panel px-2.5 text-right font-mono text-sm"
                />
                <span className="text-sm text-muted-foreground">€</span>
                <button
                  type="submit"
                  disabled={!value || saveAmount.isPending}
                  className={BUTTON}
                >
                  {t.save}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
      {report.withoutAmount > report.missing.length && (
        <p className="text-xs text-muted-foreground">{t.missingMore}</p>
      )}
    </div>
  );
}

/** CA-B (09/10/2026, chosen with the CA-A tile): the revenue of a period, by channel and by day. Managers only. */
/**
 * A comparator's rate, typed in place in « Par canal » (19/10/2026, choice « les 3 », A): saved when it changes, for
 * the bookings made from the first day shown on.
 */
function RateCell({ line, from }: { line: RevenueChannel; from: string }) {
  const queryClient = useQueryClient();
  const initial = line.rate ? rateToInput(line.rate.rateBp) : "";
  const [value, setValue] = useState(initial);
  const name = channelName(line);
  const save = useMutation({
    mutationFn: (rateBp: number) =>
      adminApi.setComparatorCommission({
        label: name,
        rateBp,
        fixedCents: line.rate?.fixedCents ?? 0,
        effectiveFrom: from,
      }),
    onSuccess: () => {
      toast.success(t.rateSaved(name));
      void queryClient.invalidateQueries({ queryKey: ["revenue"] });
      void queryClient.invalidateQueries({
        queryKey: ["comparator-commissions"],
      });
    },
    onError: (error) => {
      toast.error(describeError(error));
      setValue(initial);
    },
  });
  const commit = () => {
    if (value.trim() === initial) return;
    const bp = parsePercent(value);
    if (bp === null) {
      toast.error(fr.commission.invalidRate);
      return setValue(initial);
    }
    save.mutate(bp);
  };
  return (
    <span className="inline-flex items-center gap-1">
      <input
        aria-label={t.rateLabel(name)}
        inputMode="decimal"
        value={value}
        placeholder="—"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        disabled={save.isPending}
        className="tabular h-9 w-16 rounded-lg border border-panel-line bg-panel px-2 text-right font-mono text-sm"
      />
      <span className="text-muted-foreground">%</span>
    </span>
  );
}

/**
 * « Mois par mois » (01/11/2026, « pouvoir afficher le CA de chaque mois », choice B): the 12 months ending with this
 * one (or with the month shown when it lies outside them) in bars and in a table; a click shows that month below.
 */
function MonthsCard({
  today,
  selected,
  basis,
  view,
  onPick,
}: {
  today: string;
  selected: string | null;
  basis: RevenueBasis;
  view: "gross" | "net";
  onPick: (month: RevenueMonth) => void;
}) {
  const current = today.slice(0, 7);
  const windowStart = monthPeriod(`${current}-01`, -11).from.slice(0, 7);
  const end =
    selected && (selected > current || selected < windowStart)
      ? selected
      : current;
  const query = useQuery({
    queryKey: ["revenue-months", end, basis],
    queryFn: () => adminApi.getRevenueMonths(end, basis),
  });
  const data = query.data;
  if (query.isError)
    return <p className={CARD}>{describeError(query.error)}</p>;
  if (!data) return <Skeleton className="h-56 w-full" />;
  const value = (m: RevenueMonth) =>
    view === "net" ? m.netCents : m.totalCents;
  const max = Math.max(1, ...data.months.map(value));
  const first = data.months[0];
  const last = data.months[data.months.length - 1];
  const label = (m: RevenueMonth) => monthYear(m.from);
  return (
    <section
      aria-labelledby="revenue-months"
      data-testid="revenue-months"
      className={cn(CARD, "space-y-4")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="revenue-months" className="text-base font-semibold">
          {t.months.title(
            `${monthShort(first.from)} ${first.from.slice(0, 4)}`,
            `${monthShort(last.from)} ${last.from.slice(0, 4)}`,
          )}
        </h2>
        <span className="tabular font-mono text-sm">
          {view === "net"
            ? t.months.totalNet(euros(data.netCents))
            : t.months.total(euros(data.totalCents))}
        </span>
      </div>
      <div className="overflow-x-auto">
        <div className="grid h-48 min-w-[620px] grid-cols-12 items-end gap-2">
          {data.months.map((m) => {
            const isSelected = m.month === selected;
            const future = m.month > current;
            return (
              <button
                key={m.month}
                type="button"
                data-testid={`revenue-month-${m.month}`}
                aria-pressed={isSelected}
                aria-label={t.months.open(label(m), euros(value(m)))}
                onClick={() => onPick(m)}
                className="flex h-full flex-col items-center justify-end gap-1 rounded-md hover:bg-panel-2"
              >
                <span className="tabular whitespace-nowrap font-mono text-[10.5px]">
                  {shortEuros(value(m))}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "block w-full rounded-t-md",
                    isSelected
                      ? "bg-primary outline outline-2 outline-lime-deep"
                      : future
                        ? "bg-lime-deep/25"
                        : "bg-lime-deep",
                  )}
                  style={{
                    height: `${Math.max(2, Math.round((value(m) / max) * 100))}%`,
                  }}
                />
                <span
                  className={cn(
                    "text-[11px]",
                    m.month === current
                      ? "font-bold text-lime-deep"
                      : "text-muted-foreground",
                  )}
                >
                  {monthShort(m.from)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t.months.hint}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="py-2 font-medium">{t.months.month}</th>
              <th className="py-2 text-right font-medium">{t.count}</th>
              <th className="py-2 text-right font-medium">{t.amount}</th>
              <th className="py-2 text-right font-medium">{t.commission}</th>
              <th className="py-2 text-right font-medium">{t.net}</th>
              <th className="py-2 text-right font-medium">
                {t.months.withoutAmount}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panel-line">
            {[...data.months].reverse().map((m) => (
              <tr
                key={m.month}
                onClick={() => onPick(m)}
                className={cn(
                  "cursor-pointer hover:bg-panel-2",
                  m.month === selected && "bg-primary/15 font-semibold",
                )}
              >
                <td className="py-2">
                  <button
                    type="button"
                    className="text-left hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPick(m);
                    }}
                  >
                    {label(m)}
                  </button>
                </td>
                <td className="tabular py-2 text-right font-mono">{m.count}</td>
                <td className="tabular py-2 text-right font-mono">
                  {euros(m.totalCents)}
                </td>
                <td className="tabular py-2 text-right font-mono">
                  {m.commissionCents > 0
                    ? `− ${euros(m.commissionCents)}`
                    : "—"}
                </td>
                <td className="tabular py-2 text-right font-mono">
                  {euros(m.netCents)}
                </td>
                <td
                  className={cn(
                    "tabular py-2 text-right font-mono",
                    m.withoutAmount > 0 && "text-amber-600",
                  )}
                >
                  {m.withoutAmount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function RevenuePage() {
  const today = todayLocal();
  const presets = periodsOf(today);
  const [period, setPeriod] = useState<Period>(presets.month);
  const [draft, setDraft] = useState({ from: presets.month.from, to: today });
  const [basis, setBasis] = useState<RevenueBasis>("arrival");
  const [showMissing, setShowMissing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [view, setView] = useState<"gross" | "net">("gross");
  // 27/10/2026: hidden on this browser by the platform admin: no figure, and nothing asked to the API.
  const [hidden, setHidden] = useRevenueHidden();

  const query = useQuery({
    queryKey: ["revenue", period.from, period.to, basis],
    queryFn: () => adminApi.getRevenue(period.from, period.to, basis),
    enabled: !hidden,
  });
  const report = query.data;

  const labels: Record<"today" | "week", string> = {
    today: t.today,
    week: t.week,
  };
  // The month shown by « ‹ mois › »: the one on screen, else this month.
  const shownMonth = period.key === "month" ? period : presets.month;
  const totalLabel =
    period.key === "month"
      ? (period.from.slice(0, 4) === today.slice(0, 4)
          ? monthName(period.from)
          : monthYear(period.from)
        ).toLowerCase()
      : t.span(dayMonth(period.from), dayMonth(period.to));
  const shown = (line: { totalCents: number; netCents?: number }) =>
    view === "net" ? (line.netCents ?? line.totalCents) : line.totalCents;
  const max = Math.max(1, ...(report?.byDay.map(shown) ?? [0]));

  async function exportCsv() {
    setExporting(true);
    try {
      const { blob, filename } = await adminApi.exportRevenue(
        period.from,
        period.to,
        basis,
      );
      save(
        blob,
        filename ?? `chiffre-affaires_${period.from}_${period.to}.csv`,
      );
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setExporting(false);
    }
  }

  if (hidden)
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div
          data-testid="revenue-hidden"
          className={cn(CARD, "flex flex-col items-start gap-3")}
        >
          <span className="flex items-center gap-2 font-medium">
            <EyeOff
              className="h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
            {t.mask.hidden}
          </span>
          <p className="text-sm text-muted-foreground">{t.mask.hiddenNote}</p>
          <button
            type="button"
            onClick={() => setHidden(false)}
            className={BUTTON}
          >
            {t.mask.reveal}
          </button>
        </div>
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t.title}</h1>
        <div
          role="group"
          aria-label={t.periods}
          className="flex flex-wrap gap-1.5"
        >
          {(Object.keys(labels) as ("today" | "week")[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={period.key === key}
              onClick={() => setPeriod(presets[key])}
              className={cn(
                PILL,
                period.key === key
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-panel-line bg-panel hover:bg-panel-2",
              )}
            >
              {labels[key]}
            </button>
          ))}
          <span
            data-testid="revenue-month-nav"
            className={cn(
              "flex h-9 items-center overflow-hidden rounded-full border text-sm",
              period.key === "month"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-panel-line bg-panel",
            )}
          >
            <button
              type="button"
              aria-label={t.prevMonth}
              onClick={() => setPeriod(monthPeriod(shownMonth.from, -1))}
              className="flex h-full items-center px-2 hover:bg-black/5"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-pressed={period.key === "month"}
              onClick={() => setPeriod(shownMonth)}
              className={cn(
                "h-full px-2",
                period.key === "month" && "font-semibold",
              )}
            >
              {monthYear(shownMonth.from)}
            </button>
            <button
              type="button"
              aria-label={t.nextMonth}
              onClick={() => setPeriod(monthPeriod(shownMonth.from, 1))}
              className="flex h-full items-center px-2 hover:bg-black/5"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </span>
          <button
            type="button"
            aria-pressed={period.key === "custom"}
            onClick={() =>
              setPeriod({ key: "custom", from: draft.from, to: draft.to })
            }
            className={cn(
              PILL,
              period.key === "custom"
                ? "border-primary bg-primary font-semibold text-primary-foreground"
                : "border-panel-line bg-panel hover:bg-panel-2",
            )}
          >
            {t.custom}
          </button>
        </div>
      </div>

      {period.key === "custom" && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.from && draft.to && draft.from <= draft.to)
              setPeriod({ key: "custom", ...draft });
          }}
        >
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t.from}
            <input
              type="date"
              value={draft.from}
              onChange={(e) =>
                setDraft((d) => ({ ...d, from: e.target.value }))
              }
              className="h-10 rounded-lg border border-panel-line bg-panel px-2.5 font-mono text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t.to}
            <input
              type="date"
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              className="h-10 rounded-lg border border-panel-line bg-panel px-2.5 font-mono text-sm text-foreground"
            />
          </label>
          <button type="submit" className={BUTTON}>
            {t.apply}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <span>{t.countBy}</span>
        {(["arrival", "booked"] as RevenueBasis[]).map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={basis === b}
            onClick={() => setBasis(b)}
            className={cn(
              "flex h-8 items-center rounded-full border px-3",
              basis === b
                ? "border-lime-deep font-semibold text-lime-deep"
                : "border-panel-line bg-panel",
            )}
          >
            {t.basis[b]}
          </button>
        ))}
        <span>· {t.cancelledOut}</span>
        <span
          className="ml-auto flex items-center gap-1"
          role="group"
          aria-label={t.view}
        >
          {(["gross", "net"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "flex h-8 items-center rounded-full border px-3",
                view === v
                  ? "border-lime-deep bg-lime-deep font-semibold text-white"
                  : "border-panel-line bg-panel",
              )}
            >
              {t.views[v]}
            </button>
          ))}
        </span>
      </div>

      <MonthsCard
        today={today}
        selected={period.key === "month" ? period.from.slice(0, 7) : null}
        basis={basis}
        view={view}
        onPick={(m) => setPeriod(monthPeriod(m.from))}
      />

      {query.isError ? (
        <p className={CARD}>{describeError(query.error)}</p>
      ) : !report ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div
              className={cn(CARD, "border-2 border-primary")}
              data-testid="revenue-total"
            >
              <p className="font-mono text-xs uppercase tracking-wider text-lime-deep">
                {view === "net" ? t.totalNet(totalLabel) : t.total(totalLabel)}
              </p>
              <p className="tabular mt-1 font-mono text-3xl font-medium">
                {euros(view === "net" ? report.netCents : report.totalCents)}
              </p>
              {view === "net" ? (
                <p className="text-[13px] text-muted-foreground">
                  {t.netSub(
                    euros(report.totalCents),
                    euros(report.commissionCents),
                  )}
                </p>
              ) : (
                report.commissionCents > 0 && (
                  <p className="text-[13px] text-muted-foreground">
                    {t.grossSub(euros(report.commissionCents))}
                  </p>
                )
              )}
            </div>
            <div className={CARD}>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t.bookings}
              </p>
              <p
                className="tabular mt-1 font-mono text-3xl font-medium"
                data-testid="revenue-count"
              >
                {report.count}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {t.bookingsSub(report.withoutAmount)}
              </p>
            </div>
            <div className={CARD}>
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t.average}
              </p>
              <p className="tabular mt-1 font-mono text-3xl font-medium">
                {report.averageCents === null
                  ? "—"
                  : euros(report.averageCents)}
              </p>
              <p className="text-[13px] text-muted-foreground">
                {t.averageSub(report.averageDays)}
              </p>
            </div>
          </div>

          <section
            aria-labelledby="revenue-channels"
            className={cn(CARD, "space-y-3")}
          >
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
                      <th
                        scope="col"
                        className="px-1.5 py-2 text-right font-medium"
                      >
                        {t.count}
                      </th>
                      <th
                        scope="col"
                        className="px-1.5 py-2 text-right font-medium"
                      >
                        {t.amount}
                      </th>
                      <th
                        scope="col"
                        className="px-1.5 py-2 text-right font-medium"
                      >
                        {t.commission}
                      </th>
                      <th
                        scope="col"
                        className="px-1.5 py-2 text-right font-medium"
                      >
                        {t.net}
                      </th>
                      <th
                        scope="col"
                        className="hidden w-1/3 px-1.5 py-2 font-medium sm:table-cell"
                      >
                        {t.share}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byChannel.map((line) => {
                      const whole =
                        view === "net" ? report.netCents : report.totalCents;
                      const share = whole
                        ? Math.round((shown(line) / whole) * 100)
                        : 0;
                      return (
                        <tr
                          key={`${line.channel}:${line.detail ?? ""}`}
                          className="border-t border-panel-line"
                        >
                          <th
                            scope="row"
                            className="px-1.5 py-2.5 text-left font-semibold"
                          >
                            {channelName(line)}
                          </th>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono">
                            {line.count}
                          </td>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono">
                            {euros(line.totalCents)}
                            <span className="block text-xs text-muted-foreground sm:hidden">
                              {share} %
                            </span>
                          </td>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono">
                            {line.comparatorKey ? (
                              <span className="flex flex-col items-end gap-0.5">
                                <RateCell
                                  key={`${line.rate?.effectiveFrom ?? ""}:${line.rate?.rateBp ?? ""}`}
                                  line={line}
                                  from={report.from}
                                />
                                {line.commissionCents > 0 && (
                                  <span className="text-xs text-[#B45309]">
                                    − {euros(line.commissionCents)}
                                  </span>
                                )}
                                {line.rate?.fixedCents ? (
                                  <span className="text-xs text-muted-foreground">
                                    {formatRate(line.rate.rateBp)} +{" "}
                                    {euros(line.rate.fixedCents)}
                                  </span>
                                ) : null}
                              </span>
                            ) : line.channel === "plazo" ? (
                              <span className="flex flex-col items-end gap-0.5">
                                {line.commissionCents > 0 && (
                                  <span className="text-[#B45309]">
                                    − {euros(line.commissionCents)}
                                  </span>
                                )}
                                <span className="font-sans text-xs text-muted-foreground">
                                  {t.plazoCommission}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="tabular px-1.5 py-2.5 text-right font-mono font-semibold">
                            {euros(line.netCents)}
                          </td>
                          <td className="hidden px-1.5 py-2.5 sm:table-cell">
                            <span className="flex items-center gap-2">
                              <span className="h-2.5 flex-1 rounded-full bg-panel-2">
                                <span
                                  className="block h-2.5 rounded-full bg-lime-deep"
                                  style={{ width: `${share}%` }}
                                />
                              </span>
                              <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                                {share} %
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {report.byChannel.some((line) => line.comparatorKey) && (
              <p className="text-xs text-muted-foreground">
                {t.rateHint(dayMonth(report.from))}
              </p>
            )}
            {report.withoutAmount > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FEF3C7] px-3 py-2 text-[13px] text-[#92400E]">
                  <span>{t.missing(report.withoutAmount)}</span>
                  <button
                    type="button"
                    onClick={() => setShowMissing((s) => !s)}
                    aria-expanded={showMissing}
                    className="font-semibold underline underline-offset-2"
                  >
                    {showMissing ? t.hide : t.complete}
                  </button>
                </div>
                {showMissing && <MissingAmounts report={report} />}
              </div>
            )}
          </section>

          {/* 29/10/2026 (« le moyen de paiement », direction A « Payé par »). */}
          {(report.byPaymentMethod ?? []).length > 0 && (
            <section
              aria-labelledby="revenue-methods"
              className={cn(CARD, "space-y-3")}
              data-testid="revenue-methods"
            >
              <h2 id="revenue-methods" className="text-base font-semibold">
                {t.byPaymentMethod}
              </h2>
              <ul className="space-y-2.5">
                {(report.byPaymentMethod ?? []).map((line, _, lines) => {
                  const top = Math.max(1, ...lines.map((l) => l.totalCents));
                  return (
                    <li key={line.method ?? "none"} className="space-y-1">
                      <div className="flex items-baseline gap-3 text-sm">
                        <span
                          className={cn(
                            "flex-1",
                            !line.method && "text-muted-foreground",
                          )}
                        >
                          {line.method
                            ? fr.paidBy[line.method]
                            : t.paidByUnknown}
                        </span>
                        <span className="text-muted-foreground">
                          {t.bookingsShort(line.count)}
                        </span>
                        <span className="tabular w-28 text-right font-mono">
                          {euros(line.totalCents)}
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full bg-[#F1F2F0]"
                        aria-hidden="true"
                      >
                        <div
                          className={cn(
                            "h-1.5 rounded-full",
                            line.method
                              ? "bg-lime-deep"
                              : "bg-muted-foreground/40",
                          )}
                          style={{
                            width: `${Math.max(2, Math.round((line.totalCents / top) * 100))}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="text-xs text-muted-foreground">{t.paidByHint}</p>
            </section>
          )}

          <section
            aria-labelledby="revenue-days"
            className={cn(CARD, "space-y-3")}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="revenue-days" className="text-base font-semibold">
                {t.byDay}
              </h2>
              <button
                type="button"
                onClick={() => void exportCsv()}
                disabled={exporting}
                className={BUTTON}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                {exporting ? t.exporting : t.export}
              </button>
            </div>
            <ol
              className="flex h-40 items-end gap-1 border-b border-panel-line"
              data-testid="revenue-days"
            >
              {report.byDay.map((day) => (
                <li
                  key={day.date}
                  className="flex h-full flex-1 items-end"
                  title={t.dayLabel(
                    dayMonth(day.date),
                    euros(shown(day)),
                    day.count,
                  )}
                >
                  <span className="sr-only">
                    {t.dayLabel(
                      dayMonth(day.date),
                      euros(shown(day)),
                      day.count,
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block w-full rounded-t",
                      day.date === today
                        ? "bg-lime-deep"
                        : day.date > today
                          ? "bg-panel-line"
                          : "bg-primary",
                    )}
                    style={{
                      height: `${Math.max(shown(day) ? 4 : 2, Math.round((shown(day) / max) * 100))}%`,
                    }}
                  />
                </li>
              ))}
            </ol>
            <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>{dayMonth(report.from)}</span>
              {report.from < today && today < report.to && (
                <span>{`${dayMonth(today)} (${t.todayMark})`}</span>
              )}
              <span>{dayMonth(report.to)}</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
