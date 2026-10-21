import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { EXTRA_ICONS } from "@/lib/extras";
import { describeError, extrasFr } from "@/lib/fr";
import { centsToInput, euros, parseEuros } from "@/lib/pricing";
import type { ExtraKind, ExtraSettings, Parking } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = extrasFr.settings;

type Row = { kind: ExtraKind; label: string; description: string; enabled: boolean; price: string; defaultPriceCents: number };
type Form = { leadHours: string; rows: Row[] };

const formOf = (s: ExtraSettings): Form => ({
  leadHours: String(s.leadHours),
  rows: s.offers.map(o => ({
    kind: o.kind,
    label: o.label,
    description: o.description,
    enabled: o.enabled,
    price: centsToInput(o.priceCents),
    defaultPriceCents: o.defaultPriceCents,
  })),
});

/** Checks the form like the server (1 € to 1 000 €, 0 to 168 h); errors keyed like its `fields`. */
function checkForm(form: Form): Record<string, string> {
  const errors: Record<string, string> = {};
  const hours = Number(form.leadHours);
  if (!/^\d+$/.test(form.leadHours.trim()) || hours > 168) errors.leadHours = t.errors.leadHours;
  for (const row of form.rows) {
    const cents = parseEuros(row.price);
    if (cents === null) errors[`offers.${row.kind}.priceCents`] = t.errors.price;
    else if (cents < 100 || cents > 100000) errors[`offers.${row.kind}.priceCents`] = t.errors.range;
  }
  return errors;
}

/**
 * « Services additionnels » of Parking › Réglages (21/10/2026, direction P): each service on or off at the parking's
 * price, and how long before the return the travellers may still order them.
 */
export function ExtrasSettingsCard({ parking }: { parking: Parking }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["extras-settings", parking.id], queryFn: () => adminApi.getExtraSettings(parking.id) });
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => {
    if (query.data) setForm(formOf(query.data));
  }, [query.data]);

  const save = useMutation({
    mutationFn: (f: Form) =>
      adminApi.updateExtraSettings(parking.id, {
        leadHours: Number(f.leadHours),
        offers: f.rows.map(r => ({ kind: r.kind, enabled: r.enabled, priceCents: parseEuros(r.price)! })),
      }),
    onSuccess: data => {
      queryClient.setQueryData(["extras-settings", parking.id], data);
      setErrors({});
      toast.success(t.saved);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fields) {
        const fields: Record<string, string> = {};
        for (const [key, code] of Object.entries(err.fields)) {
          fields[key] = key === "leadHours" ? t.errors.leadHours : code === "range" ? t.errors.range : t.errors.price;
        }
        setErrors(fields);
      }
      toast.error(describeError(err));
    },
  });

  const submit = () => {
    if (!form) return;
    const found = checkForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    save.mutate(form);
  };
  const setRow = (kind: ExtraKind, patch: Partial<Row>) =>
    setForm(f => (f ? { ...f, rows: f.rows.map(r => (r.kind === kind ? { ...r, ...patch } : r)) } : f));

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        {!form ? (
          query.isError ? (
            <p className="text-sm text-bad-text">{describeError(query.error)}</p>
          ) : (
            <Skeleton className="h-40 w-full" />
          )
        ) : (
          <>
            <ul className="divide-y divide-panel-line rounded-xl border border-panel-line">
              {form.rows.map(row => {
                const Icon = EXTRA_ICONS[row.kind];
                const priceError = errors[`offers.${row.kind}.priceCents`];
                return (
                  <li key={row.kind} data-testid={`extra-${row.kind}`} className="flex flex-wrap items-center gap-3 p-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime/15 text-lime-deep">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                      <span className="text-[15px] font-semibold">{row.label}</span>
                      <span className="text-[13px] text-muted-foreground">{row.description}</span>
                      <span className="text-xs text-muted-foreground">{t.defaultPrice(euros(row.defaultPriceCents))}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-2">
                        <span className="relative">
                          <input
                            id={`extra-price-${row.kind}`}
                            aria-label={t.priceLabel(row.label)}
                            inputMode="decimal"
                            value={row.price}
                            onChange={e => setRow(row.kind, { price: e.target.value })}
                            aria-invalid={!!priceError}
                            className={cn(
                              "h-10 w-24 rounded-lg border bg-panel pl-2 pr-6 text-right font-mono text-sm",
                              priceError ? "border-bad" : "border-panel-line",
                            )}
                          />
                          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.enabled}
                          aria-label={t.offered(row.label)}
                          onClick={() => setRow(row.kind, { enabled: !row.enabled })}
                          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full"
                        >
                          <span
                            className={cn(
                              "flex h-7 w-[46px] items-center rounded-full border-2 px-[1px] transition-colors",
                              row.enabled ? "justify-end border-lime bg-lime" : "justify-start border-muted-foreground bg-panel",
                            )}
                          >
                            <span
                              className={cn(
                                "rounded-full",
                                row.enabled ? "h-[22px] w-[22px] bg-panel shadow-[0_1px_3px_rgba(0,0,0,0.2)]" : "ml-[2px] h-4 w-4 bg-muted-foreground",
                              )}
                            />
                          </span>
                        </button>
                      </span>
                      {priceError && <span className="text-xs text-bad-text">{priceError}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <label htmlFor="extras-lead-hours">{t.leadHours}</label>
              <input
                id="extras-lead-hours"
                inputMode="numeric"
                value={form.leadHours}
                onChange={e => setForm({ ...form, leadHours: e.target.value })}
                aria-invalid={!!errors.leadHours}
                className={cn("h-10 w-16 rounded-lg border bg-panel px-2 text-right font-mono", errors.leadHours ? "border-bad" : "border-panel-line")}
              />
              <span>{t.leadHoursUnit}</span>
              {errors.leadHours && <span className="w-full text-xs text-bad-text">{errors.leadHours}</span>}
            </div>
            <p className="rounded-lg bg-panel-2 px-3.5 py-3 text-[13px] text-muted-foreground">
              {t.commission} {t.refundNote}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                data-testid="extras-save"
                disabled={save.isPending}
                onClick={submit}
                className="flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
              >
                {t.save}
              </button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
