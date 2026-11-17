import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";
import { contractDateTime, savePdf } from "@/lib/contract";
import { agreementsFr as t, describeError } from "@/lib/fr";
import { PLAZO_PLANS } from "@/lib/pro-plans";
import type { AgreementKind, ProPlanId } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Plateforme › loueur › Contrat (17/11/2026, choice C): the operator's Plazo Pro plan (read by the terms of use) and where
 * its two contracts stand, with their PDF.
 */
export function OperatorAgreementsCard({ operatorId }: { operatorId: string }) {
  const queryClient = useQueryClient();
  const key = ["platform", "agreements", operatorId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => adminApi.getOperatorAgreements(operatorId),
  });
  const plan = useMutation({
    mutationFn: (v: { plan: ProPlanId | null; yearly: boolean }) =>
      adminApi.setOperatorProPlan(operatorId, v.plan, v.yearly),
    onSuccess: (data) => {
      queryClient.setQueryData(key, data);
      toast.success(t.planSaved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });
  const files = useMutation({
    mutationFn: async (
      arg:
        | { preview: AgreementKind }
        | { id: string; kind: "signed" | "proof" },
    ) => {
      const { blob, filename } =
        "preview" in arg
          ? await adminApi.operatorAgreementPreview(operatorId, arg.preview)
          : await adminApi.operatorAgreementFile(operatorId, arg.id, arg.kind);
      savePdf(blob, filename ?? "contrat.pdf");
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  const data = query.data;
  if (query.error)
    return <p className="text-destructive">{describeError(query.error)}</p>;
  if (!data) return null;
  const current = data.plan;

  return (
    <section
      className="flex flex-col gap-4 rounded-[14px] border border-border bg-card p-5"
      data-testid="operator-agreements"
    >
      <h2 className="text-lg font-semibold">{t.platformTitle}</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t.planLabel}
          <select
            value={current?.id ?? ""}
            disabled={plan.isPending}
            onChange={(e) =>
              plan.mutate({
                plan: (e.target.value || null) as ProPlanId | null,
                yearly: current?.yearly ?? false,
              })
            }
            className="h-11 rounded-[10px] border border-border bg-background px-3 font-normal"
          >
            <option value="">{t.planNone}</option>
            {PLAZO_PLANS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.monthlyEuros} € HT / mois
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={current?.yearly ?? false}
            disabled={!current || plan.isPending}
            onChange={(e) =>
              current &&
              plan.mutate({ plan: current.id, yearly: e.target.checked })
            }
            className="h-5 w-5 accent-[#1E5E2E]"
          />
          {t.planYearly}
        </label>
      </div>
      <p className="text-xs text-muted-foreground">{t.planNote}</p>
      <ul className="flex flex-col divide-y divide-border border-t border-border">
        {data.agreements.map((a) => {
          const due = data.toSign.includes(a.kind);
          return (
            <li
              key={a.kind}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3 text-sm"
            >
              <span className="min-w-0 flex-1 font-semibold">
                {a.title}{" "}
                <span className="font-normal text-muted-foreground">
                  · {t.version(a.version)}
                </span>
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  a.signed
                    ? "bg-ok-soft text-ok-text"
                    : due
                      ? "bg-warn-soft text-warn-text"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {a.signed
                  ? t.signedLine(
                      contractDateTime(a.signed.signedAt).slice(0, 10),
                      a.signed.signerName,
                    )
                  : due
                    ? t.notSigned
                    : t.waitingListing}
              </span>
              {a.signed ? (
                <>
                  <button
                    type="button"
                    className="text-lime-deep underline"
                    onClick={() =>
                      files.mutate({ id: a.signed!.id, kind: "signed" })
                    }
                  >
                    {t.signedPdf}
                  </button>
                  <button
                    type="button"
                    className="text-lime-deep underline"
                    onClick={() =>
                      files.mutate({ id: a.signed!.id, kind: "proof" })
                    }
                  >
                    {t.proof}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="text-lime-deep underline"
                  onClick={() => files.mutate({ preview: a.kind })}
                >
                  {t.downloadPdf}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
