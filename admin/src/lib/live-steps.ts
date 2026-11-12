import type { ArrivalSignal, PlanningRow, Reservation } from "./types";

/**
 * What the traveller did, for the planning's live panel (12/11/2026, « la réservation en direct depuis le planning »):
 * a short timeline read from data the pro space already has (the live arrival signal, the boarding check-in, the
 * status, the spot or file, the return flight and the shuttle trip). Nothing is invented: a step not known stays to do.
 */

export type LiveStepState = "done" | "now" | "todo";

export interface LiveStep {
  key: string;
  label: string;
  /** When it happened, when known. */
  at: string | null;
  /** The traveller's words (« J'arrive dans 10 min », their note), quoted by the panel. */
  details: string[];
  state: LiveStepState;
}

const AFTER_ARRIVAL = new Set(["arrived", "shuttled_out", "return_requested", "back_at_parking", "returned"]);
const BACK = new Set(["back_at_parking", "returned"]);

type Draft = Omit<LiveStep, "state"> & { done: boolean };

/** The last step done is the current one; the others done before it, the rest to do. */
function withStates(steps: Draft[]): LiveStep[] {
  const last = steps.reduce((at, s, i) => (s.done ? i : at), -1);
  return steps.map(({ done, ...s }, i) => ({ ...s, state: i === last ? "now" : done ? "done" : "todo" }));
}

const words = (s: ArrivalSignal | null): string[] =>
  [s?.state === "announced" && s.announcedMinutes !== null ? `J'arrive dans ${s.announcedMinutes} min` : null, s?.note?.trim() || null].filter(
    (w): w is string => !!w,
  );

/** The arrival of the traveller at the parking: on the way, at the meeting point, boarded, car parked. */
function arrivalSteps(r: Reservation, s: ArrivalSignal | null): LiveStep[] {
  const valet = r.handover === "valet";
  const arrived = AFTER_ARRIVAL.has(r.status);
  const parked = !!(r.spot || r.file || r.spotId || r.keyHook);
  const boarded = !!r.boardingCheckIn || (r.status !== "upcoming" && r.status !== "arrived" && arrived);
  const steps: Draft[] = [
    { key: "on_the_way", label: "En route", at: s?.startedAt ?? null, details: words(s), done: !!s || arrived },
    {
      key: "meeting_point",
      label: "Au point de rendez-vous",
      at: s?.atMeetingPointAt ?? (s ? null : r.arrivedAt),
      details: [],
      done: s?.state === "at_meeting_point" || !!s?.atMeetingPointAt || arrived,
    },
  ];
  if (!valet) {
    steps.push({ key: "boarded", label: "Embarqué dans la navette", at: r.boardingCheckIn?.at ?? null, details: [], done: boarded });
  }
  steps.push({ key: "parked", label: "Voiture garée", at: null, details: [], done: parked });
  return withStates(steps);
}

/** The return: landed, at the meeting point, shuttle on its way, back at the parking, car handed over. */
function returnSteps(r: Reservation, s: ArrivalSignal | null, trip: PlanningRow["shuttleTrip"]): LiveStep[] {
  const valet = r.handover === "valet";
  const back = BACK.has(r.status);
  const steps: Draft[] = [];
  if (r.returnFlight) {
    steps.push({ key: "landed", label: "Atterri", at: r.flightLandedAt ?? null, details: [], done: !!r.flightLandedAt || back });
  }
  steps.push({
    key: "meeting_point",
    label: "Au point de rendez-vous",
    at: s?.atMeetingPointAt ?? null,
    details: words(s),
    done: s?.state === "at_meeting_point" || !!s?.atMeetingPointAt || back,
  });
  if (!valet) steps.push({ key: "shuttle", label: "Navette en route", at: trip?.startedAt ?? null, details: [], done: !!trip || back });
  steps.push({ key: "back", label: "De retour au parking", at: null, details: [], done: back });
  steps.push({ key: "returned", label: "Voiture rendue", at: r.returnedAt, details: [], done: r.status === "returned" });
  return withStates(steps);
}

export function liveSteps(
  r: Reservation,
  kind: "arrival" | "return",
  signal: ArrivalSignal | null = null,
  trip: PlanningRow["shuttleTrip"] = null,
): LiveStep[] {
  if (r.status === "cancelled" || r.status === "no_show") return [];
  return kind === "arrival" ? arrivalSteps(r, signal) : returnSteps(r, signal, trip);
}

/** « il y a 4 s », « il y a 2 min ». */
export function agoLabel(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return s < 60 ? `il y a ${s} s` : `il y a ${Math.floor(s / 60)} min`;
}
