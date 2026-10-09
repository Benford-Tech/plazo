import type { FileInput } from "@/lib/plan/parkingFiles";
import type { ParkingPlan, PlanPatch } from "@/lib/plan/types";

/**
 * Ctrl+Z in the plan editor (09/10/2026, « prends en compte le ctrl+Z »). A step is what a gesture
 * is about to change, kept whole so going back is exact: the drawing (the plan's own fields: the
 * zones and the IGN buildings that follow an outline go back with it) and/or the list of files.
 * Gestures of the same kind closer than BURST_MS make one step (a number typed digit by digit).
 */
export const PLAN_FIELDS = [
  "outline",
  "parcels",
  "scaleFactor",
  "zones",
  "exclusions",
  "settings",
  "landmarks",
] as const;

export type PlanFields = Required<PlanPatch>;

export interface Step {
  plan?: PlanFields;
  files?: FileInput[];
}

export const BURST_MS = 600;
/** Steps kept to go back: older ones are forgotten. */
export const MAX_STEPS = 100;

export function planFields(
  plan: Pick<ParkingPlan, (typeof PLAN_FIELDS)[number]>,
): PlanFields {
  return {
    outline: plan.outline,
    parcels: plan.parcels,
    scaleFactor: plan.scaleFactor,
    zones: plan.zones,
    exclusions: plan.exclusions,
    settings: plan.settings,
    landmarks: plan.landmarks,
  };
}

/** True when a patch touches the drawing (a patch of other fields changes nothing to undo). */
export function touchesPlan(patch: object): boolean {
  return PLAN_FIELDS.some((key) => key in patch);
}

const kindOf = (step: Step) =>
  `${step.plan ? "plan" : ""}+${step.files ? "files" : ""}`;

export class PlanHistory {
  private back: Step[] = [];
  private forward: Step[] = [];
  private last: { kind: string; at: number } | null = null;

  get canUndo(): boolean {
    return this.back.length > 0;
  }

  get canRedo(): boolean {
    return this.forward.length > 0;
  }

  /** Before (or right after) a gesture: what it changed. A new gesture forgets what was undone. */
  record(step: Step, now: number): void {
    const kind = kindOf(step);
    if (this.last && this.last.kind === kind && now - this.last.at < BURST_MS) {
      this.last.at = now;
      return;
    }
    this.back.push(step);
    if (this.back.length > MAX_STEPS) this.back.shift();
    this.forward = [];
    this.last = { kind, at: now };
  }

  /** The step to go back to; `current` gives the same parts as they are now, kept to redo. */
  undo(current: (step: Step) => Step): Step | null {
    const step = this.back.pop();
    if (!step) return null;
    this.forward.push(current(step));
    this.last = null;
    return step;
  }

  redo(current: (step: Step) => Step): Step | null {
    const step = this.forward.pop();
    if (!step) return null;
    this.back.push(current(step));
    this.last = null;
    return step;
  }

  /** A step that could not be applied goes back where it came from. */
  revert(direction: "undo" | "redo", step: Step): void {
    if (direction === "undo") {
      this.forward.pop();
      this.back.push(step);
    } else {
      this.back.pop();
      this.forward.push(step);
    }
  }

  /** After the automatic pass (it also lays spots and files), nothing before it can be undone. */
  clear(): void {
    this.back = [];
    this.forward = [];
    this.last = null;
  }
}
