import { useQuery } from "@tanstack/react-query";
import { Plate } from "@/components/Plate";
import { useQuickCard } from "@/components/reservations/ReservationQuickCard";
import { adminApi } from "@/lib/api";
import { timeOf } from "@/lib/datetime";
import { fr } from "@/lib/fr";
import type { ValetRun } from "@/lib/types";
import { ValetIcon } from "@/lib/valet-icon";
import { Badge } from "./Badge";

const POLL_MS = 30_000;

/**
 * « Courses au terminal · aujourd'hui » (27/10/2026, direction B): the valet runs of the day on the dashboard, who
 * took each one; hidden when the parking has none.
 */
export function ValetRunsCard() {
  const t = fr.valetRuns;
  const card = useQuickCard();
  const { data } = useQuery({ queryKey: ["valet-runs"], queryFn: adminApi.valetRuns, refetchInterval: POLL_MS });
  if (!data || data.runs.length === 0) return null;
  return (
    <section className="rounded-xl border border-panel-line bg-panel p-3.5" data-testid="valet-runs">
      <header className="mb-3 flex items-start gap-3">
        <span className="min-w-0">
          <h2 className="flex items-center gap-1.5 font-mono text-[19px] font-medium leading-tight">
            <ValetIcon className="h-5 w-5 text-info" />
            {t.title}
          </h2>
          <span className="block font-mono text-xs text-muted-foreground">{t.meetingPoint(data.meetingPoint)}</span>
        </span>
        <span className="ml-auto flex gap-1.5">
          {data.counts.todo > 0 && <Badge tone="warn">{t.todoCount(data.counts.todo)}</Badge>}
          {data.counts.taken > 0 && <Badge tone="info">{t.takenCount(data.counts.taken)}</Badge>}
        </span>
      </header>
      <ul className="divide-y divide-panel-line">
        {data.runs.map(run => (
          <li key={run.id}>
            <button
              type="button"
              onClick={() => card.open(run.reservationId)}
              className="flex w-full items-center gap-3 py-2 text-left hover:bg-accent/50"
              data-testid={`valet-run-${run.id}`}
            >
              <span className="tabular w-12 font-mono text-[15px] font-bold text-lime-deep">{timeOf(run.meetAt)}</span>
              <span className="w-16 text-xs font-semibold uppercase tracking-wide text-info">{t.kinds[run.kind]}</span>
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Plate value={run.plate} />
                <span className="truncate text-sm font-semibold">{run.customerName}</span>
              </span>
              <RunState run={run} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RunState({ run }: { run: ValetRun }) {
  const t = fr.valetRuns;
  if (run.state === "done") return <Badge tone="ok">{t.done}</Badge>;
  if (run.state === "taken") return <Badge tone="info">{run.takenBy?.firstName || t.taken}</Badge>;
  return <Badge tone="warn">{t.todo}</Badge>;
}
