import { describe, expect, it } from "vitest";
import { makeFrame } from "@/lib/capacity/projection";
import { polygonAreaM2 } from "@/lib/capacity/projection";
import { rowAlong } from "./manualRow";
import type { Spot } from "./types";

const frame = makeFrame([5.08, 45.72], 1);
const at = (x: number, y: number) => frame.inverse([x, y]);
const zone = {
  id: "z1",
  name: "Zone A",
  geometry: {
    type: "Polygon" as const,
    coordinates: [[at(0, 0), at(40, 0), at(40, 20), at(0, 20), at(0, 0)]],
  },
};
const spot = (code: string, manual: boolean, row = 1): Spot =>
  ({
    id: code,
    zoneId: "z1",
    code,
    row,
    index: 1,
    kind: "standard",
    active: true,
    geometry: [],
    lon: 0,
    lat: 0,
    depth: null,
    fileLength: null,
    stayClass: null,
    manual,
  }) as Spot;

describe("rangée de places le long d'un trait (P-B, 07/10/2026)", () => {
  it("pose des places de 2,4 × 5 m côte à côte, perpendiculaires au trait et centrées dessus", () => {
    const spots = rowAlong(
      [at(0, 10), at(12.5, 10)],
      frame,
      2.4,
      5,
      [zone],
      [],
    );
    expect(spots).toHaveLength(5);
    expect(spots.map((s) => s.code)).toEqual([
      "M-01",
      "M-02",
      "M-03",
      "M-04",
      "M-05",
    ]);
    expect(spots[0]).toMatchObject({ zoneId: "z1", row: 1, index: 1 });
    for (const s of spots)
      expect(polygonAreaM2([s.geometry], 1)).toBeCloseTo(12, 0);
    // The first spot spans y 7.5 to 12.5 and starts 0.25 m in (12.5 − 5 × 2.4 split at both ends).
    const xy = spots[0].geometry.map((p) => frame.forward(p));
    expect(Math.min(...xy.map((p) => p[1]))).toBeCloseTo(7.5, 1);
    expect(Math.max(...xy.map((p) => p[1]))).toBeCloseTo(12.5, 1);
    expect(Math.min(...xy.map((p) => p[0]))).toBeCloseTo(0.25, 1);
  });

  it("suit un trait brisé et continue la numérotation après les places déjà posées", () => {
    const existing = [
      spot("A-01-01", false),
      spot("M-01", true),
      spot("M-02", true),
    ];
    const spots = rowAlong(
      [at(0, 0), at(5, 0), at(5, 5)],
      frame,
      2.5,
      5,
      [zone],
      existing,
    );
    expect(spots.map((s) => s.code)).toEqual(["M-03", "M-04", "M-05", "M-06"]);
    expect(spots.every((s) => s.row === 2)).toBe(true);
    expect(rowAlong([at(0, 0), at(1, 0)], frame, 2.5, 5, [zone], [])).toEqual(
      [],
    );
  });
});
