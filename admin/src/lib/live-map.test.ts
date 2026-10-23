import { describe, expect, it } from "vitest";
import { ghosts, stopEta, tripLines } from "./live-map";
import type { LiveShuttles, LiveTrip } from "./types";

const airport = {
  id: null,
  kind: "airport" as const,
  name: "Terminal 1",
  lat: 45.72,
  lng: 5.08,
  instructions: null,
  builtIn: true,
};
const station = {
  id: "s1",
  kind: "station" as const,
  name: "Gare TGV",
  lat: 45.71,
  lng: 5.09,
  instructions: null,
  builtIn: false,
};

function trip(over: Partial<LiveTrip>): LiveTrip {
  return {
    id: "t1",
    direction: "dropoff",
    driverId: "d1",
    driverName: "Karim B",
    vehicle: { model: "Vito", colour: "blanc", plate: "AB-123-CD" },
    stop: airport,
    passengers: 3,
    startedAt: "2026-10-23T12:10:00Z",
    expiresAt: "2026-10-23T14:10:00Z",
    position: { lat: 45.715, lng: 5.07 },
    positionAgeSeconds: 10,
    toStop: { distanceM: 2100, etaMinutes: 7 },
    toParking: { distanceM: 900, etaMinutes: 3 },
    ...over,
  };
}

function live(
  trips: LiveTrip[],
  parking: { lat: number | null; lng: number | null } = {
    lat: 45.7,
    lng: 5.06,
  },
): LiveShuttles {
  return {
    serverTime: "2026-10-23T12:20:00Z",
    parking: { id: "p", name: "Parking des Cèdres", ...parking },
    stops: [airport, station],
    trips,
  };
}

describe("tripLines (direction B)", () => {
  it("draws the travelled part solid from the parking and the remaining part dotted to the stop", () => {
    const lines = tripLines(live([trip({})]));
    expect(lines.map((l) => l.part)).toEqual(["done", "left"]);
    expect(lines[0].coordinates).toEqual([
      [5.06, 45.7],
      [5.07, 45.715],
    ]);
    expect(lines[1].coordinates).toEqual([
      [5.07, 45.715],
      [5.08, 45.72],
    ]);
    expect(lines[0].colour).toBe("#1E5E2E");
  });

  it("colours a pick-up trip bright green", () => {
    expect(tripLines(live([trip({ direction: "pickup" })]))[0].colour).toBe(
      "#16A34A",
    );
  });

  it("draws nothing for a shuttle without a position, nor without the parking's coordinates", () => {
    expect(
      tripLines(
        live([trip({ position: null, toStop: null, toParking: null })]),
      ),
    ).toEqual([]);
    expect(tripLines(live([trip({})], { lat: null, lng: null }))).toEqual([]);
  });
});

describe("stopEta", () => {
  it("gives the soonest shuttle heading to that stop, and nothing for the others", () => {
    const l = live([
      trip({}),
      trip({ id: "t2", toStop: { distanceM: 4000, etaMinutes: 12 } }),
      trip({ id: "t3", stop: station, position: null, toStop: null }),
    ]);
    expect(stopEta(l, airport)).toBe(7);
    expect(stopEta(l, station)).toBeNull();
  });
});

describe("ghosts", () => {
  it("lists the running shuttles without a position", () => {
    expect(
      ghosts([trip({}), trip({ id: "t2", position: null })]).map((t) => t.id),
    ).toEqual(["t2"]);
  });
});
