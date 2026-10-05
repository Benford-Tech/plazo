import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import type { CapacityStudy, StudyPatch } from "@/lib/capacity/types";
import { useEstimate } from "@/lib/capacity/useEstimate";
import { describeError, fr } from "@/lib/fr";
import type { ParkingPlanView, PlanPatch } from "@/lib/plan/types";
import { cn } from "@/lib/utils";
import type { StepProps } from "@/pages/capacity/CapacityStudyPage";
import TerrainStep from "@/pages/capacity/TerrainStep";
import ZonesStep from "@/pages/capacity/ZonesStep";
import SpotsStep from "./SpotsStep";

export type PlanStep = "terrain" | "zones" | "places";
const STEPS: PlanStep[] = ["terrain", "zones", "places"];
/** The estimator's steps navigate to these names; the plan maps "capacite" to its "places" step. */
const FROM_STUDY_STEP: Record<string, PlanStep> = {
  terrain: "terrain",
  zones: "zones",
  capacite: "places",
  photo: "places",
};
const PLAN_KEYS = [
  "outline",
  "parcels",
  "scaleFactor",
  "zones",
  "exclusions",
  "settings",
  "landmarks",
] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * Bloc 2, step "Plan" (P-A, 03/10/2026): the operator draws its parking on the IGN photo with the
 * estimator's terrain and zones steps, then generates and adjusts the spots. Autosaves like a study.
 */
export default function ParkingPlanPage() {
  const { step = "terrain" } = useParams<{ step: PlanStep }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: parking, isLoading: loadingParking } = useQuery({
    queryKey: ["parking"],
    queryFn: adminApi.getParking,
  });
  const parkingId = parking?.id;
  const [view, setView] = useState<ParkingPlanView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const pending = useRef<PlanPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<boolean>>(Promise.resolve(true));

  useEffect(() => {
    if (!parkingId) return;
    let cancelled = false;
    adminApi
      .getParkingPlan(parkingId)
      .then((v) => !cancelled && setView(v))
      .catch((e) => !cancelled && setLoadError(describeError(e)));
    return () => {
      cancelled = true;
    };
  }, [parkingId]);

  const flush = useCallback(async () => {
    if (!parkingId) return false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return saving.current;
    setSaveState("saving");
    saving.current = saving.current
      .catch(() => false)
      .then(() => adminApi.updateParkingPlan(parkingId, patch))
      .then(() => {
        setSaveState(Object.keys(pending.current).length ? "saving" : "saved");
        return true;
      })
      .catch(() => {
        pending.current = { ...patch, ...pending.current };
        setSaveState("error");
        return false;
      });
    return saving.current;
  }, [parkingId]);

  // The estimator's steps patch a study: only the plan's own fields are kept and saved.
  const update = useCallback(
    (patch: StudyPatch | PlanPatch) => {
      const own: PlanPatch = {};
      for (const key of PLAN_KEYS)
        if (key in patch)
          (own as Record<string, unknown>)[key] = (
            patch as Record<string, unknown>
          )[key];
      if (Object.keys(own).length === 0) return;
      setView((v) => (v ? { ...v, plan: { ...v.plan, ...own } } : v));
      pending.current = { ...pending.current, ...own };
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
    [flush],
  );

  useEffect(() => () => void flush(), [flush]);

  const go = useCallback(
    (s: string) => navigate(`/parking/plan/${FROM_STUDY_STEP[s] ?? s}`),
    [navigate],
  );

  // The plan seen as a study, for the reused steps.
  const study = useMemo<CapacityStudy | null>(
    () =>
      view && parking
        ? {
            ...view.plan,
            name: parking.name,
            results: {},
            carMarkers: [],
            createdAt: view.plan.updatedAt,
            updatedAt: view.plan.updatedAt,
            createdBy: null,
          }
        : null,
    [view, parking],
  );
  const estimateInput = useMemo(
    () => ({
      outline: view?.plan.outline ?? null,
      zones: view?.plan.zones ?? [],
      exclusions: view?.plan.exclusions ?? [],
      scaleFactor: view?.plan.scaleFactor ?? 1,
      settings: view?.plan.settings ?? {},
      // The edge layout starts its aisle from the entrance (else the handover point).
      anchor:
        (
          view?.plan.landmarks.find((l) => l.kind === "entrance") ??
          view?.plan.landmarks.find((l) => l.kind === "handover")
        )?.geometry.coordinates ?? null,
    }),
    [
      view?.plan.outline,
      view?.plan.zones,
      view?.plan.exclusions,
      view?.plan.scaleFactor,
      view?.plan.settings,
      view?.plan.landmarks,
    ],
  );
  const estimate = useEstimate(
    estimateInput,
    step === "places" && (view?.plan.zones.length ?? 0) > 0,
  );

  const replaceView = useCallback(
    (next: ParkingPlanView) => {
      setView(next);
      if (parking && next.totalCapacity !== parking.totalCapacity)
        queryClient.invalidateQueries({ queryKey: ["parking"] });
    },
    [parking, queryClient],
  );

  if (!STEPS.includes(step))
    return <Navigate to="/parking/plan/terrain" replace />;
  if (loadError) {
    return (
      <>
        <ParkingTabs />
        <p className="text-destructive">{loadError}</p>
      </>
    );
  }
  if (loadingParking || !parking || !view || !study) {
    return (
      <>
        <ParkingTabs />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  const props: StepProps = { study, update, flush, go };
  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{fr.parkingPlan.title}</h1>
        <p className="text-sm text-muted-foreground">{fr.parkingPlan.intro}</p>
      </div>
      <div className="-mx-4 flex flex-col border-y border-border sm:-mx-6 lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
        <StepsBar study={study} step={step} go={go} saveState={saveState} />
        <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
          {step === "terrain" && <TerrainStep key={parking.id} {...props} />}
          {step === "zones" && <ZonesStep key={parking.id} {...props} />}
          {step === "places" && (
            <SpotsStep
              key={parking.id}
              parkingId={parking.id}
              view={view}
              estimate={estimate}
              update={update}
              onView={replaceView}
              go={go}
            />
          )}
        </main>
      </div>
    </>
  );
}

function StepsBar({
  study,
  step,
  go,
  saveState,
}: {
  study: CapacityStudy;
  step: PlanStep;
  go: (s: string) => void;
  saveState: SaveState;
}) {
  const current = STEPS.indexOf(step);
  const reachable = [
    true,
    !!study.outline,
    !!study.outline && study.zones.length > 0,
  ];
  const t = fr.parkingPlan;
  return (
    <div className="flex shrink-0 items-center gap-7 border-b border-border px-6 py-3">
      {t.steps.map((label, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <button
            key={label}
            type="button"
            disabled={!reachable[i]}
            onClick={() => go(STEPS[i])}
            aria-current={state === "active" ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 text-[15px] font-bold uppercase disabled:cursor-not-allowed",
              state === "active"
                ? "text-primary"
                : state === "done"
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-[26px] w-[26px] items-center justify-center border font-mono text-sm",
                state === "active" &&
                  "border-primary bg-primary text-primary-foreground",
                state === "done" && "border-foreground",
                state === "todo" && "border-muted-foreground",
              )}
            >
              {state === "done" ? (
                <Check className="h-4 w-4" strokeWidth={3} />
              ) : (
                i + 1
              )}
            </span>
            {label}
          </button>
        );
      })}
      <span
        className={cn(
          "ml-auto w-28 text-right text-xs",
          saveState === "error" ? "text-destructive" : "text-muted-foreground",
        )}
        role="status"
        aria-live="polite"
      >
        {saveState === "saving"
          ? t.saving
          : saveState === "saved"
            ? t.saved
            : saveState === "error"
              ? t.saveError
              : ""}
      </span>
    </div>
  );
}
