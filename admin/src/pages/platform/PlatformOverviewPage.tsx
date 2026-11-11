import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { describeError, fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import type { PlatformOperator, PlatformTodo } from "@/lib/types";
import { cn } from "@/lib/utils";
import { operatorPath } from "@/lib/platform";
import { KindPill, OperatorStatePill } from "./operator-bits";

const t = fr.platform.overview;
const pill = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

const dayLabel = (date: string) => {
  const text = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  }).format(new Date(`${date}T12:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/** Where a line of « À traiter » is handled. */
function todoTarget(todo: PlatformTodo): string {
  if (todo.kind === "listing_review") return "/plateforme/annonces";
  if (todo.kind === "payout_failed") return "/plateforme/paiements";
  if (todo.kind === "invitation_expired") return "/plateforme/loueurs";
  if (todo.kind === "contract_missing" || todo.kind === "contract_pending")
    return `${operatorPath(todo.operatorId)}?onglet=contrat`;
  return operatorPath(todo.operatorId);
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "warn";
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[14px] border border-border bg-card p-4">
      <span className="text-xs uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "font-mono text-[28px] leading-tight",
          tone === "warn" && "text-[#B45309]",
        )}
      >
        {value}
      </span>
      <span className="text-sm text-muted-foreground">{hint}</span>
    </div>
  );
}

function PaymentsText({ operator }: { operator: PlatformOperator }) {
  if (operator.invitation)
    return <span className="text-muted-foreground">—</span>;
  if (operator.payments.connected && operator.payments.payoutsEnabled)
    return (
      <span className="text-ok-text">
        {fr.platform.operatorPage.stripeLinked}
      </span>
    );
  if (operator.payments.connected)
    return (
      <span className="text-[#B45309]">
        {fr.platform.operatorPage.stripeToActivate}
      </span>
    );
  return (
    <span className="text-[#B45309]">
      {fr.platform.operatorPage.stripeMissing}
    </span>
  );
}

/**
 * 11/11/2026 (« A avec la page loueur de C », direction A): the platform's home. Figures of the real operators only, what
 * waits on the platform with the place to handle it, then the operators by kind, each line opening its page.
 */
export default function PlatformOverviewPage() {
  const [filter, setFilter] = useState<"real" | "other">("real");
  const overview = useQuery({
    queryKey: ["platform", "operators", "overview"],
    queryFn: adminApi.getPlatformOverview,
  });

  if (overview.isError)
    return <p className="text-destructive">{describeError(overview.error)}</p>;
  if (!overview.data)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  const o = overview.data;
  const total = o.operators.real + o.operators.other;
  const shown = o.operatorsList.filter((op) =>
    filter === "real"
      ? (op.kind ?? "real") === "real"
      : (op.kind ?? "real") !== "real",
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold">{t.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.subtitle(dayLabel(o.today), total, o.operators.other)}
          </p>
        </div>
        <Link
          to="/plateforme/loueurs?inviter=1"
          className="flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-105"
        >
          {t.invite}
        </Link>
      </header>

      <section
        aria-label={t.title}
        className="grid grid-cols-2 gap-3.5 lg:grid-cols-4"
      >
        <Kpi
          label={t.kpis.realActive}
          value={String(o.operators.realActive)}
          hint={t.kpis.realActiveHint(o.operators.invitations)}
        />
        <Kpi
          label={t.kpis.bookings}
          value={String(o.bookingsThisMonth.real)}
          hint={t.kpis.bookingsHint(o.bookingsThisMonth.other)}
        />
        <Kpi
          label={t.kpis.commission}
          value={euros(o.plazoThisMonth.commissionCents)}
          hint={t.kpis.commissionHint(o.plazoThisMonth.bookings)}
        />
        <Kpi
          label={t.kpis.todo}
          value={String(o.todos.length)}
          hint={t.kpis.todoHint(o.todos.length)}
          tone={o.todos.length ? "warn" : undefined}
        />
      </section>

      <section className="rounded-[14px] border border-border bg-card px-5 py-4">
        <h2 className="mb-2 text-base font-bold">{t.todoTitle}</h2>
        {o.todos.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.todoEmpty}</p>
        ) : (
          <ul data-testid="platform-todos">
            {o.todos.map((todo) => (
              <li
                key={`${todo.kind}-${todo.operatorId}`}
                className="border-t border-[#EEF0EE] first:border-t-0"
              >
                <Link
                  to={todoTarget(todo)}
                  className="flex min-h-12 flex-wrap items-center gap-3 py-2 hover:bg-accent/40"
                >
                  <span
                    className={cn(
                      pill,
                      todo.kind === "listing_review"
                        ? "bg-[#E4E6E2] text-foreground"
                        : "bg-[#B45309] text-white",
                    )}
                  >
                    {t.todoTags[todo.kind]}
                  </span>
                  <span className="min-w-[16rem] flex-1 text-sm">
                    {todo.kind === "payout_failed"
                      ? t.todoText.payout_failed(
                          todo.operatorName,
                          todo.count ?? 1,
                        )
                      : t.todoText[todo.kind](todo.operatorName)}
                  </span>
                  <span className="text-sm font-semibold text-lime-deep">
                    {t.todoAction[todo.kind]} ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-[14px] border border-border bg-card px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold">{t.operatorsTitle}</h2>
          <div
            role="group"
            aria-label={t.operatorsTitle}
            className="flex flex-wrap gap-1.5"
          >
            {(["real", "other"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={cn(
                  "min-h-9 rounded-full px-3 text-sm",
                  filter === key
                    ? "bg-lime-deep text-white"
                    : "border border-border bg-card hover:bg-accent",
                )}
              >
                {t.filters[key]} ·{" "}
                {key === "real" ? o.operators.real : o.operators.other}
              </button>
            ))}
            <Link
              to="/plateforme/loueurs?vue=archives"
              className="flex min-h-9 items-center rounded-full border border-border px-3 text-sm hover:bg-accent"
            >
              {t.filters.archived} · {o.operators.archived}
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                <th className="py-2 pr-3 font-normal">{t.columns.operator}</th>
                <th className="py-2 pr-3 font-normal">{t.columns.state}</th>
                <th className="py-2 pr-3 font-normal">{t.columns.listing}</th>
                <th className="py-2 pr-3 font-normal">{t.columns.payments}</th>
                <th className="py-2 pr-3 font-normal">{t.columns.bookings}</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-muted-foreground">
                    {t.noOperator}
                  </td>
                </tr>
              )}
              {shown.map((op) => (
                <tr
                  key={op.id}
                  className="border-b border-[#EEF0EE] last:border-b-0"
                >
                  <td className="py-3 pr-3">
                    <Link
                      to={operatorPath(op.id)}
                      className="font-semibold hover:underline"
                    >
                      {op.name}
                    </Link>
                    <KindPill kind={op.kind} />
                    <div className="text-xs text-muted-foreground">
                      {fr.platform.operatorPage.places(op.places)}
                      {op.manager ? ` · ${op.manager.email}` : ""}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <OperatorStatePill operator={op} />
                  </td>
                  <td className="py-3 pr-3">
                    {op.listing ? (
                      fr.listingStatus[op.listing.status]
                    ) : (
                      <span className="text-muted-foreground">
                        {fr.platform.operatorPage.listingNone}
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <PaymentsText operator={op} />
                  </td>
                  <td className="py-3 pr-3 font-mono">
                    {op.bookingsThisMonth}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link
          to="/plateforme/loueurs"
          className="inline-block text-sm font-semibold text-lime-deep hover:underline"
        >
          {t.allOperators}
        </Link>
      </section>
    </div>
  );
}
