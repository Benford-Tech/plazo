import { describe, expect, it } from "vitest";
import { metresBetween, railDestination, railPlace, railProgress, railState } from "../shuttle-rail";
import type { AirportLive, LatLng, LiveShuttle } from "../types";

const parking: LatLng = { lat: 45.73, lng: 5.05 };
const airport: LatLng = { lat: 45.7256, lng: 5.0811 };
/** A point `f` of the way from the parking to the airport. */
const along = (f: number): LatLng => ({ lat: parking.lat + (airport.lat - parking.lat) * f, lng: parking.lng + (airport.lng - parking.lng) * f });

const shuttle = (id: string, over: Partial<LiveShuttle> = {}): LiveShuttle => ({
  id,
  parking: "soleil",
  direction: "dropoff",
  vehicle: { model: null, colour: null },
  position: along(0.5),
  positionAgeSeconds: 10,
  startedAt: "2026-10-14T09:50:00Z",
  ...over,
});

const live = (shuttles: LiveShuttle[]): AirportLive => ({
  serverTime: "2026-10-14T10:00:00Z",
  airport: { code: "LYS", name: "Lyon Saint-Exupéry", slug: "lyon-saint-exupery", location: airport },
  parkings: [{ slug: "soleil", title: "Parking soleil", services: ["shuttle"], shuttleMinutes: 5, location: parking, liveShuttle: true }],
  shuttles,
});

describe("rail progress (L3, 14/10/2026)", () => {
  it("measures the straight distances, in metres", () => {
    expect(metresBetween(parking, parking)).toBe(0);
    // About 2.5 km from this parking to the terminals.
    expect(metresBetween(parking, airport)).toBeGreaterThan(2300);
    expect(metresBetween(parking, airport)).toBeLessThan(2700);
  });

  it("distance(parking → shuttle) ÷ distance(parking → airport), kept within 5–95 %", () => {
    expect(railProgress(parking, airport, along(0.25))).toBeCloseTo(0.25, 2);
    expect(railProgress(parking, airport, along(0.62))).toBeCloseTo(0.62, 2);
    expect(railProgress(parking, airport, parking)).toBe(0.05);
    expect(railProgress(parking, airport, along(1.3))).toBe(0.95);
    expect(railProgress(parking, parking, along(0.5))).toBeNull();
  });
});

describe("rail of a parking", () => {
  it("its running shuttles only, freshest first, at most three markers, none without a position", () => {
    const state = railState(
      live([
        shuttle("a", { position: along(0.2), positionAgeSeconds: 30 }),
        shuttle("b", { position: along(0.7), positionAgeSeconds: 8 }),
        shuttle("c", { position: null, positionAgeSeconds: null }),
        shuttle("d", { position: along(0.4), positionAgeSeconds: 12 }),
        shuttle("e", { position: along(0.9), positionAgeSeconds: 50 }),
        shuttle("other", { parking: "pistes", positionAgeSeconds: 1 }),
      ]),
      "soleil",
    );
    expect(state.running).toBe(5);
    expect(state.markers.map(m => m.id)).toEqual(["b", "d", "a"]);
    expect(state.markers[0].progress).toBeCloseTo(0.7, 2);
    expect(state.ageSeconds).toBe(8);
  });

  it("nothing while no shuttle runs, or without the live answer", () => {
    expect(railState(live([]), "soleil")).toEqual({ running: 0, markers: [], ageSeconds: null });
    expect(railState(null, "soleil")).toEqual({ running: 0, markers: [], ageSeconds: null });
    // A running shuttle without a position: no marker, no age.
    expect(railState(live([shuttle("a", { position: null, positionAgeSeconds: null })]), "soleil")).toEqual({ running: 1, markers: [], ageSeconds: null });
  });

  it("uses the card's position when the live answer has none, and turns the minibus back towards the parking", () => {
    const answer = live([shuttle("a", { position: along(0.5), heading: 300 }), shuttle("b", { position: along(0.3), heading: 120 })]);
    answer.parkings[0].location = null;
    expect(railState(answer, "soleil").markers).toEqual([]);
    const markers = railState(answer, "soleil", parking).markers;
    // The route runs east-south-east (≈ 101°): a heading of 300° goes back to the parking, 120° to the terminal.
    expect(markers.map(m => [m.id, m.towardsParking])).toEqual([
      ["a", true],
      ["b", false],
    ]);
  });

  it("names Terminal 1 at Lyon (Terminal 2 closed on 01/04/2026), « Aéroport » elsewhere", () => {
    expect(railDestination("LYS")).toBe("Terminal 1");
    expect(railDestination("CDG")).toBe("Aéroport");
    expect(railDestination(undefined)).toBe("Aéroport");
    expect([railPlace("lys"), railPlace("CDG"), railPlace(null)]).toEqual(["terminal1", "airport", "airport"]);
  });
});
