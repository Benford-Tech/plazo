import { signal } from "@/test/arrival-fixtures";
import type { Reservation } from "./types";
import { agoLabel, liveSteps } from "./live-steps";

const r = (over: Partial<Reservation> = {}) =>
  ({ id: "r1", status: "upcoming", handover: "shuttle", returnFlight: null, arrivedAt: null, returnedAt: null, ...over }) as Reservation;

describe("liveSteps", () => {
  it("suit l'arrivée : en route avec le mot du client, rendez-vous, embarqué, garée", () => {
    const steps = liveSteps(r(), "arrival", signal({ state: "announced", announcedMinutes: 10, note: "Bouchons" }));
    expect(steps.map(s => [s.key, s.state])).toEqual([
      ["on_the_way", "now"],
      ["meeting_point", "todo"],
      ["boarded", "todo"],
      ["parked", "todo"],
    ]);
    expect(steps[0].details).toEqual(["J'arrive dans 10 min", "Bouchons"]);

    const boarded = liveSteps(r({ status: "arrived", boardingCheckIn: { driverFirstName: "Karim", at: "2026-11-12T10:20:00Z" } }), "arrival");
    expect(boarded.map(s => s.state)).toEqual(["done", "done", "now", "todo"]);
    expect(liveSteps(r({ status: "arrived", spot: { code: "A-01" } }), "arrival").at(-1)?.state).toBe("now");
  });

  it("sans navette pour un voiturier, et rien pour une réservation annulée", () => {
    expect(liveSteps(r({ handover: "valet" }), "arrival").map(s => s.key)).toEqual(["on_the_way", "meeting_point", "parked"]);
    expect(liveSteps(r({ status: "cancelled" }), "arrival")).toEqual([]);
  });

  it("suit le retour : atterri, rendez-vous, navette, de retour, rendue", () => {
    const steps = liveSteps(
      r({ status: "return_requested", returnFlight: "TO 3627", flightLandedAt: "2026-11-12T10:22:00Z" }),
      "return",
      null,
      { id: "t1", driverName: "Karim", startedAt: "2026-11-12T10:25:00Z" },
    );
    expect(steps.map(s => [s.key, s.state])).toEqual([
      ["landed", "done"],
      ["meeting_point", "todo"],
      ["shuttle", "now"],
      ["back", "todo"],
      ["returned", "todo"],
    ]);
  });

  it("dit l'âge en secondes puis en minutes", () => {
    expect(agoLabel(4.6)).toBe("il y a 4 s");
    expect(agoLabel(125)).toBe("il y a 2 min");
  });
});
