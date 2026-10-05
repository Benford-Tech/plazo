import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { percent } from "@/lib/platform";
import { can } from "@/lib/roles";
import type { PaymentStatus, PayoutSchedule } from "@/lib/types";
import { RECOMMENDED_SCHEDULE, SCHEDULES, stripeNavigation } from "@/lib/payments";
import { cn } from "@/lib/utils";

const kicker = "text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground";
const primaryButton = "min-h-11 self-start bg-primary px-4 font-bold uppercase tracking-wide text-primary-foreground hover:brightness-110 disabled:opacity-50";

/**
 * "Paiements en ligne" (K-A): the operator connects its Stripe account and chooses when it receives
 * its money, at the top of the "Sur Plazo" pages. Managers only; read-only in a platform admin's
 * view-as session (the API refuses those writes too).
 */
export function OnlinePayments() {
  const { user } = useAuth();
  const manager = can(user?.role, "parking:manage");
  const readOnly = !!user?.viewAs;
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const t = fr.payments;

  const status = useQuery({
    queryKey: ["payments", "status"],
    queryFn: adminApi.getPaymentStatus,
    enabled: manager,
  });
  const enabled = !!status.data?.enabled;
  const settings = useQuery({
    queryKey: ["payments", "settings"],
    queryFn: adminApi.getPayoutSettings,
    enabled: manager && enabled,
  });

  // Back from Stripe: ?stripe=retour (onboarding sent) or ?stripe=relance (the link expired).
  const handled = useRef(false);
  const back = params.get("stripe");
  useEffect(() => {
    if (!back || handled.current) return;
    handled.current = true;
    if (back === "retour") toast.success(t.returned);
    else if (back === "relance") toast.error(t.expired);
    const next = new URLSearchParams(params);
    next.delete("stripe");
    setParams(next, { replace: true });
    void queryClient.invalidateQueries({ queryKey: ["payments", "status"] });
  }, [back, params, setParams, queryClient, t]);

  const onboarding = useMutation({
    mutationFn: () => adminApi.startPaymentOnboarding(),
    onSuccess: ({ url }) => stripeNavigation.goTo(url),
    onError: err => toast.error(describeError(err)),
  });
  const dashboard = useMutation({
    mutationFn: () => adminApi.getStripeDashboardLink(),
    onSuccess: ({ url }) => stripeNavigation.goTo(url),
    onError: err => toast.error(describeError(err)),
  });
  const schedule = useMutation({
    mutationFn: (payoutSchedule: PayoutSchedule) => adminApi.updatePayoutSettings(payoutSchedule),
    onMutate: async (payoutSchedule: PayoutSchedule) => {
      const previous = queryClient.getQueryData<{
        payoutSchedule: PayoutSchedule;
      }>(["payments", "settings"]);
      queryClient.setQueryData(["payments", "settings"], { payoutSchedule });
      return { previous };
    },
    onSuccess: data => {
      queryClient.setQueryData(["payments", "settings"], data);
      toast.success(t.scheduleSaved);
    },
    onError: (err, _value, context) => {
      if (context?.previous) queryClient.setQueryData(["payments", "settings"], context.previous);
      toast.error(describeError(err));
    },
  });

  if (!manager || !status.data) return null;
  const s = status.data;
  if (!s.enabled) {
    return (
      <p data-testid="payments-disabled" className="border border-border px-4 py-3 text-muted-foreground">
        {t.disabled}
      </p>
    );
  }

  const busy = onboarding.isPending;
  const current = settings.data?.payoutSchedule ?? s.payoutSchedule;
  return (
    <div className="flex flex-col gap-4">
      {s.connected && s.payoutsEnabled ? (
        <ActiveLine readOnly={readOnly} busy={dashboard.isPending} onManage={() => dashboard.mutate()} />
      ) : s.connected && s.detailsSubmitted ? (
        <PendingBox status={s} readOnly={readOnly} busy={busy} onComplete={() => onboarding.mutate()} />
      ) : (
        <ActivateBox status={s} readOnly={readOnly} busy={busy} onActivate={() => onboarding.mutate()} />
      )}
      <section aria-labelledby="payout-schedule-title" className="flex flex-col gap-2.5 border border-border p-4">
        <h2 id="payout-schedule-title" className={kicker}>
          {t.scheduleTitle}
        </h2>
        <ScheduleTiles value={current} readOnly={readOnly} onChange={value => value !== current && schedule.mutate(value)} />
        <p className="text-sm text-muted-foreground">{t.scheduleFootnote}</p>
      </section>
    </div>
  );
}

function Steps({ current }: { current: 0 | 1 }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-1 text-[15px] text-muted-foreground">
      {fr.payments.steps.map((step, i) => (
        <li key={step} aria-current={i === current ? "step" : undefined} className={cn(i === current && "font-bold text-foreground")}>
          {i > 0 && <span aria-hidden="true">· </span>}
          {step}
        </li>
      ))}
    </ol>
  );
}

function ReadOnlyNote() {
  return <p className="text-sm text-muted-foreground">{fr.payments.readOnly}</p>;
}

function ActivateBox({ status, readOnly, busy, onActivate }: { status: PaymentStatus; readOnly: boolean; busy: boolean; onActivate: () => void }) {
  const t = fr.payments;
  return (
    <section data-testid="payments-activate" aria-labelledby="payments-title" className="flex flex-col gap-2.5 border border-lime-deep p-4">
      <p className={kicker}>{t.kicker}</p>
      <h2 id="payments-title" className="text-xl font-bold leading-tight">
        {t.title}
      </h2>
      <p className="max-w-4xl text-base leading-snug text-muted-foreground">
        {t.intro.before}
        <span className="font-mono text-lime-deep">{status.commissionBps !== null ? `${percent(status.commissionBps)} %` : t.commissionUnset}</span>
        {t.intro.after}
      </p>
      <Steps current={0} />
      {readOnly ? (
        <ReadOnlyNote />
      ) : (
        <>
          <button type="button" onClick={onActivate} disabled={busy} className={primaryButton}>
            {t.activate}
          </button>
          <p className="text-sm text-muted-foreground">
            {t.redirectNote}
            {status.testMode && ` ${t.testModeNote}`}
          </p>
        </>
      )}
    </section>
  );
}

function PendingBox({ status, readOnly, busy, onComplete }: { status: PaymentStatus; readOnly: boolean; busy: boolean; onComplete: () => void }) {
  const t = fr.payments;
  return (
    <section data-testid="payments-pending" aria-labelledby="payments-title" className="flex flex-col gap-2.5 border border-lime-deep p-4">
      <p className={kicker}>{t.pendingKicker}</p>
      <h2 id="payments-title" className="text-xl font-bold leading-tight">
        <span aria-hidden="true" className="text-lime-deep">
          ●{" "}
        </span>
        {t.pendingTitle}
      </h2>
      <p className="max-w-4xl text-base leading-snug text-muted-foreground">{t.pendingText}</p>
      <Steps current={1} />
      {readOnly ? (
        <ReadOnlyNote />
      ) : (
        <>
          <button
            type="button"
            onClick={onComplete}
            disabled={busy}
            className="min-h-11 self-start border border-border px-4 font-semibold hover:bg-accent disabled:opacity-50"
          >
            {t.complete}
          </button>
          {status.testMode && <p className="text-sm text-muted-foreground">{t.testModeNote}</p>}
        </>
      )}
    </section>
  );
}

function ActiveLine({ readOnly, busy, onManage }: { readOnly: boolean; busy: boolean; onManage: () => void }) {
  const t = fr.payments;
  return (
    <p data-testid="payments-active" className="flex min-h-11 flex-wrap items-center gap-x-2 border border-border px-4 py-1.5 text-lg">
      <span className="font-semibold">
        {t.active} <span className="text-success">✓</span>
      </span>
      {!readOnly && (
        <>
          <span aria-hidden="true" className="text-muted-foreground">
            ·
          </span>
          <button
            type="button"
            onClick={onManage}
            disabled={busy}
            className="min-h-11 font-semibold text-lime-deep underline-offset-4 hover:underline disabled:opacity-50"
          >
            {t.manage}
          </button>
        </>
      )}
    </p>
  );
}

/** The four payout dates as a radio group: arrows move and choose, like native radios. */
function ScheduleTiles({ value, readOnly, onChange }: { value: PayoutSchedule; readOnly: boolean; onChange: (value: PayoutSchedule) => void }) {
  const t = fr.payments;
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const choose = (index: number) => {
    const next = SCHEDULES[(index + SCHEDULES.length) % SCHEDULES.length];
    refs.current[SCHEDULES.indexOf(next)]?.focus();
    if (!readOnly) onChange(next);
  };
  const onKeyDown = (index: number) => (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") choose(index + 1);
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") choose(index - 1);
    else if (e.key === "Home") choose(0);
    else if (e.key === "End") choose(SCHEDULES.length - 1);
    else if (e.key === " " || e.key === "Enter") {
      if (!readOnly) onChange(SCHEDULES[index]);
    } else return;
    e.preventDefault();
  };
  return (
    <div role="radiogroup" aria-labelledby="payout-schedule-title" aria-readonly={readOnly || undefined} className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {SCHEDULES.map((option, i) => {
        const checked = option === value;
        return (
          <div
            key={option}
            ref={el => (refs.current[i] = el)}
            role="radio"
            aria-checked={checked}
            aria-disabled={readOnly || undefined}
            tabIndex={checked ? 0 : -1}
            onClick={() => !readOnly && onChange(option)}
            onKeyDown={onKeyDown(i)}
            className={cn(
              "flex min-h-[68px] flex-col justify-center px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              checked ? "border-2 border-lime-deep px-[11px]" : "border border-border",
              readOnly ? "cursor-default" : "cursor-pointer hover:bg-accent",
            )}
          >
            <span className={cn("font-bold", checked && "text-lime-deep")}>
              {checked && <span aria-hidden="true">● </span>}
              {t.schedule[option].title}
            </span>
            <span className="text-[15px] leading-tight text-muted-foreground">
              {t.schedule[option].text}
              {option === RECOMMENDED_SCHEDULE && ` · ${t.recommended}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
