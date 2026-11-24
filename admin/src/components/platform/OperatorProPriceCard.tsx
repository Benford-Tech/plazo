import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type PlanId, type PlatformProPrice } from "@/lib/api";
import { describeError, proPriceFr as t } from "@/lib/fr";
import { cn } from "@/lib/utils";

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** « 199 », « 199,50 » or « 199.5 » → cents; null when empty; NaN when unreadable. */
function readEuros(raw: string): number | null {
  const v = raw.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!v) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return Number.NaN;
  return Math.round(Number(v) * 100);
}

const inputCls =
  "min-h-11 w-28 rounded-[10px] border border-border bg-background px-3 font-mono text-sm";

type Setup = "grid" | "offered" | "custom";

/**
 * Plateforme › loueur › Paiements (24/11/2026, « appliquer un tarif au plan mensuel d'un parking », direction A « Prix
 * négocié »): a monthly price for one plan instead of the grid, and the setup fee (grid, offered, or another amount). A running
 * subscription of that plan moves to it at once (prorated) or from the next renewal.
 */
export function OperatorProPriceCard({ operatorId }: { operatorId: string }) {
  const queryClient = useQueryClient();
  const key = ["platform", "pro-price", operatorId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => adminApi.getOperatorProPrice(operatorId),
  });
  const [plan, setPlan] = useState<PlanId>("operations");
  const [price, setPrice] = useState("");
  const [setup, setSetup] = useState<Setup>("grid");
  const [setupAmount, setSetupAmount] = useState("");
  const [when, setWhen] = useState<"now" | "renewal">("renewal");

  // The form starts from what is saved: the agreed plan, else the subscription's, else Opérations.
  useEffect(() => {
    const d = query.data;
    if (!d) return;
    setPlan(d.agreed?.plan ?? d.subscription?.plan ?? "operations");
    setPrice(
      d.agreed?.monthlyCents != null
        ? String(d.agreed.monthlyCents / 100).replace(".", ",")
        : "",
    );
    const fee = d.agreed?.setupFeeCents ?? null;
    setSetup(fee === null ? "grid" : fee === 0 ? "offered" : "custom");
    setSetupAmount(fee && fee > 0 ? String(fee / 100).replace(".", ",") : "");
  }, [query.data]);

  const save = useMutation({
    mutationFn: (v: Parameters<typeof adminApi.setOperatorProPrice>[1]) =>
      adminApi.setOperatorProPrice(operatorId, v),
    onSuccess: (data: PlatformProPrice) => {
      queryClient.setQueryData(key, data);
      toast.success(data.applied ? t.appliedNow : t.saved);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });

  const hide = useMutation({
    mutationFn: (hidden: boolean) => adminApi.setOperatorBillingHidden(operatorId, hidden),
    onSuccess: (data: PlatformProPrice) => {
      queryClient.setQueryData(key, data);
      toast.success(data.billingHidden ? t.billingHidden : t.billingShown);
    },
    onError: (err: Error) => toast.error(describeError(err, t.errors)),
  });

  if (query.isLoading) return <Skeleton className="h-48 rounded-[14px]" />;
  if (!query.data) return null;
  const d = query.data;
  const grid = d.plans.find((p) => p.id === plan)?.gridMonthlyCents ?? 0;
  const sub = d.subscription;
  const otherPlan =
    sub?.running && sub.plan !== plan
      ? d.plans.find((p) => p.id === sub.plan)?.name
      : null;

  const submit = (toGrid = false) => {
    const monthlyCents = toGrid ? null : readEuros(price);
    const setupFeeCents =
      toGrid || setup === "grid"
        ? null
        : setup === "offered"
          ? 0
          : readEuros(setupAmount);
    if (
      Number.isNaN(monthlyCents) ||
      Number.isNaN(setupFeeCents) ||
      (setup === "custom" && !toGrid && setupFeeCents === null)
    ) {
      toast.error(t.invalid);
      return;
    }
    save.mutate({
      plan: monthlyCents === null ? null : plan,
      monthlyCents,
      setupFeeCents,
      when,
    });
  };

  return (
    <section
      className="flex flex-col gap-4 rounded-[14px] border border-border bg-card px-5 py-4"
      data-testid="pro-price-card"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-extrabold">{t.title}</h2>
        <p className="text-sm text-muted-foreground">{t.intro}</p>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          data-testid="pro-billing-hidden"
          checked={d.billingHidden}
          disabled={hide.isPending}
          onChange={(e) => hide.mutate(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#1E5E2E]"
        />
        <span className="flex flex-col">
          <span className="font-semibold">{t.hideBilling}</span>
          <span className="text-muted-foreground">{t.hideBillingHint}</span>
        </span>
      </label>

      <p className="text-sm" data-testid="pro-price-current">
        {sub ? (
          <>
            <span className="font-semibold">{t.current}</span> ·{" "}
            {d.plans.find((p) => p.id === sub.plan)?.name}{" "}
            {sub.yearly ? "annuel" : "mensuel"} ·{" "}
            {t.billedAt(`${euros(sub.priceCents)} HT`)}
            {sub.agreed && (
              <span className="ml-2 rounded-full bg-ok-soft px-2 py-0.5 text-xs font-bold text-ok-text">
                {t.agreedBadge}
              </span>
            )}
          </>
        ) : (
          <span className="text-muted-foreground">{t.none}</span>
        )}
      </p>

      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[10rem_1fr]">
        <dt className="self-center text-muted-foreground">{t.plan}</dt>
        <dd>
          <select
            aria-label={t.plan}
            data-testid="pro-price-plan"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanId)}
            className="min-h-11 rounded-[10px] border border-border bg-background px-3 text-sm"
          >
            {d.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </dd>
        <dt className="text-muted-foreground">{t.grid}</dt>
        <dd className="font-mono">{euros(grid)} HT / mois</dd>
        <dt className="self-center text-muted-foreground">{t.agreed}</dt>
        <dd className="flex items-center gap-2">
          <input
            aria-label={t.agreed}
            data-testid="pro-price-amount"
            inputMode="decimal"
            value={price}
            placeholder={String(grid / 100)}
            onChange={(e) => setPrice(e.target.value)}
            className={inputCls}
          />
          <span className="text-muted-foreground">{t.perMonth}</span>
        </dd>
        <dt className="self-center text-muted-foreground">{t.setupFee}</dt>
        <dd className="flex flex-wrap items-center gap-2">
          {(["grid", "offered", "custom"] as Setup[]).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={setup === s}
              data-testid={`pro-price-setup-${s}`}
              onClick={() => setSetup(s)}
              className={cn(
                "min-h-9 rounded-full border px-3 text-sm",
                setup === s
                  ? "border-primary bg-primary font-semibold text-primary-foreground"
                  : "border-border",
              )}
            >
              {s === "grid"
                ? t.setupGrid(euros(d.gridSetupFeeCents))
                : s === "offered"
                  ? t.setupOffered
                  : t.setupCustom}
            </button>
          ))}
          {setup === "custom" && (
            <input
              aria-label={t.setupCustom}
              data-testid="pro-price-setup-amount"
              inputMode="decimal"
              value={setupAmount}
              onChange={(e) => setSetupAmount(e.target.value)}
              className={inputCls}
            />
          )}
          {d.setupFeePaid && (
            <span className="text-xs text-muted-foreground">{t.setupPaid}</span>
          )}
        </dd>
        {sub?.running && (
          <>
            <dt className="text-muted-foreground">{t.when}</dt>
            <dd className="flex flex-wrap gap-4">
              {(["now", "renewal"] as const).map((w) => (
                <label key={w} className="flex min-h-9 items-center gap-2">
                  <input
                    type="radio"
                    name={`when-${operatorId}`}
                    checked={when === w}
                    onChange={() => setWhen(w)}
                  />
                  {w === "now" ? t.now : t.renewal}
                </label>
              ))}
            </dd>
          </>
        )}
      </dl>

      {otherPlan && (
        <p className="text-sm text-warn-text">{t.otherPlan(otherPlan)}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="pro-price-apply"
          disabled={save.isPending}
          onClick={() => submit()}
          className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-60"
        >
          {t.apply}
        </button>
        {d.agreed && (
          <button
            type="button"
            data-testid="pro-price-grid"
            disabled={save.isPending}
            onClick={() => submit(true)}
            className="min-h-11 rounded-full border border-border px-5 text-sm hover:bg-accent"
          >
            {t.backToGrid}
          </button>
        )}
      </div>
    </section>
  );
}
