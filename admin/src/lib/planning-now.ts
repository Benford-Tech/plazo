import { timeOf } from "./datetime";
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

const timeOfRow = (r: PlanningRow, kind: "arrival" | "return") => new Date(kind === "arrival" ? r.arrivalAt : r.returnAt).getTime();

/** Late (30/10/2026, « mais aussi ceux en retard »): not done a minute or more after its time, the latest first. */
export function lateOf(items: PlanningRow[], kind: "arrival" | "return", now: number): PlanningRow[] {
  return items
    .filter(r => !isDone(r, kind) && timeOfRow(r, kind) <= now - 60_000)
    .sort((a, b) => timeOfRow(a, kind) - timeOfRow(b, kind));
}

/** The column's earliest row not done yet and not late. */
export function nextOf(items: PlanningRow[], kind: "arrival" | "return", now: number): PlanningRow | null {
  return items
    .filter(r => !isDone(r, kind) && timeOfRow(r, kind) > now - 60_000)
    .reduce<PlanningRow | null>((best, r) => (best && timeOfRow(best, kind) <= timeOfRow(r, kind) ? best : r), null);
}

/** « dans 25 min », « dans 1 h 05 », « maintenant », « en retard · 12 min ». */
export function untilLabel(at: string, now: number): { text: string; late: boolean } {
  const minutes = (new Date(at).getTime() - now) / 60_000;
  if (minutes <= -1) return { text: `en retard · ${duration(Math.floor(-minutes))}`, late: true };
  if (minutes < 1) return { text: "maintenant", late: false };
  return { text: `dans ${duration(Math.ceil(minutes))}`, late: false };
}

/**
 * The flight and where the traveller goes (30/10/2026, « afficher l'heure du vol et la destination si possible ») :
 * « AF 7641 · décolle 10:35 · Lisbonne » and « vers Gare TGV » for an arrival, « TO 3627 · atterri 14:12 · de Porto » and
 * « à l'aéroport » for a departure; nothing for a part that is not known (a valet booking has no stop).
 */
export function travelOf(r: PlanningRow, kind: "arrival" | "return"): { flight: string | null; place: string | null } {
  const parts: string[] = [];
  if (kind === "arrival") {
    if (r.departureFlight) {
      parts.push(r.departureFlight);
      const at = r.departureEstimatedAt ?? r.departureScheduledAt;
      if (at) parts.push(`décolle ${timeOf(at)}`);
      if (r.departureCity) parts.push(r.departureCity);
    }
  } else if (r.returnFlight) {
    parts.push(r.returnFlight);
    if (r.flightLandedAt) parts.push(`atterri ${timeOf(r.flightLandedAt)}`);
    else if (r.flightEstimatedAt ?? r.flightScheduledAt) parts.push(`atterrit ${timeOf((r.flightEstimatedAt ?? r.flightScheduledAt)!)}`);
    if (r.returnCity) parts.push(`de ${r.returnCity}`);
  }
  const place =
    r.handover === "valet" ? null : kind === "arrival" ? `vers ${r.stopName ?? "l'aéroport"}` : `à ${r.stopName ?? "l'aéroport"}`;
  return { flight: parts.length ? parts.join(" · ") : null, place };
}
