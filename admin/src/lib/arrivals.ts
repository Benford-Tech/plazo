import { fr } from "./fr";
import type { ArrivalKind, ArrivalSignal, PlanningRow, ShuttleTripSummary } from "./types";

/** "Camille Martin" -> "C. Martin" (the banner stays short). */
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0][0].toUpperCase()}. ${parts.slice(1).join(" ")}`;
}

/**
 * The live signal of each row: the fresher polled list wins over the one attached to the
 * planning (which is refreshed less often). Rows of the other column's kind are ignored.
 */
export function withLiveSignals(rows: PlanningRow[], kind: ArrivalKind, live: ArrivalSignal[] | undefined): PlanningRow[] {
  if (!live) return rows;
  return rows.map(r => ({ ...r, arrivalSignal: live.find(s => s.kind === kind && s.reservationId === r.id) ?? null }));
}

/** Travellers sharing their position or at the meeting point go to the top; the rest keeps its time order. */
export function liveFirst(rows: PlanningRow[]): PlanningRow[] {
  const rank = (r: PlanningRow) => (r.arrivalSignal?.state === "at_meeting_point" ? 0 : r.arrivalSignal?.state === "sharing" ? 1 : 2);
  return rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => rank(a.r) - rank(b.r) || (rank(a.r) === 1 ? (a.r.arrivalSignal!.etaMinutes ?? 999) - (b.r.arrivalSignal!.etaMinutes ?? 999) : 0) || a.i - b.i)
    .map(x => x.r);
}

/** One banner per event: a new sharing, a new announce (or new minutes), an arrival at the meeting point. */
export function eventKey(s: ArrivalSignal): string {
  return `${s.id}:${s.state}:${s.startedAt}:${s.announcedMinutes ?? ""}`;
}

export function bannerText(s: ArrivalSignal): string {
  const t = fr.planning;
  const who = shortName(s.customerName);
  if (s.state === "announced") return t.toastAnnounced(who, s.announcedMinutes ?? s.etaMinutes ?? 0, s.plate);
  if (s.state === "at_meeting_point") return s.kind === "return" ? t.toastAtMeetingPoint(who, s.plate) : t.toastAtReception(who, s.plate);
  return t.toastApproaching(who, s.etaMinutes, s.plate);
}

/** Age of the position now, from the server's figure and the time since it was fetched. */
export function positionAge(s: ArrivalSignal, fetchedAt: number, now: number): number | null {
  if (s.positionAgeSeconds === null) return null;
  return s.positionAgeSeconds + Math.max(0, Math.round((now - fetchedAt) / 1000));
}

/**
 * Places the traveller and the meeting point in a box (local equirectangular projection, north
 * up, same scale on both axes), the meeting point never on the edge.
 */
export function miniMapPoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  box: { width: number; height: number; padding: number },
): { me: { x: number; y: number }; meeting: { x: number; y: number } } {
  const k = Math.cos(((from.lat + to.lat) / 2) * (Math.PI / 180));
  const dx = (from.lng - to.lng) * k;
  const dy = to.lat - from.lat; // screen y grows southwards
  const w = box.width - 2 * box.padding;
  const h = box.height - 2 * box.padding;
  const span = Math.max(Math.abs(dx) / w, Math.abs(dy) / h, 1e-9);
  const cx = box.width / 2;
  const cy = box.height / 2;
  // Centre the segment in the box.
  return {
    me: { x: cx + dx / span / 2, y: cy + dy / span / 2 },
    meeting: { x: cx - dx / span / 2, y: cy - dy / span / 2 },
  };
}

/**
 * The running shuttle trip of each return row: the polled list wins over the one attached to the
 * planning (refreshed less often); without a polled list, the planning's own stays.
 */
export function withShuttleTrips(rows: PlanningRow[], trips: ShuttleTripSummary[] | undefined): PlanningRow[] {
  if (!trips) return rows;
  return rows.map(r => {
    const trip = trips.find(t => t.reservationIds.includes(r.id));
    return { ...r, shuttleTrip: trip ? { id: trip.id, driverName: trip.driverName, startedAt: trip.startedAt } : null };
  });
}
