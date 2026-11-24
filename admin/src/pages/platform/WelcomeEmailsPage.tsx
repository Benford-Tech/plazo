import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-context";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import type { WelcomeOutcome, WelcomeReport, WelcomeReportRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const t = fr.platform.welcome;
const PERIODS = [7, 30, 90] as const;
const number = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const when = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));
const CHANNELS: Record<string, string> = { phone: "Téléphone", counter: "Comptoir", website: "Site du parking", import: "Import", aggregator: "Comparateur" };
const channelOf = (r: WelcomeReportRow) => (r.channel === "aggregator" && r.channelDetail) || CHANNELS[r.channel] || r.channel;

const TONE: Record<WelcomeOutcome, string> = {
  sent: "bg-ok-soft text-ok-text",
  repeat: "bg-muted text-muted-foreground",
  opted_out: "bg-muted text-muted-foreground",
  no_email: "bg-warn-soft text-warn-text",
  failed: "bg-bad-soft text-bad-text",
  in_progress: "bg-info-soft text-info-text",
};

/**
 * Plateforme › Mails d'accueil (18/11/2026, « affiche une liste des mails d'invitation envoyés côté plateforme », direction B):
 * the welcome emails to travellers handled over the period, and for the other bookings the first reason they never got it.
 */
export default function WelcomeEmailsPage() {
  const [days, setDays] = useState<number>(30);
  const [operatorId, setOperatorId] = useState<string>("");
  const [tab, setTab] = useState<"sent" | "other">("sent");
  const report = useQuery({
    queryKey: ["platform", "welcome", days, operatorId],
    queryFn: () => adminApi.getWelcomeReport(days, operatorId || null),
  });
  const r = report.data;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{t.title}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="welcome-operator">
            {t.operatorLabel}
          </label>
          <select
            id="welcome-operator"
            data-testid="welcome-operator"
            value={operatorId}
            onChange={(e) => setOperatorId(e.target.value)}
            className="min-h-9 rounded-full border border-border bg-card px-3 text-sm"
          >
            <option value="">{t.allOperators}</option>
            {(r?.operators ?? []).map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <div role="radiogroup" aria-label={t.periodLabel} className="flex gap-1 rounded-full border border-border bg-card p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={days === p}
                data-testid={`welcome-period-${p}`}
                onClick={() => setDays(p)}
                className={cn("min-h-9 rounded-full px-3 text-sm font-semibold", days === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}
              >
                {t.periods[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {report.error ? (
        <p className="text-destructive">{describeError(report.error) || t.loadError}</p>
      ) : !r ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile testId="welcome-bookings" label={t.kpi.bookings} value={r.counts.bookings} />
            <Tile testId="welcome-sent" label={t.kpi.sent} value={r.counts.sent} tone="text-ok-text" />
            <Tile testId="welcome-handled" label={t.kpi.handledNotSent} value={r.counts.handledNotSent} />
            <Tile
              testId="welcome-not-candidate"
              label={t.kpi.notCandidate}
              value={r.counts.notCandidate}
              tone={r.counts.notCandidate ? "text-warn-text" : undefined}
              sub={r.counts.pending ? t.kpi.pending(r.counts.pending) : undefined}
            />
          </div>
          <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
            <List r={r} tab={tab} setTab={setTab} />
            <Reasons r={r} />
          </div>
          <p className="text-xs text-muted-foreground">{t.masked}</p>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, sub, tone, testId }: { label: string; value: number; sub?: string; tone?: string; testId?: string }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4" data-testid={testId}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-2xl font-bold tabular-nums", tone)}>{number(value)}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function List({ r, tab, setTab }: { r: WelcomeReport; tab: "sent" | "other"; setTab: (t: "sent" | "other") => void }) {
  const rows = r.rows.filter((x) => (tab === "sent" ? x.outcome === "sent" : x.outcome !== "sent"));
  const counts = { sent: r.counts.sent, other: r.counts.handledNotSent };
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-[14px] border border-border bg-card p-4">
      <div role="tablist" className="flex flex-wrap gap-2">
        {(["sent", "other"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            data-testid={`welcome-tab-${k}`}
            onClick={() => setTab(k)}
            className={cn(
              "min-h-9 rounded-full border px-3 text-sm",
              tab === k ? "border-primary bg-primary font-semibold text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent",
            )}
          >
            {t.tabs[k]} <span className="ml-1 font-mono tabular-nums">{number(counts[k])}</span>
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{tab === "sent" ? t.emptySent : t.emptyOther}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm" data-testid="welcome-rows">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">{t.columns.handledAt}</th>
                <th className="py-2 pr-3 font-medium">{t.columns.parking}</th>
                <th className="py-2 pr-3 font-medium">{t.columns.traveller}</th>
                <th className="py-2 pr-3 font-medium">{t.columns.reservation}</th>
                <th className="py-2 pr-3 font-medium">{t.columns.arrival}</th>
                <th className="py-2 font-medium">{t.columns.outcome}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <tr key={x.id} className="border-b border-border align-top last:border-0">
                  <td className="py-2 pr-3 font-mono text-xs tabular-nums">{when(x.handledAt)}</td>
                  <td className="py-2 pr-3">
                    {x.parking}
                    {x.operatorName !== x.parking && <div className="text-xs text-muted-foreground">{x.operatorName}</div>}
                  </td>
                  <td className="py-2 pr-3">
                    {x.traveller}
                    {x.email && <div className="text-xs text-muted-foreground">{x.email}</div>}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="font-mono text-xs">{x.reference}</span>
                    <div className="text-xs text-muted-foreground">{channelOf(x)}</div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs tabular-nums">{when(x.arrivalAt)}</td>
                  <td className="py-2">
                    <span className={cn("inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold", TONE[x.outcome])}>{t.outcomes[x.outcome]}</span>
                    {t.outcomeHelp[x.outcome] && <div className="mt-1 text-xs text-muted-foreground">{t.outcomeHelp[x.outcome]}</div>}
                    {x.canResend && <ResendButton row={x} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {r.truncated && <p className="text-xs text-muted-foreground">{t.truncated(r.rows.length)}</p>}
    </section>
  );
}

/** 24/11/2026 (« pouvoir renvoyer un mail déjà envoyé »): the same email again, after a confirmation. */
function ResendButton({ row }: { row: WelcomeReportRow }) {
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => adminApi.resendWelcomeEmail(row.id),
    onSuccess: (r) => {
      if (r.emailSent) toast.success(t.resent(row.traveller));
      else toast.error(t.resentFailed);
      void queryClient.invalidateQueries({ queryKey: ["platform", "welcome"] });
    },
    onError: (error) => toast.error((error instanceof ApiError && error.code && t.resendErrors[error.code]) || t.resendError),
  });
  return (
    <button
      type="button"
      data-testid={`welcome-resend-${row.id}`}
      disabled={mutation.isPending}
      onClick={async () => {
        const yes = await confirm(t.resendConfirm.body, { title: t.resendConfirm.title(row.traveller), confirmLabel: t.resendConfirm.confirm });
        if (yes) mutation.mutate();
      }}
      className="mt-1.5 block rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold text-lime-deep hover:bg-accent disabled:opacity-60"
    >
      {mutation.isPending ? t.resending : t.resend}
    </button>
  );
}

function Reasons({ r }: { r: WelcomeReport }) {
  const total = r.reasons.reduce((n, x) => n + x.count, 0);
  return (
    <section className="flex flex-col gap-2 rounded-[14px] border border-border bg-card p-4" data-testid="welcome-reasons">
      <h2 className="font-semibold">{t.why(total)}</h2>
      <p className="text-xs text-muted-foreground">{t.whyHelp}</p>
      {r.reasons.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">{t.whyEmpty}</p>
      ) : (
        <ul className="flex flex-col">
          {r.reasons.map((x) => (
            <li key={x.reason} className="flex justify-between gap-3 border-b border-border py-2 text-sm last:border-0">
              <span>{t.reasons[x.reason] ?? x.reason}</span>
              <span className="font-mono tabular-nums">{number(x.count)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
