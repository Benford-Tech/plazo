import type { PlanningRow } from "./types";

/**
 * The planning that moves with the day (direction B of 30/10/2026): today, each column splits at a « Maintenant »
 * line, what is done faded above it, what comes below with how long until it for the next hour.
 */

const CLOSED_RETURNS = new Set(["back_at_parking", "returned", "cancelled", "no_show"]);

/** Done: an arrival once the traveller came, a departure once the car is back or the stay closed (as in Plazo Pro). */
export function isDone(r: PlanningRow, kind: "arrival" | "return"): boolean {
  return kind === "arrival" ? r.status !== "upcoming" : CLOSED_RETURNS.has(r.status);
}

/** The column's done rows, in their order, then the others. */
export function splitAtNow(items: PlanningRow[], kind: "arrival" | "return"): { past: PlanningRow[]; coming: PlanningRow[] } {
  return { past: items.filter(r => isDone(r, kind)), coming: items.filter(r => !isDone(r, kind)) };
}

const duration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const m = minutes % 60;
  return `${Math.floor(minutes / 60)} h${m === 0 ? "" : ` ${String(m).padStart(2, "0")}`}`;
};

/** « dans 25 min » within the hour, « maintenant », « en retard · 12 min »; nothing further away. */
export function untilLabel(at: string, now: number): { text: string; late: boolean } | null {
  const minutes = (new Date(at).getTime() - now) / 60_000;
  if (minutes <= -1) return { text: `en retard · ${duration(Math.floor(-minutes))}`, late: true };
  if (minutes < 1) return { text: "maintenant", late: false };
  if (minutes > 60) return null;
  return { text: `dans ${duration(Math.ceil(minutes))}`, late: false };
}
