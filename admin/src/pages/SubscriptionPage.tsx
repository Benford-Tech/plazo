import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { StripeForm, type StripeFormResult } from "@/components/subscription/StripeForm";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, type PlanId, type SubscriptionView } from "@/lib/api";
import { describeError, subscriptionFr as t } from "@/lib/fr";
import { PLAZO_PLANS } from "@/lib/pro-plans";
import { cn } from "@/lib/utils";

const card = "flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5";
const euros = (cents: number) => (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" }) : "—");
const withVat = (cents: number, percent: number) => cents + Math.round((cents * percent) / 100);
const isPlan = (v: string | null): v is PlanId => v === "essentiel" || v === "operations" || v === "complet";

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active" || status === "trialing"
      ? "bg-ok-soft text-ok-text"
      : status === "past_due" || status === "unpaid" || status === "incomplete_expired"
        ? "bg-bad-soft text-bad-text"
        : "bg-warn-soft text-warn-text";
  return <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", tone)}>{t.status[status] ?? status}</span>;
}

function methodLabel(pm: NonNullable<SubscriptionView["subscription"]>["paymentMethod"]) {
  if (!pm || !pm.last4) return t.noMethod;
  if (pm.type === "sepa_debit") return t.sepa(pm.last4);
  const brand = pm.brand ? pm.brand[0].toUpperCase() + pm.brand.slice(1) : "Carte";
  return t.card(brand, pm.last4);
}

/**
 * « Abonnement Plazo Pro » (17/11/2026, direction B « Tout dans Plazo », with the setup fee): the plans, the first payment
 * with Stripe's Payment Element (card or SEPA), prorated changes of plan, the payment method, the invoices and the
 * cancellation at the end of the paid period, all in Plazo. Managers only; read only in consultation.
 */
export default function SubscriptionPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const view = useQuery({ queryKey: ["subscription"], queryFn: adminApi.getSubscription });
  const invoices = useQuery({
    queryKey: ["subscription-invoices"],
    queryFn: adminApi.subscriptionInvoices,
    enabled: !!view.data?.subscription,
  });
  const [yearly, setYearly] = useState(params.get("annuel") === "1");
  const [chosen, setChosen] = useState<PlanId | null>(isPlan(params.get("formule")) ? (params.get("formule") as PlanId) : null);
  const [checkout, setCheckout] = useState<{ clientSecret: string; totalCents: number } | null>(null);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const refresh = (next?: SubscriptionView) => {
    if (next) qc.setQueryData(["subscription"], next);
    void qc.invalidateQueries({ queryKey: ["subscription"] });
    void qc.invalidateQueries({ queryKey: ["subscription-invoices"] });
  };

  // Back from a payment method that left the page (a bank's page): read the result back once.
  useEffect(() => {
    const setupIntent = params.get("setup_intent");
    const paid = params.get("payment_intent");
    if (!setupIntent && !paid) return;
    const status = params.get("redirect_status");
    setParams({}, { replace: true });
    const done = setupIntent && status === "succeeded" ? adminApi.confirmSubscriptionPaymentMethod(setupIntent) : adminApi.syncSubscription();
    done.then((v) => refresh(v)).catch((e) => toast.error(describeError(e, t.errors)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sub = view.data?.subscription ?? null;
  const running = !!sub?.running;
  const target = chosen && (!sub || !running || chosen !== sub.plan || yearly !== sub.yearly) ? chosen : null;

  const preview = useQuery({
    queryKey: ["subscription-preview", target, yearly],
    queryFn: () => adminApi.previewSubscriptionChange(target!, yearly),
    enabled: running && !!target,
    retry: false,
  });

  const start = useMutation({
    mutationFn: () => adminApi.subscribe(target!, yearly),
    onSuccess: (r) => {
      if (r.clientSecret) setCheckout({ clientSecret: r.clientSecret, totalCents: r.totalCents });
      refresh();
    },
    onError: (e) => toast.error(describeError(e, t.errors)),
  });
  const change = useMutation({
    mutationFn: () => adminApi.changeSubscription(target!, yearly),
    onSuccess: (v) => {
      toast.success(t.changed);
      setChosen(null);
      refresh(v);
    },
    onError: (e) => toast.error(describeError(e, t.errors)),
  });
  const newMethod = useMutation({
    mutationFn: adminApi.subscriptionPaymentMethod,
    onSuccess: (r) => setSetupSecret(r.clientSecret),
    onError: (e) => toast.error(describeError(e, t.errors)),
  });
  const cancel = useMutation({
    mutationFn: (stop: boolean) => (stop ? adminApi.cancelSubscription() : adminApi.resumeSubscription()),
    onSuccess: (v, stop) => {
      toast.success(stop ? t.cancelled : t.resumed);
      refresh(v);
    },
    onError: (e) => toast.error(describeError(e, t.errors)),
  });

  const paid = async (r: StripeFormResult) => {
    if (r.kind !== "payment") return;
    const v = await adminApi.syncSubscription();
    setCheckout(null);
    setChosen(null);
    if (r.status === "succeeded") toast.success(t.subscribed);
    else setProcessing(true);
    refresh(v);
  };
  const methodDone = async (r: StripeFormResult) => {
    if (r.kind !== "setup") return;
    const v = await adminApi.confirmSubscriptionPaymentMethod(r.setupIntentId);
    setSetupSecret(null);
    toast.success(t.methodSaved);
    refresh(v);
  };

  if (view.isLoading) return <Skeleton className="h-96 w-full" />;
  if (view.isError || !view.data) return <p className="text-bad-text">{describeError(view.error)}</p>;
  const d = view.data;
  const vat = d.vatPercent;
  const planInfo = (id: PlanId) => d.plans.find((p) => p.id === id)!;
  const priceOf = (id: PlanId, y: boolean) => (y ? planInfo(id).yearlyCents : planInfo(id).monthlyCents);
  const pitch = (id: PlanId) => PLAZO_PLANS.find((p) => p.id === id)?.pitch ?? "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold">{t.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.intro}</p>
      </div>

      {!d.available && (
        <p className={cn(card, "text-sm")} data-testid="subscription-unavailable">
          {d.refusal === "test_operator" ? t.testOperator : t.unavailable}
        </p>
      )}

      {sub && (sub.status === "past_due" || sub.status === "unpaid") && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-bad-soft p-4 text-sm text-bad-text" data-testid="subscription-past-due">
          <span className="font-semibold">{t.pastDue}</span>
          {d.available && (
            <button type="button" onClick={() => newMethod.mutate()} className="min-h-11 rounded-full bg-bad px-4 font-bold text-white">
              {t.updateMethod}
            </button>
          )}
        </div>
      )}
      {processing && <p className="rounded-[14px] bg-warn-soft p-4 text-sm text-warn-text">{t.processing}</p>}

      {sub && (
        <section className={cn(card, "sm:flex-row sm:flex-wrap sm:items-center sm:justify-between")} aria-labelledby="sub-state" data-testid="subscription-state">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="sub-state" className="text-xl font-extrabold">
                {planInfo(sub.plan).name}
              </h2>
              <StatusPill status={sub.status} />
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold">{sub.yearly ? t.yearly : t.monthly}</span>
            </div>
            <p className="text-sm">
              {euros(sub.priceCents)} {sub.yearly ? t.perYear : t.perMonth} · {t.ttc(euros(withVat(sub.priceCents, vat)))}
            </p>
            {running && (
              <p className="text-sm text-muted-foreground">
                {sub.cancelAtPeriodEnd ? t.endsOn(day(sub.currentPeriodEnd)) : t.nextCharge(day(sub.currentPeriodEnd))} · {methodLabel(sub.paymentMethod)}
              </p>
            )}
            {sub.status === "incomplete" && <p className="text-sm text-warn-text">{t.incomplete}</p>}
          </div>
        </section>
      )}

      {d.available && (
        <section className="flex flex-col gap-4" aria-labelledby="sub-plans">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="sub-plans" className="text-lg font-extrabold">
              {running ? t.changeTitle : t.plansTitle}
            </h2>
            <div role="group" aria-label={t.billing} className="flex rounded-full border border-border bg-card p-1 text-sm font-semibold">
              {[false, true].map((y) => (
                <button
                  key={String(y)}
                  type="button"
                  aria-pressed={yearly === y}
                  onClick={() => {
                    setYearly(y);
                    setCheckout(null);
                  }}
                  className={cn("min-h-9 rounded-full px-4", yearly === y ? "bg-lime-deep text-white" : "text-foreground")}
                >
                  {y ? t.yearly : t.monthly}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {d.plans.map((p) => {
              const current = running && sub!.plan === p.id && sub!.yearly === yearly;
              const selected = target === p.id;
              return (
                <article
                  key={p.id}
                  data-testid={`plan-${p.id}`}
                  className={cn("flex flex-col gap-2 rounded-[14px] border bg-card p-5", selected || current ? "border-2 border-primary" : "border-border")}
                >
                  <h3 className="text-lg font-extrabold">{p.name}</h3>
                  <p className="text-2xl font-extrabold">
                    {euros(yearly ? p.yearlyCents : p.monthlyCents)}{" "}
                    <span className="text-sm font-medium text-muted-foreground">{yearly ? t.perYear : t.perMonth}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{pitch(p.id)}</p>
                  {current ? (
                    <span className="mt-auto flex min-h-11 items-center justify-center rounded-full bg-muted font-bold">{t.yourPlan}</span>
                  ) : (
                    <button
                      type="button"
                      data-testid={`choose-${p.id}`}
                      onClick={() => {
                        setChosen(p.id);
                        setCheckout(null);
                      }}
                      className={cn(
                        "mt-auto min-h-11 rounded-full font-bold",
                        selected ? "bg-primary text-primary-foreground" : "border border-lime-deep text-lime-deep hover:bg-accent",
                      )}
                    >
                      {running ? t.switchTo(p.name) : t.choose(p.name)}
                    </button>
                  )}
                </article>
              );
            })}
          </div>

          {!running && target && (
            <section className={card} aria-labelledby="sub-checkout" data-testid="subscription-checkout">
              <h3 id="sub-checkout" className="text-lg font-extrabold">
                {t.checkoutTitle(planInfo(target).name)}
              </h3>
              {(() => {
                const plan = priceOf(target, yearly);
                const setup = d.setupFeeDue ? d.setupFeeCents : 0;
                const ht = plan + setup;
                const tax = withVat(ht, vat) - ht;
                return (
                  <dl className="grid gap-1.5 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt>{t.planLine(planInfo(target).name, yearly)}</dt>
                      <dd className="font-mono">{euros(plan)} HT</dd>
                    </div>
                    {setup > 0 && (
                      <div className="flex justify-between gap-3">
                        <dt>{t.setupLine}</dt>
                        <dd className="font-mono">{euros(setup)} HT</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <dt>{t.vatLine(vat)}</dt>
                      <dd className="font-mono">{euros(tax)}</dd>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-border pt-2 font-extrabold">
                      <dt>{t.totalNow}</dt>
                      <dd className="font-mono" data-testid="checkout-total">
                        {euros(checkout?.totalCents ?? ht + tax)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3 text-muted-foreground">
                      <dt>{t.thenEach(yearly)}</dt>
                      <dd className="font-mono">{euros(withVat(plan, vat))}</dd>
                    </div>
                  </dl>
                );
              })()}
              {checkout && d.publishableKey ? (
                <StripeForm
                  publishableKey={d.publishableKey}
                  clientSecret={checkout.clientSecret}
                  mode="payment"
                  submitLabel={t.pay(euros(checkout.totalCents))}
                  onDone={paid}
                />
              ) : (
                <button
                  type="button"
                  data-testid="subscription-continue"
                  disabled={start.isPending}
                  onClick={() => start.mutate()}
                  className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
                >
                  {t.continue}
                </button>
              )}
              <p className="text-xs text-muted-foreground">{t.methodHint}</p>
            </section>
          )}

          {running && target && (
            <section className={card} aria-labelledby="sub-change" data-testid="subscription-change">
              <h3 id="sub-change" className="text-lg font-extrabold">
                {t.previewTitle(planInfo(target).name)}
              </h3>
              {preview.isLoading && <Skeleton className="h-16 w-full" />}
              {preview.isError && <p className="text-sm text-bad-text">{describeError(preview.error, t.errors)}</p>}
              {preview.data && (
                <dl className="grid gap-1.5 text-sm">
                  {preview.data.chargedNow ? (
                    <div className="flex justify-between gap-3 font-extrabold">
                      <dt>{t.dueNow}</dt>
                      <dd className="font-mono">{euros(preview.data.dueNowCents)}</dd>
                    </div>
                  ) : (
                    <p>{t.fromRenewal(day(preview.data.effectiveAt))}</p>
                  )}
                  <div className="flex justify-between gap-3 text-muted-foreground">
                    <dt>{t.nextPrice}</dt>
                    <dd className="font-mono">
                      {euros(preview.data.nextCents)} TTC {yearly ? "/ an" : "/ mois"}
                    </dd>
                  </div>
                </dl>
              )}
              <button
                type="button"
                data-testid="subscription-confirm-change"
                disabled={!preview.data || change.isPending}
                onClick={() => change.mutate()}
                className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
              >
                {t.confirmChange}
              </button>
            </section>
          )}
        </section>
      )}

      {sub && d.available && (
        <section className={card} aria-labelledby="sub-method">
          <h2 id="sub-method" className="text-lg font-extrabold">
            {t.methodTitle}
          </h2>
          <p className="text-sm">{methodLabel(sub.paymentMethod)}</p>
          {setupSecret && d.publishableKey ? (
            <StripeForm publishableKey={d.publishableKey} clientSecret={setupSecret} mode="setup" submitLabel={t.saveMethod} onDone={methodDone} />
          ) : (
            <button
              type="button"
              onClick={() => newMethod.mutate()}
              disabled={newMethod.isPending}
              className="min-h-11 self-start rounded-full border border-lime-deep px-5 font-semibold text-lime-deep hover:bg-accent disabled:opacity-50"
            >
              {t.changeMethod}
            </button>
          )}
          <p className="text-xs text-muted-foreground">{t.methodHint}</p>
        </section>
      )}

      {sub && (
        <section className={card} aria-labelledby="sub-invoices">
          <h2 id="sub-invoices" className="text-lg font-extrabold">
            {t.invoicesTitle}
          </h2>
          {invoices.isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : !invoices.data?.data.length ? (
            <p className="text-sm text-muted-foreground">{t.invoicesEmpty}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm" data-testid="subscription-invoices">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="p-2">{t.headers.date}</th>
                    <th className="p-2">{t.headers.number}</th>
                    <th className="p-2">{t.headers.total}</th>
                    <th className="p-2">{t.headers.status}</th>
                    <th className="p-2" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.data.data.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="p-2 font-mono">{day(i.date)}</td>
                      <td className="p-2">{i.number ?? "—"}</td>
                      <td className="p-2 font-mono">{euros(i.totalCents)}</td>
                      <td className="p-2">{(i.status && t.invoiceStatus[i.status]) ?? i.status ?? "—"}</td>
                      <td className="p-2">
                        {(i.pdfUrl || i.url) && (
                          <a href={i.pdfUrl ?? i.url!} target="_blank" rel="noreferrer" className="font-semibold text-lime-deep underline-offset-2 hover:underline">
                            {t.pdf}
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {sub && running && d.available && (
        <section className={cn(card, "sm:flex-row sm:items-center sm:justify-between")} aria-labelledby="sub-cancel">
          <div>
            <h2 id="sub-cancel" className="text-base font-extrabold">
              {t.cancelTitle}
            </h2>
            <p className="text-sm text-muted-foreground">{t.cancelText(day(sub.currentPeriodEnd))}</p>
          </div>
          {sub.cancelAtPeriodEnd ? (
            <button
              type="button"
              onClick={() => cancel.mutate(false)}
              disabled={cancel.isPending}
              className="min-h-11 rounded-full bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"
            >
              {t.resume}
            </button>
          ) : (
            <button
              type="button"
              data-testid="subscription-cancel"
              disabled={cancel.isPending}
              onClick={async () => {
                if (await confirm(t.cancelConfirm, { title: t.cancelTitle, confirmLabel: t.cancelTitle, destructive: true })) cancel.mutate(true);
              }}
              className="min-h-11 rounded-full border border-bad px-5 font-bold text-bad-text disabled:opacity-50"
            >
              {t.cancel}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
