import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { OnlinePayments } from "@/components/plazo/OnlinePayments";
import { PlazoTabs } from "@/components/plazo/PlazoTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import {
  centsToInput,
  euros,
  NIGHT_TIMES,
  nightExamples,
  nightFees,
  nightRule,
  parseDays,
  parseEuros,
  parseNightForm,
  parseRows,
  quoteCents,
  quoteReason,
  toNightForm,
  type NightExample,
  type NightForm,
  type NightFormErrors,
  type Row,
} from "@/lib/pricing";
import type { NightSettings, Pricing, PricingTier } from "@/lib/types";
import { cn } from "@/lib/utils";

const SIMULATED_DAYS = [1, 2, 5, 10, 20];
const cell = "h-11 border border-border bg-card px-3 text-lg tabular font-mono outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive";
// The night fees card (12/10/2026) is drawn in C-B: rounded fields, mono figures.
const nightCell =
  "h-11 rounded-[10px] border border-border bg-panel px-3 font-mono text-[15px] font-semibold tabular outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive";
const kicker = "text-[12.5px] font-semibold uppercase tracking-[0.06em]";

const toRows = (p: Pricing): Row[] => p.tiers.map(t => ({ days: String(t.days), price: centsToInput(t.priceCents) }));

type Reason = ReturnType<typeof quoteReason>;

function reasonText(reason: Reason, extraCents: number | null): string {
  const t = fr.plazo;
  if (reason?.kind === "tier") return t.simTier(reason.days);
  if (reason?.kind === "extra") return t.simExtra(reason.base, reason.extra, euros(extraCents!));
  return t.simNone;
}

/** « dépôt à 23:30 », « retour à 05:30 » or both, the times in mono. */
function NightTimes({ example }: { example: NightExample }) {
  const t = fr.plazo;
  return (
    <>
      {example.arrival && (
        <>
          {t.simNightArrival} <span className="font-mono">{example.arrival}</span>
        </>
      )}
      {example.arrival && example.return && ` ${t.simNightAnd} `}
      {example.return && (
        <>
          {t.simNightReturn} <span className="font-mono">{example.return}</span>
        </>
      )}
    </>
  );
}

/** The half-hour times, plus a saved one off the grid (set before, or by the API). */
const timeOptions = (value: string) => (NIGHT_TIMES.includes(value) ? NIGHT_TIMES : [...NIGHT_TIMES, value].sort());

type NightField = "end" | "arrivalFee" | "returnFee";

/**
 * « Frais de nuit » (12/10/2026, direction B): one window for drop-offs and returns, a fee for each side. Switched off,
 * the values typed stay in the form and are saved as they are, so that switching back on restores them.
 * A field shows its error once the operator has changed or left it: switched on with no amount yet, the card stays calm
 * and only says, in grey, that an amount is needed (the save button is disabled meanwhile).
 */
function NightFeesCard({ form, onChange }: { form: NightForm; onChange: (form: NightForm) => void }) {
  const t = fr.plazo;
  const [touched, setTouched] = useState<ReadonlySet<NightField>>(new Set());
  const touch = (field: NightField) => setTouched(prev => (prev.has(field) ? prev : new Set(prev).add(field)));
  const { errors: allErrors } = parseNightForm(form);
  const feesTouched = touched.has("arrivalFee") || touched.has("returnFee");
  const feeRequired = allErrors.arrivalFee === "fee_required";
  const errors: NightFormErrors = {
    end: touched.has("end") ? allErrors.end : undefined,
    arrivalFee: touched.has("arrivalFee") || (feeRequired && feesTouched) ? allErrors.arrivalFee : undefined,
    returnFee: touched.has("returnFee") || (feeRequired && feesTouched) ? allErrors.returnFee : undefined,
  };
  const set = (key: keyof NightForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    // The same hour twice is reported under the end, whichever of the two was changed.
    if (key === "start" || key === "end") touch("end");
    else if (key === "arrivalFee" || key === "returnFee") touch(key);
    onChange({ ...form, [key]: e.target.value });
  };
  return (
    <section aria-labelledby="night-title" className={cn("mt-2 flex flex-col gap-3.5 rounded-lg bg-panel px-[22px] py-5", form.enabled ? "border-[1.5px] border-lime" : "border border-panel-line")}>
      <div className="flex items-center gap-3">
        {/* A 44 px tap target around the 46 × 28 track; the off track is outlined so that it reads on the white card. */}
        <button
          type="button"
          role="switch"
          aria-checked={form.enabled}
          aria-label={t.nightSwitch}
          onClick={() => onChange({ ...form, enabled: !form.enabled })}
          className="-my-2 flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full"
        >
          <span
            className={cn(
              "flex h-7 w-[46px] items-center rounded-full border-2 px-[1px] transition-colors",
              form.enabled ? "justify-end border-lime bg-lime" : "justify-start border-muted-foreground bg-panel",
            )}
          >
            <span className={cn("rounded-full", form.enabled ? "h-[22px] w-[22px] bg-panel shadow-[0_1px_3px_rgba(0,0,0,0.2)]" : "ml-[2px] h-4 w-4 bg-muted-foreground")} />
          </span>
        </button>
        <h2 id="night-title" className="flex-1 text-lg font-bold">
          {t.night}
        </h2>
        <span className="rounded-full bg-lime/15 px-[9px] py-1 text-[11px] font-extrabold uppercase tracking-[0.1em] text-lime-deep">{t.nightNew}</span>
      </div>
      {form.enabled ? (
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="font-semibold">{t.nightFrom}</span>
            <select aria-label={t.nightStart} value={form.start} onChange={set("start")} className={nightCell}>
              {timeOptions(form.start).map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            <span className="font-semibold">{t.nightTo}</span>
            <select aria-label={t.nightEnd} value={form.end} onChange={set("end")} aria-invalid={!!errors.end} className={nightCell}>
              {timeOptions(form.end).map(time => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
            {errors.end && <p className="w-full text-sm text-destructive">{t.nightErrors[errors.end]}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["arrivalFee", "night-arrival-fee", t.nightArrival],
                ["returnFee", "night-return-fee", t.nightReturn],
              ] as const
            ).map(([key, id, label]) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label htmlFor={id} className={cn(kicker, "text-muted-foreground")}>
                  {label}
                </label>
                <span className="flex items-center gap-2">
                  <input
                    id={id}
                    inputMode="decimal"
                    placeholder="0,00"
                    value={form[key]}
                    onChange={set(key)}
                    onBlur={() => touch(key)}
                    aria-invalid={!!errors[key]}
                    className={cn(nightCell, "w-[110px] min-w-0 text-right")}
                  />
                  <span className="text-muted-foreground">€</span>
                </span>
                {errors[key] === "invalid_fee" && <p className="text-sm text-destructive">{t.nightErrors.invalid_fee}</p>}
              </div>
            ))}
          </div>
          {feeRequired && <p className={cn("text-sm", feesTouched ? "text-destructive" : "text-muted-foreground")}>{t.nightErrors.fee_required}</p>}
          <p className="text-muted-foreground">{t.nightHelp(form.start, form.end)}</p>
          <p className="text-sm text-muted-foreground">{t.nightScope}</p>
        </>
      ) : (
        <p className="text-muted-foreground">{t.nightOff}</p>
      )}
    </section>
  );
}

export default function PricingPage() {
  const queryClient = useQueryClient();
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: adminApi.getPricing });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [extra, setExtra] = useState("");
  const [night, setNight] = useState<NightForm>(toNightForm(null));
  const t = fr.plazo;

  const reset = (p: Pricing) => {
    setRows(toRows(p));
    setExtra(p.extraDayPriceCents !== null ? centsToInput(p.extraDayPriceCents) : "");
    setNight(toNightForm(p.night));
  };

  useEffect(() => {
    if (pricing.data && rows === null) reset(pricing.data);
  }, [pricing.data, rows]);

  const save = useMutation({
    mutationFn: ({ tiers, extraDayPriceCents, night }: { tiers: PricingTier[]; extraDayPriceCents: number | null; night: NightSettings }) =>
      adminApi.updatePricing(tiers, extraDayPriceCents, night),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["pricing"], data);
      reset(data);
      toast.success(t.pricingSaved);
    },
    // A field's own reason (same night times, no night fee…) rather than « some fields need fixing ».
    onError: (err: Error) => {
      const code = err instanceof ApiError && err.fields ? Object.values(err.fields).find(c => c in fr.errors) : undefined;
      toast.error(code ? errorMessage(code) : describeError(err));
    },
  });

  if (pricing.isLoading || !rows || !pricing.data) return <Skeleton className="h-[600px] w-full" />;

  const { tiers, valid } = parseRows(rows);
  const extraCents = extra.trim() ? parseEuros(extra) : null;
  const extraInvalid = extra.trim() !== "" && extraCents === null;
  const sorted = [...tiers].sort((a, b) => a.days - b.days);
  const longest = sorted.length ? sorted[sorted.length - 1].days : null;
  const nightSettings = parseNightForm(night).settings;
  // The rule as typed, for the simulation: none while switched off or invalid.
  const rule = nightRule(nightSettings);
  const dirty =
    JSON.stringify(rows) !== JSON.stringify(toRows(pricing.data)) ||
    extra !== (pricing.data.extraDayPriceCents !== null ? centsToInput(pricing.data.extraDayPriceCents) : "") ||
    JSON.stringify(night) !== JSON.stringify(toNightForm(pricing.data.night));
  const duplicate = new Set(tiers.map(x => x.days)).size !== tiers.length;
  const canSave = valid && !extraInvalid && !duplicate && tiers.length > 0 && nightSettings !== null && !save.isPending;
  const commission = pricing.data.commissionBps;
  const pct = commission !== null ? (commission / 100).toLocaleString("fr-FR") : null;

  const update = (i: number, key: keyof Row) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: e.target.value } : r)));

  return (
    <>
      <OnlinePayments />
      <PlazoTabs right={dirty ? <span className="font-semibold uppercase text-lime-deep">{t.unsaved}</span> : null} />
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <form
          className="flex flex-col gap-4"
          onSubmit={e => {
            e.preventDefault();
            if (canSave && nightSettings) save.mutate({ tiers: sorted, extraDayPriceCents: extraCents, night: nightSettings });
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
          <NightFeesCard form={night} onChange={setNight} />
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
                  <span className="font-mono text-lg font-bold text-lime-deep">{t.simDays(d)}</span>
                  <span className="text-sm text-muted-foreground">{reasonText(reason, extraCents)}</span>
                  <span className="font-mono text-lg font-bold">{cents !== null ? euros(cents) : "—"}</span>
                </li>
              );
            })}
          </ul>
          {rule && (
            <>
              <h3 className={cn(kicker, "mt-3 text-lime-deep")}>{t.simNightTitle}</h3>
              <ul className="border-t border-border">
                {nightExamples(rule).map(example => {
                  const base = quoteCents(tiers, extraCents, example.days);
                  const reason = quoteReason(tiers, extraCents, example.days);
                  const fee = nightFees(rule, example.arrival, example.return);
                  return (
                    <li key={example.key} data-testid={`sim-night-${example.key}`} className="grid grid-cols-[56px_1fr_auto] items-baseline gap-3 border-b border-border py-2.5">
                      <span className="font-mono text-lg font-bold text-lime-deep">{t.simDays(example.days)}</span>
                      <span className="text-sm text-muted-foreground">
                        {reason ? (
                          <>
                            {reasonText(reason, extraCents)} + <NightTimes example={example} />
                          </>
                        ) : (
                          t.simNone
                        )}
                      </span>
                      <span className="font-mono text-lg font-bold">{base !== null ? euros(base + (fee?.totalCents ?? 0)) : "—"}</span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <p className="border-l-2 border-lime-deep pl-3 text-sm text-muted-foreground">
            {pct !== null ? (rule ? t.commissionNight(pct) : t.commission(pct)) : rule ? t.commissionUnsetNight : t.commissionUnset}
          </p>
        </aside>
      </div>
    </>
  );
}
