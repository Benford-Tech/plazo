import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ParkingTabs } from "@/components/parking/ParkingTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import type { CapacityStudy, StudyPatch } from "@/lib/capacity/types";
import { useEstimate } from "@/lib/capacity/useEstimate";
import { describeError, fr } from "@/lib/fr";
import type { ParkingPlanView, PlanPatch } from "@/lib/plan/types";
import { PlanEditor } from "./plan/PlanEditor";
import { TOOLS, type ResetScope, type Tool } from "./plan/types";

/** The old step names still open the editor, on the matching tool. */
const LEGACY_TOOLS: Record<string, Tool> = {
  terrain: "contour",
  zones: "parking",
  places: "spots",
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
  const { step } = useParams<{ step?: string }>();
  const initialTool: Tool | null = step
    ? (LEGACY_TOOLS[step] ??
      (TOOLS.includes(step as Tool) ? (step as Tool) : null))
    : null;
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
  // The count on top follows every stroke: the engine runs on the input settled for 500 ms.
  const [settledInput, setSettledInput] = useState(estimateInput);
  useEffect(() => {
    const timer = setTimeout(() => setSettledInput(estimateInput), 500);
    return () => clearTimeout(timer);
  }, [estimateInput]);
  const estimate = useEstimate(
    settledInput,
    (settledInput.zones.length ?? 0) > 0,
  );
  // R-C: an empty plan is prepared on its own at its first opening only (not after a reset).
  const autoRun = useRef<boolean | null>(null);
  if (view && autoRun.current === null)
    autoRun.current = !view.plan.outline && !view.spots.length;

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
    } catch (e) {
      toast.error(describeError(e));
    }
  };

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

  return (
    <>
      <ParkingTabs />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{fr.parkingPlan.title}</h1>
        <p className="text-sm text-muted-foreground">{fr.parkingPlan.intro}</p>
      </div>
      <PlanEditor
        key={parking.id}
        parkingId={parking.id}
        parking={parking}
        view={view}
        study={study}
        estimate={estimate}
        update={update}
        flush={flush}
        onView={replaceView}
        // V-A: the saved outline is what Claude reads, so pending changes go first.
        suggest={async (options) => {
          await flush();
          return adminApi.suggestZones(parking.id, options);
        }}
        initialTool={initialTool}
        autoRun={autoRun.current === true}
        saveState={saveState}
        onReset={reset}
      />
    </>
  );
}
