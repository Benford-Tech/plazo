import { useQuery } from "@tanstack/react-query";
import { Euro } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi } from "@/lib/api";
import { fr } from "@/lib/fr";
import { euros } from "@/lib/pricing";
import { can } from "@/lib/roles";

const t = fr.revenue;
const month = (date: string) => new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));

/**
 * CA-A (09/10/2026, with the CA-B page): the month's revenue on the dashboard, with today's and the last 7 days', for
 * the managers; a click opens « Chiffre d'affaires ». Nothing for the other roles, nor while it loads or fails.
 */
export function RevenueTile() {
  const { user } = useAuth();
  const allowed = can(user?.role, "revenue:view");
  const { data } = useQuery({
    queryKey: ["revenue", "summary"],
    queryFn: () => adminApi.getRevenueSummary(),
    enabled: allowed,
    refetchInterval: 5 * 60_000,
  });
  if (!allowed || !data) return null;
  return (
    <Link
      to="/chiffre-affaires"
      data-testid="kpi-revenue"
      className="col-span-full flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border-2 border-primary bg-panel px-4 py-3.5 transition-colors hover:bg-panel-2"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-panel-2 text-lime-deep">
        <Euro className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-mono text-xs font-medium text-lime-deep">{t.tile(month(data.month.from))}</span>
        <span className="tabular font-mono text-3xl font-medium leading-none tracking-tight">{euros(data.month.totalCents)}</span>
      </span>
      <span className="font-mono text-xs text-muted-foreground">{t.tileSub(euros(data.todayCents), euros(data.weekCents), data.month.count)}</span>
      {data.month.withoutAmount > 0 && (
        <span className="rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#92400E]">{t.tileMissing(data.month.withoutAmount)}</span>
      )}
    </Link>
  );
}
