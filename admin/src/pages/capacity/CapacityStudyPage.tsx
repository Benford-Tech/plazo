import { Check } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { adminApi } from "@/lib/api";
import { summarize } from "@/lib/capacity/estimate";
import type { CapacityStudy, StudyPatch } from "@/lib/capacity/types";
import { useEstimate } from "@/lib/capacity/useEstimate";
import { describeError, fr } from "@/lib/fr";
import { cn } from "@/lib/utils";
import CapacityStep from "./CapacityStep";
import PhotoStep from "./PhotoStep";
import TerrainStep from "./TerrainStep";
import ZonesStep from "./ZonesStep";

export type StepKey = "terrain" | "zones" | "capacite" | "photo";
const STEPS: StepKey[] = ["terrain", "zones", "capacite"];

export interface StepProps {
  study: CapacityStudy;
  update: (patch: StudyPatch) => void;
  /** Saves now (pending changes included); false when the save failed. */
  flush: () => Promise<boolean>;
  go: (step: StepKey) => void;
  /** Which geo routes the terrain step calls: the platform's for a capacity study. */
  geoScope?: "operator" | "platform";
}

type SaveState = "idle" | "saving" | "saved" | "error";

/** One capacity study: loads it, autosaves every change (debounced) and shows the current step. */
export default function CapacityStudyPage() {
  const { id = "", step = "terrain" } = useParams<{ id: string; step: StepKey }>();
  const navigate = useNavigate();
  const [study, setStudy] = useState<CapacityStudy | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const pending = useRef<StudyPatch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saving = useRef<Promise<boolean>>(Promise.resolve(true));

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getCapacityStudy(id)
      .then(s => !cancelled && setStudy(s))
      .catch(e => !cancelled && setLoadError(describeError(e)));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return saving.current;
    setSaveState("saving");
    saving.current = saving.current
      .catch(() => false)
      .then(() => adminApi.updateCapacityStudy(id, patch))
      .then(() => {
        setSaveState(Object.keys(pending.current).length ? "saving" : "saved");
        return true;
      })
      .catch(() => {
        // Keep the changes for the next attempt.
        pending.current = { ...patch, ...pending.current };
        setSaveState("error");
        return false;
      });
    return saving.current;
  }, [id]);

  const update = useCallback(
    (patch: StudyPatch) => {
      setStudy(s => (s ? { ...s, ...patch } : s));
      pending.current = { ...pending.current, ...patch };
      setSaveState("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 800);
    },
    [flush],
  );

  // Save what is pending when leaving the study.
  useEffect(() => () => void flush(), [flush]);

  const go = useCallback((s: StepKey) => navigate(`/plateforme/capacite/${id}/${s}`), [id, navigate]);

  const estimateInput = useMemo(
    () => ({
      outline: study?.outline ?? null,
      zones: study?.zones ?? [],
      exclusions: study?.exclusions ?? [],
      scaleFactor: study?.scaleFactor ?? 1,
      settings: study?.settings ?? {},
    }),
    [study?.outline, study?.zones, study?.exclusions, study?.scaleFactor, study?.settings],
  );
  const needsEstimate = (step === "capacite" || step === "photo") && !!study?.zones.length;
  const estimate = useEstimate(estimateInput, needsEstimate);

  // Keep the stored summary in line with the last computation.
  const summaryKey = estimate.result ? JSON.stringify(summarize(estimate.result).zones) : null;
  useEffect(() => {
    if (!estimate.result || !study || estimate.computing) return;
    if (JSON.stringify(study.results?.zones ?? null) === summaryKey) return;
    update({ results: summarize(estimate.result) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryKey, estimate.computing]);

  if (!["terrain", "zones", "capacite", "photo"].includes(step)) return <Navigate to={`/plateforme/capacite/${id}/terrain`} replace />;
  if (loadError) {
    return (
      <div className="p-6">
        <p className="text-destructive">{loadError}</p>
        <Link to="/plateforme/capacite" className="text-primary underline">
          {fr.capacity.listTitle}
        </Link>
      </div>
    );
  }
  if (!study) return <div className="p-6 text-muted-foreground">{fr.common.loading}</div>;

  const props: StepProps = { study, update, flush, go, geoScope: "platform" };
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StepsBar study={study} step={step} go={go} saveState={saveState} onRename={name => update({ name })} />
      <main className="flex min-h-0 flex-1">
        {step === "terrain" && <TerrainStep key={id} {...props} />}
        {step === "zones" && <ZonesStep key={id} {...props} />}
        {step === "capacite" && <CapacityStep key={id} {...props} estimate={estimate} />}
        {step === "photo" && <PhotoStep key={id} {...props} estimate={estimate} />}
      </main>
    </div>
  );
}

function StepsBar({
  study,
  step,
  go,
  saveState,
  onRename,
}: {
  study: CapacityStudy;
  step: StepKey;
  go: (s: StepKey) => void;
  saveState: SaveState;
  onRename: (name: string) => void;
}) {
  const current = step === "photo" ? 2 : STEPS.indexOf(step);
  const reachable = [true, !!study.outline, !!study.outline && study.zones.length > 0];
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(study.name);

  const commit = () => {
    setEditing(false);
    const trimmed = name.trim();
    if (trimmed && trimmed !== study.name) onRename(trimmed.slice(0, 120));
    else setName(study.name);
  };

  return (
    <div className="flex shrink-0 items-center gap-7 border-b border-border px-6 py-3">
      {fr.capacity.steps.map((label, i) => {
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
              state === "active" ? "text-primary" : state === "done" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-[26px] w-[26px] items-center justify-center border font-mono text-sm",
                state === "active" && "border-primary bg-primary text-primary-foreground",
                state === "done" && "border-foreground",
                state === "todo" && "border-muted-foreground",
              )}
            >
              {state === "done" ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            {label}
          </button>
        );
      })}
      <span className="ml-auto flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
        {fr.capacity.study} :
        {editing ? (
          <input
            autoFocus
            value={name}
            maxLength={120}
            onChange={e => setName(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setName(study.name);
                setEditing(false);
              }
            }}
            className="h-8 w-80 border border-border bg-card px-2 font-bold text-foreground"
          />
        ) : (
          <button type="button" onClick={() => setEditing(true)} title={fr.capacity.rename} className="truncate font-bold text-foreground hover:underline">
            {study.name}
          </button>
        )}
        <span
          className={cn("w-28 text-right text-xs", saveState === "error" ? "text-destructive" : "text-muted-foreground")}
          role="status"
          aria-live="polite"
        >
          {saveState === "saving" ? fr.capacity.saving : saveState === "saved" ? fr.capacity.saved : saveState === "error" ? fr.capacity.saveError : ""}
        </span>
      </span>
    </div>
  );
}
