import { useQuery } from "@tanstack/react-query";
import { Euro, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { formatRate } from "@/lib/commission";
import { fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import { useRevenueHidden } from "@/lib/revenue-mask";
import { can } from "@/lib/roles";

const t = fr.revenue;
const month = (date: string) =>
  new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`),
  );
const share = (part: number, whole: number) =>
  `${((part / whole) * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

/**
 * CA-A (09/10/2026, with the CA-B page): the month's revenue on the dashboard, with today's and the last 7 days', for
 * the managers; a click opens « Chiffre d'affaires ». Nothing for the other roles, nor while it loads or fails.
 * Choice A of 20/10/2026 (« mets en avant les commissions »): gross − commissions = what the parking keeps, then a pill
 * per channel that took some, and the comparators without a rate in amber.
 */
export function RevenueTile() {
  const { user } = useAuth();
  const allowed = can(user?.role, "revenue:view");
  // 27/10/2026: the platform admin can hide the figures on this browser (the tile stays, without a number).
  const [hidden, setHidden] = useRevenueHidden();
  const { data } = useQuery({
    queryKey: ["revenue", "summary"],
    queryFn: () => adminApi.getRevenueSummary(),
    enabled: allowed && !hidden,
    refetchInterval: 5 * 60_000,
  });
  if (!allowed) return null;
  if (hidden)
    return (
      <div
        data-testid="kpi-revenue-hidden"
        className="col-span-full flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-panel-line bg-panel px-4 py-3.5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 text-muted-foreground">
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium">{t.mask.hidden}</span>
        {user?.isPlatformAdmin && (
          <button
            type="button"
            onClick={() => setHidden(false)}
            className="ml-auto text-sm font-semibold text-lime-deep hover:underline"
          >
            {t.mask.show}
          </button>
        )}
      </div>
    );
  if (!data) return null;
  const { totalCents, commissionCents, netCents } = data.month;
  // An older API sends no commissions: the gross alone, as before.
  const withNet = commissionCents !== undefined && netCents !== undefined;
  return (
    <Link
      to="/chiffre-affaires"
      data-testid="kpi-revenue"
      className="col-span-full flex flex-col gap-3 rounded-xl border-2 border-primary bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2"
    >
      <span className="flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 text-lime-deep">
          <Euro className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="font-mono text-xs font-medium text-lime-deep">
          {t.tile(month(data.month.from))}
        </span>
      </span>
      <span className="flex flex-wrap items-end gap-x-6 gap-y-3">
        {withNet ? (
          <>
            <span className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t.tileGross}
              </span>
              <span className="tabular font-mono text-2xl font-medium leading-none tracking-tight">
                {euros(totalCents)}
              </span>
            </span>
            <span
              aria-hidden="true"
              className="pb-0.5 text-2xl text-muted-foreground"
            >
              −
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">
                {t.tileCommissions}
              </span>
              <span className="tabular font-mono text-2xl font-medium leading-none tracking-tight text-bad">
                {euros(commissionCents)}
              </span>
              {totalCents > 0 && (
                <span className="text-xs text-bad">
                  {t.tileShare(share(commissionCents, totalCents))}
                </span>
              )}
            </span>
            <span
              aria-hidden="true"
              className="pb-0.5 text-2xl text-muted-foreground"
            >
              =
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-lime-deep">
                {t.tileKept}
              </span>
              <span className="tabular font-mono text-3xl font-medium leading-none tracking-tight text-lime-deep">
                {euros(netCents)}
              </span>
            </span>
          </>
        ) : (
          <span className="tabular font-mono text-3xl font-medium leading-none tracking-tight">
            {euros(totalCents)}
          </span>
        )}
        <span className="font-mono text-xs text-muted-foreground lg:ml-auto">
          {t.tileSub(
            euros(data.todayCents),
            euros(data.weekCents),
            data.month.count,
          )}
        </span>
      </span>
      {(!!data.commissions?.length || data.month.withoutAmount > 0) && (
        <span className="flex flex-wrap gap-2 text-xs">
          {data.commissions?.map((line) =>
            line.missingRate ? (
              <span
                key={line.label}
                className="rounded-full bg-warn-soft px-2.5 py-1 font-semibold text-[#92400E]"
              >
                {t.tileMissingRate(line.label)}
              </span>
            ) : (
              <span
                key={line.label}
                className="rounded-full bg-panel-2 px-2.5 py-1"
              >
                {line.label}
                {line.rateBp !== null && ` ${formatRate(line.rateBp)}`} · −
                {euros(line.amountCents)}
              </span>
            ),
          )}
          {data.month.withoutAmount > 0 && (
            <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 font-semibold text-[#92400E]">
              {t.tileMissing(data.month.withoutAmount)}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
