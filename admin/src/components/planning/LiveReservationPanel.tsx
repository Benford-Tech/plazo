import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { QuickCardBody } from "@/components/reservations/ReservationQuickCard";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import { timeOf } from "@/lib/datetime";
import { describeError, fr, quickCardFr } from "@/lib/fr";
import { agoLabel, liveSteps, type LiveStep } from "@/lib/live-steps";
import type { PlanningRow } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The panel refreshes on its own (12/11/2026): the booking every 5 s while the page is visible. */
export const LIVE_PANEL_POLL_MS = 5000;

function Timeline({ steps }: { steps: LiveStep[] }) {
  if (!steps.length) return null;
  return (
    <ol aria-label={fr.planning.live.timeline} data-testid="live-steps" className="flex flex-col gap-2 rounded-xl border border-panel-line bg-panel p-3">
      {steps.map(step => (
        <li key={step.key} data-testid={`live-step-${step.key}`} data-state={step.state} className="flex items-start gap-2.5 text-[14px]">
          <span
            aria-hidden="true"
            className={cn(
              "mt-1 h-3 w-3 shrink-0 rounded-full border-2",
              step.state === "todo" ? "border-panel-line bg-card" : "border-lime-deep bg-lime-deep",
              step.state === "now" && "ring-4 ring-lime-deep/20",
            )}
          />
          <span className="min-w-0">
            <span className={step.state === "todo" ? "text-muted-foreground" : "font-semibold"}>{step.label}</span>
            {step.at && step.state !== "todo" && <span className="tabular font-mono text-muted-foreground"> · {timeOf(step.at)}</span>}
            {step.details.map(d => (
              <span key={d} className="block text-[13px] text-muted-foreground">
                « {d} »
              </span>
            ))}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The booking opened next to the planning on a wide screen (12/11/2026, section 1 of the approved mockups): the
 * planning stays in view, the panel polls the booking every 5 s and says how fresh it is, then shows what the traveller
 * did and the operational card's body (next step, link to the full page).
 */
export function LiveReservationPanel({ row, kind, onClose }: { row: PlanningRow; kind: "arrival" | "return"; onClose: () => void }) {
  const t = fr.planning.live;
  const query = useQuery({
    queryKey: ["reservation", row.id],
    queryFn: () => adminApi.getReservation(row.id),
    refetchInterval: LIVE_PANEL_POLL_MS,
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const r = query.data;
  const updatedAt = query.dataUpdatedAt;
  return (
    <aside
      aria-label={t.title}
      data-testid="live-panel"
      className="sticky top-4 flex max-h-[calc(100vh-2rem)] flex-col gap-3 overflow-y-auto rounded-[14px] border border-panel-line bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wide text-muted-foreground">{r?.reference ?? row.reference}</span>
        <span
          data-testid="live-pill"
          className="ml-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ok-soft px-2.5 py-1 text-xs font-bold text-ok-text"
        >
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-ok motion-reduce:animate-none" />
          {updatedAt ? t.pill(agoLabel((now - updatedAt) / 1000)) : t.waiting}
        </span>
        <button type="button" aria-label={t.close} onClick={onClose} className="rounded-full p-1.5 hover:bg-panel-2">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {query.isError && !r ? (
        <p className="rounded-xl border border-bad bg-bad-soft p-3 text-sm text-bad-text">{describeError(query.error) || quickCardFr.loadError}</p>
      ) : !r ? (
        <div className="space-y-2">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <QuickCardBody r={r} live={<Timeline steps={liveSteps(r, kind, row.arrivalSignal ?? null, row.shuttleTrip ?? null)} />} />
      )}
    </aside>
  );
}
