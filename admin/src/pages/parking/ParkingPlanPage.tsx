import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
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

  // R-A (07/10/2026): start again, in whole or in part. The declared capacity never changes.
  const reset = async (scope: ResetScope) => {
    if (!view || !parkingId) return;
    if (!window.confirm(fr.parkingPlan.resetConfirm[scope])) return;
    const settings = view.plan.settings;
    try {
      if (scope === "all") {
        update({
          outline: null,
          parcels: [],
          scaleFactor: 1,
          zones: [],
          exclusions: [],
          landmarks: [],
          settings: {
            ...settings,
            outlineSource: undefined,
            clipToParking: false,
            calibration: null,
            ignBuildingsSynced: false,
            zonesAuto: true,
          },
        });
      } else if (scope === "zones") {
        update({
          zones: [],
          exclusions: view.plan.exclusions.filter((e) => e.source === "ign"),
          settings: { ...settings, zonesAuto: true },
        });
      }
      if (view.spots.length) {
        const { data } = await adminApi.replaceSpots(
          parkingId,
          view.plan.layout ?? "valet24",
          [],
        );
        setView((v) => (v ? { ...v, spots: data.spots, activeSpots: 0 } : v));
      }
      await flush();
      toast.success(fr.parkingPlan.resetDone);
      if (scope === "all") go("terrain");
      else if (scope === "zones") go("zones");
    } catch (e) {
      toast.error(describeError(e));
    }
  };

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

  const props: StepProps = {
    study,
    update,
    flush,
    go,
    home: parking.lat != null && parking.lng != null ? [parking.lng, parking.lat] : null,
    // V-A: the saved outline is what Claude reads, so pending changes go first.
    suggestZones: async options => {
      await flush();
      return adminApi.suggestZones(parking.id, options);
    },
  };
  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{fr.parkingPlan.title}</h1>
        <p className="text-sm text-muted-foreground">{fr.parkingPlan.intro}</p>
      </div>
      <div className="-mx-4 flex flex-col border-y border-border sm:-mx-6 lg:h-[calc(100vh-280px)] lg:min-h-[600px]">
        <StepsBar
          study={study}
          step={step}
          go={go}
          saveState={saveState}
          onReset={reset}
        />
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

type ResetScope = "all" | "zones" | "spots";

function StepsBar({
  study,
  step,
  go,
  saveState,
  onReset,
}: {
  study: CapacityStudy;
  step: PlanStep;
  go: (s: string) => void;
  saveState: SaveState;
  onReset: (scope: ResetScope) => void;
}) {
  const [resetOpen, setResetOpen] = useState(false);
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
                ? "text-lime-deep"
                : state === "done"
                  ? "text-foreground"
                  : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-[26px] w-[26px] items-center justify-center border font-mono text-sm",
                state === "active" &&
                  "border-lime-deep bg-primary text-primary-foreground",
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
      <div className="relative ml-auto">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={resetOpen}
          disabled={!study.outline}
          onClick={() => setResetOpen((o) => !o)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          {t.reset}
        </button>
        {resetOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-80 border border-border bg-card p-1 shadow-lg"
          >
            {(
              [
                ["all", t.resetAll, t.resetAllHelp],
                ["zones", t.resetZones, t.resetZonesHelp],
                ["spots", t.resetSpots, t.resetSpotsHelp],
              ] as const
            ).map(([scope, label, help]) => (
              <button
                key={scope}
                type="button"
                role="menuitem"
                onClick={() => {
                  setResetOpen(false);
                  onReset(scope);
                }}
                className="block w-full px-3 py-2 text-left hover:bg-accent"
              >
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-muted-foreground">
                  {help}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <span
        className={cn(
          "w-28 text-right text-xs",
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
