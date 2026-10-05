import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { percent } from "@/lib/platform";
import { euros } from "@/lib/pricing";
import type { PlatformPayments, StripeState } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.payments;
const labelClass = "text-[11px] uppercase tracking-[0.08em] text-muted-foreground";

function StripeCell({ stripe }: { stripe: StripeState }) {
  if (stripe.connected && stripe.payoutsEnabled) return <span className="text-success">{t.stripeActive}</span>;
  if (stripe.connected) return <span className="text-warn">{t.stripeIncomplete}</span>;
  return <span className="text-muted-foreground">{t.stripeNone}</span>;
}

function FailedPayout({ payout }: { payout: PlatformPayments["operators"][number]["failed"][number] }) {
  const queryClient = useQueryClient();
  const retry = useMutation({
    mutationFn: () => adminApi.retryPayout(payout.reservationId),
    onSuccess: ({ result }) => {
      (result === "transferred" ? toast.success : toast.error)(t.retried[result]);
      queryClient.invalidateQueries({ queryKey: ["platform", "payments"] });
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  return (
    <li className="flex items-center gap-3">
      <span className="font-mono text-destructive">{t.failedRow(payout.reference, payout.amountCents !== null ? euros(payout.amountCents) : "—")}</span>
      <button type="button" disabled={retry.isPending} onClick={() => retry.mutate()} className="min-h-10 border border-border px-3 text-base hover:bg-accent disabled:opacity-50">
        {t.retry}
      </button>
    </li>
  );
}

/** "Paiements" tab: per operator, its Stripe account, payout schedule and the payouts to watch. */
export default function PaymentsPage() {
  const payments = useQuery({ queryKey: ["platform", "payments"], queryFn: adminApi.getPlatformPayments });

  return (
    <>
      <h1 className="text-[26px] font-bold uppercase tracking-[0.03em]">{t.title}</h1>
      {payments.data && !payments.data.paymentsEnabled && <p className="border border-border p-3 text-muted-foreground">{t.disabled}</p>}
      <p className="text-sm text-muted-foreground">{t.readOnly}</p>
      {payments.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : payments.error ? (
        <p className="text-destructive">{describeError(payments.error)}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-base">
            <thead>
              <tr className="border-b border-border text-left">
                {[t.colOperator, t.colStripe, t.colSchedule, fr.platform.operators.colCommission, t.colPending, t.colFailed].map(h => (
                  <th key={h} scope="col" className={cn(labelClass, "px-2 py-2 font-normal")}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.data?.operators.map(o => (
                <tr key={o.id} className="border-b border-border align-top">
                  <td className="px-2 py-3 font-bold">
                    {o.name}
                    {o.status === "suspended" && <span className={cn(labelClass, "block text-destructive")}>{fr.platform.operators.statusSuspended}</span>}
                  </td>
                  <td className="px-2 py-3">
                    <StripeCell stripe={o.stripe} />
                  </td>
                  <td className="px-2 py-3">{fr.platform.payoutSchedule[o.payoutSchedule]}</td>
                  <td className="px-2 py-3 font-mono text-primary">{o.commissionBps !== null ? `${percent(o.commissionBps)} %` : "—"}</td>
                  <td className="px-2 py-3 font-mono">{t.pending(o.pending.count, euros(o.pending.amountCents))}</td>
                  <td className="px-2 py-3">
                    {o.failed.length ? (
                      <ul className="flex flex-col gap-1.5">
                        {o.failed.map(f => (
                          <FailedPayout key={f.reservationId} payout={f} />
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">{t.none}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
