import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { adminApi } from "@/lib/api";
import { describeError, shuttleTrackingFr as t } from "@/lib/fr";
import type { Parking, ShuttleTracking } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVELS: ShuttleTracking[] = ["off", "team", "everyone"];
/** Who sees what, per level: the team's live map, the travellers, "EN DIRECT" in the search results. */
const SEES: Record<ShuttleTracking, { team: boolean; clients: boolean; mention: boolean }> = {
  off: { team: false, clients: false, mention: false },
  team: { team: true, clients: false, mention: false },
  everyone: { team: true, clients: true, mention: true },
};

/**
 * "Suivi des navettes" block of the Parking page (R-B, 07/10/2026): not every partner wants its
 * shuttles followed. Three levels, the matrix of who sees what on each, saved with "Enregistrer".
 */
export function ShuttleTrackingCard({ parking }: { parking: Parking }) {
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<ShuttleTracking>(parking.shuttleTracking);
  useEffect(() => setChoice(parking.shuttleTracking), [parking.shuttleTracking]);
  const save = useMutation({
    mutationFn: () => adminApi.setShuttleTracking(parking.id, choice),
    onSuccess: ({ data }) => {
      queryClient.setQueryData(["parking"], (old: Parking | undefined) => (old ? { ...old, shuttleTracking: data.shuttleTracking } : old));
      toast.success(t.saved);
    },
    onError: (err: Error) => toast.error(describeError(err)),
  });

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div>
          <h2 className="text-xl font-semibold uppercase tracking-wide">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.intro}</p>
        </div>
        <fieldset className="space-y-2.5">
          <legend className="sr-only">{t.legend}</legend>
          {LEVELS.map(level => {
            const selected = choice === level;
            const sees = SEES[level];
            return (
              <label
                key={level}
                data-testid={`tracking-${level}`}
                className={cn(
                  "flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border p-3.5",
                  selected ? "border-2 border-primary bg-[#F3FBE6] p-[13px]" : "border-panel-line hover:bg-panel-2",
                )}
              >
                <input
                  type="radio"
                  name="shuttle-tracking"
                  value={level}
                  checked={selected}
                  onChange={() => setChoice(level)}
                  className="h-5 w-5 accent-[#1E5E2E]"
                />
                <span className="flex min-w-0 flex-[1_1_280px] flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
                    {t.levels[level].title}
                    {level === "everyone" && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{t.recommended}</span>}
                  </span>
                  <span className="text-[13px] text-muted-foreground">{t.levels[level].text}</span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {(["team", "clients", "mention"] as const).map(who => (
                    <span
                      key={who}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        sees[who] ? "bg-ok-soft text-ok-text" : "bg-panel-2 text-muted-foreground",
                      )}
                    >
                      {t.who[who]} {sees[who] ? "✓" : "✕"}
                      <span className="sr-only"> : {sees[who] ? t.yes : t.no}</span>
                    </span>
                  ))}
                </span>
              </label>
            );
          })}
        </fieldset>
        <p className="rounded-lg bg-panel-2 px-3.5 py-3 text-[13px] text-muted-foreground">{t.always}</p>
        <div className="flex justify-end">
          <button
            type="button"
            data-testid="tracking-save"
            disabled={save.isPending || choice === parking.shuttleTracking}
            onClick={() => save.mutate()}
            className="flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
          >
            {t.save}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
