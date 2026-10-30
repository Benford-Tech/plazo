import type { PlanningRow } from "./types";

/**
 * The planning that moves with the day (direction A of 30/10/2026, as in Plazo Pro): today, the next arrival and the
 * next departure over the columns, with how long until each; what is done folded under « Déjà passés ».
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

/** The column's earliest row not done yet. */
export function nextOf(items: PlanningRow[], kind: "arrival" | "return"): PlanningRow | null {
  const at = (r: PlanningRow) => new Date(kind === "arrival" ? r.arrivalAt : r.returnAt).getTime();
  return items.filter(r => !isDone(r, kind)).reduce<PlanningRow | null>((best, r) => (best && at(best) <= at(r) ? best : r), null);
}

/** « dans 25 min », « dans 1 h 05 », « maintenant », « en retard · 12 min ». */
export function untilLabel(at: string, now: number): { text: string; late: boolean } {
  const minutes = (new Date(at).getTime() - now) / 60_000;
  if (minutes <= -1) return { text: `en retard · ${duration(Math.floor(-minutes))}`, late: true };
  if (minutes < 1) return { text: "maintenant", late: false };
  return { text: `dans ${duration(Math.ceil(minutes))}`, late: false };
}
