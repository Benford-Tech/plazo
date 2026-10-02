import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OnlinePayments } from "@/components/plazo/OnlinePayments";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { centsToInput, euros, parseDays, parseEuros, parseRows, quoteCents, quoteReason, type Row } from "@/lib/pricing";
import type { Pricing, PricingTier } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIMULATED_DAYS = [1, 2, 5, 10, 20];
const cell = "h-11 border border-border bg-card px-3 text-lg tabular font-mono outline-none focus-visible:border-primary aria-[invalid=true]:border-destructive";

const toRows = (p: Pricing): Row[] => p.tiers.map(t => ({ days: String(t.days), price: centsToInput(t.priceCents) }));

export default function PricingPage() {
  const queryClient = useQueryClient();
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: adminApi.getPricing });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [extra, setExtra] = useState("");
  const t = fr.plazo;

  const reset = (p: Pricing) => {
    setRows(toRows(p));
    setExtra(p.extraDayPriceCents !== null ? centsToInput(p.extraDayPriceCents) : "");
  };

  useEffect(() => {
    if (pricing.data && rows === null) reset(pricing.data);
  }, [pricing.data, rows]);

  const save = useMutation({
    mutationFn: ({ tiers, extraDayPriceCents }: { tiers: PricingTier[]; extraDayPriceCents: number | null }) => adminApi.updatePricing(tiers, extraDayPriceCents),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["pricing"], data);
      reset(data);
      toast.success(t.pricingSaved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  if (pricing.isLoading || !rows || !pricing.data) return <Skeleton className="h-[600px] w-full" />;

  const { tiers, valid } = parseRows(rows);
  const extraCents = extra.trim() ? parseEuros(extra) : null;
  const extraInvalid = extra.trim() !== "" && extraCents === null;
  const sorted = [...tiers].sort((a, b) => a.days - b.days);
  const longest = sorted.length ? sorted[sorted.length - 1].days : null;
  const dirty =
    JSON.stringify(rows) !== JSON.stringify(toRows(pricing.data)) ||
    extra !== (pricing.data.extraDayPriceCents !== null ? centsToInput(pricing.data.extraDayPriceCents) : "");
  const duplicate = new Set(tiers.map(x => x.days)).size !== tiers.length;
  const canSave = valid && !extraInvalid && !duplicate && tiers.length > 0 && !save.isPending;
  const commission = pricing.data.commissionBps;

  const update = (i: number, key: keyof Row) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  return (
    <>
      <OnlinePayments />
      <PlazoTabs right={dirty ? <span className="font-semibold uppercase text-primary">{t.unsaved}</span> : null} />
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (canSave) save.mutate({ tiers: sorted, extraDayPriceCents: extraCents });
          }}
        >
          <p className="max-w-2xl text-muted-foreground">{t.pricingIntro}</p>
          <div className="grid grid-cols-[1fr_1fr_44px] gap-2 border-b border-border pb-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{t.duration}</span>
            <span>{t.priceAll}</span>
            <span />
          </div>
          {rows.map((r, i) => {
            const daysBad = parseDays(r.days) === null;
            const priceBad = parseEuros(r.price) === null;
            return (
              <div key={i} className="grid grid-cols-[1fr_1fr_44px] items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="hidden text-muted-foreground sm:inline">{t.upTo}</span>
                    <input aria-label={`${t.duration} ${i + 1}`} inputMode="numeric" value={r.days} onChange={update(i, "days")} aria-invalid={daysBad} className={cn(cell, "w-20")} />
                    <span className="text-muted-foreground">{t.dayUnit(parseDays(r.days) ?? 2)}</span>
                  </div>
                  {daysBad && <p className="mt-1 text-sm text-destructive">{t.invalidDays}</p>}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <input aria-label={`${t.priceAll} ${i + 1}`} inputMode="decimal" value={r.price} onChange={update(i, "price")} aria-invalid={priceBad} className={cn(cell, "w-32 text-right")} />
                    <span className="text-muted-foreground">€</span>
                  </div>
                  {priceBad && <p className="mt-1 text-sm text-destructive">{t.invalidPrice}</p>}
                </div>
                <button type="button" aria-label={t.removeTier} onClick={() => setRows(rows.filter((_, j) => j !== i))} className="flex h-11 w-11 items-center justify-center border border-border text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          {duplicate && <p className="text-sm text-destructive">{fr.errors.duplicate_days}</p>}
          <button
            type="button"
            onClick={() => setRows([...rows, { days: String(Math.min((longest ?? 0) + 1, 90)), price: "" }])}
            className="h-11 self-start border border-dashed border-muted-foreground px-4 font-semibold uppercase hover:bg-accent"
          >
            {t.addTier}
          </button>
          <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-border pt-4">
            <label htmlFor="extra-day" className="text-lg">
              {longest ? t.extraDay(longest) : t.extraDayNoTier}
            </label>
            <input id="extra-day" inputMode="decimal" value={extra} onChange={e => setExtra(e.target.value)} aria-invalid={extraInvalid} className={cn(cell, "w-28 text-right")} />
            <span className="text-muted-foreground">€</span>
            {extraInvalid && <p className="w-full text-sm text-destructive">{t.invalidPrice}</p>}
          </div>
          <button type="submit" disabled={!canSave} className="mt-2 h-[50px] self-start bg-primary px-6 text-lg font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-50">
            {t.savePricing}
          </button>
        </form>

        <aside className="flex flex-col gap-3">
          <h2 className="text-lg font-bold uppercase tracking-wider">{t.simulationTitle}</h2>
          <ul className="border-t border-border">
            {SIMULATED_DAYS.map(d => {
              const cents = quoteCents(tiers, extraCents, d);
              const reason = quoteReason(tiers, extraCents, d);
              return (
                <li key={d} data-testid={`sim-${d}`} className="grid grid-cols-[56px_1fr_auto] items-baseline gap-3 border-b border-border py-2.5">
                  <span className="font-mono text-lg font-bold text-primary">{t.simDays(d)}</span>
                  <span className="text-sm text-muted-foreground">
                    {reason?.kind === "tier" ? t.simTier(reason.days) : reason?.kind === "extra" ? t.simExtra(reason.base, reason.extra, euros(extraCents!)) : t.simNone}
                  </span>
                  <span className="font-mono text-lg font-bold">{cents !== null ? euros(cents) : "—"}</span>
                </li>
              );
            })}
          </ul>
          <p className="border-l-2 border-primary pl-3 text-sm text-muted-foreground">
            {commission !== null ? t.commission((commission / 100).toLocaleString("fr-FR")) : t.commissionUnset}
          </p>
        </aside>
      </div>
    </>
  );
}
