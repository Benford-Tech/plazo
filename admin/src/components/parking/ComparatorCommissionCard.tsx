import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { dayLabel, formatRate, parsePercent, rateToInput } from "@/lib/commission";
import { describeError, fr } from "@/lib/fr";
import { centsToInput, euros, parseEuros } from "@/lib/pricing";
import type { ComparatorCommission } from "@/lib/types";

const t = fr.commission;
const INPUT = "h-11 rounded-lg border border-input bg-background px-2.5 text-right font-mono text-sm";

/** One comparator: its percentage, its fixed amount per booking and the day they apply from, saved together. */
function ComparatorRow({ comparator, today }: { comparator: ComparatorCommission; today: string }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const current = comparator.current;
  const [rate, setRate] = useState(current ? rateToInput(current.rateBp) : "");
  const [fixed, setFixed] = useState(current && current.fixedCents ? centsToInput(current.fixedCents) : "");
  const [since, setSince] = useState(today);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["comparator-commissions"] });
    void queryClient.invalidateQueries({ queryKey: ["revenue"] });
    void queryClient.invalidateQueries({ queryKey: ["reservation"] });
  };
  const save = useMutation({
    mutationFn: (body: { rateBp: number; fixedCents: number }) =>
      adminApi.setComparatorCommission({ label: comparator.label, effectiveFrom: since, ...body }),
    onSuccess: () => {
      setError(null);
      toast.success(t.saved(comparator.label));
      refresh();
    },
    onError: err => setError(err instanceof ApiError && err.fields ? (err.fields.rateBp ? t.invalidRate : t.invalidFixed) : describeError(err)),
  });
  const remove = useMutation({
    mutationFn: (effectiveFrom: string) => adminApi.removeComparatorCommission(comparator.key, effectiveFrom),
    onSuccess: () => {
      toast.success(t.removed);
      refresh();
    },
    onError: err => toast.error(describeError(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const rateBp = parsePercent(rate);
    if (rateBp === null) return setError(t.invalidRate);
    const fixedCents = fixed.trim() ? parseEuros(fixed) : 0;
    if (fixedCents === null) return setError(t.invalidFixed);
    save.mutate({ rateBp, fixedCents });
  }

  const describe = (r: { rateBp: number; fixedCents: number }) => `${formatRate(r.rateBp)}${r.fixedCents ? ` + ${euros(r.fixedCents)}` : ""}`;

  return (
    <li className="space-y-2 border-t border-border py-3 first:border-t-0">
      <form onSubmit={submit} className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[1.2fr_1fr_1fr_1.3fr_auto]">
        <div className="col-span-2 sm:col-span-1">
          <p className="font-semibold">{comparator.label}</p>
          <p className="text-xs text-muted-foreground">
            {t.thisMonth} : <span className="font-mono">{comparator.bookingsThisMonth}</span>
          </p>
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t.rate}
          <span className="flex items-center gap-1.5 text-foreground">
            <input aria-label={t.rateLabel(comparator.label)} inputMode="decimal" value={rate} onChange={e => setRate(e.target.value)} className={`${INPUT} w-20`} />%
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t.fixed}
          <span className="flex items-center gap-1.5 text-foreground">
            <input aria-label={t.fixedLabel(comparator.label)} inputMode="decimal" placeholder="0,00" value={fixed} onChange={e => setFixed(e.target.value)} className={`${INPUT} w-24`} />€
          </span>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          {t.since}
          <input type="date" aria-label={t.sinceLabel(comparator.label)} value={since} onChange={e => setSince(e.target.value)} className="h-11 rounded-lg border border-input bg-background px-2.5 font-mono text-sm text-foreground" />
        </label>
        <Button type="submit" className="h-11" disabled={save.isPending || !rate.trim() || !since}>
          {t.save}
        </Button>
      </form>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
        {current ? <span>{t.current(describe(current), dayLabel(current.effectiveFrom))}</span> : <span>{t.none}</span>}
        {comparator.upcoming.map(r => (
          <span key={r.effectiveFrom} className="flex items-center gap-2">
            {t.upcoming(describe(r), dayLabel(r.effectiveFrom))}
            <button
              type="button"
              className="text-lime-deep underline-offset-4 hover:underline"
              onClick={async () => {
                const ok = await confirm(t.removeBody, { title: t.removeTitle(comparator.label, dayLabel(r.effectiveFrom)), confirmLabel: t.remove, destructive: true });
                if (ok) remove.mutate(r.effectiveFrom);
              }}
            >
              {t.remove}
            </button>
          </span>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </li>
  );
}

/**
 * Parking › Réglages › « Ce que chaque comparateur vous prend » (19/10/2026, choice « les 3 », B): a rate and a fixed
 * amount per booking per comparator, from a day on; the revenue page and the bookings show what the operator keeps.
 */
export function ComparatorCommissionCard() {
  const query = useQuery({ queryKey: ["comparator-commissions"], queryFn: () => adminApi.getComparatorCommissions() });
  const data = query.data;
  const example = data?.comparators.find(c => c.current)?.current;

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {query.isError ? (
          <p className="text-sm text-destructive">{describeError(query.error)}</p>
        ) : !data ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <>
            <ul>
              {data.comparators.map(c => (
                <ComparatorRow key={`${c.key}:${c.current?.effectiveFrom ?? ""}:${c.current?.rateBp ?? ""}`} comparator={c} today={data.today} />
              ))}
            </ul>
            <p className="text-[13px] text-muted-foreground">{t.footnote}</p>
            {example && (
              <p className="rounded-lg bg-muted px-3 py-2 text-sm">
                <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.example}</span>
                {t.exampleLine(
                  euros(5400),
                  formatRate(example.rateBp) + (example.fixedCents ? ` − ${euros(example.fixedCents)}` : ""),
                  euros(Math.min(5400, Math.round((5400 * example.rateBp) / 10000) + example.fixedCents)),
                  euros(5400 - Math.min(5400, Math.round((5400 * example.rateBp) / 10000) + example.fixedCents)),
                )}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
