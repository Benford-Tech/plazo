import { makeFrame } from "@/lib/capacity/projection";
import type { Estimate } from "@/lib/capacity/estimate";
import { pointInRing, spotsFromLayout, zoneLetter } from "./numbering";

const origin: [number, number] = [5.08, 45.72];
const frame = makeFrame(origin, 1);
const ring = (x: number, y: number, w = 2.4, l = 5): [number, number][] =>
  [
    [x, y],
    [x + w, y],
    [x + w, y + l],
    [x, y + l],
    [x, y],
  ].map(p => frame.inverse(p as [number, number])) as [number, number][];

describe("numérotation des places", () => {
  it("lit la lettre de la zone", () => {
    expect(zoneLetter({ id: "1", name: "Zone B", geometry: { type: "Polygon", coordinates: [] } }, 0)).toBe("B");
    expect(zoneLetter({ id: "1", name: "Couvert", geometry: { type: "Polygon", coordinates: [] } }, 3)).toBe("CO");
    expect(zoneLetter({ id: "1", name: "", geometry: { type: "Polygon", coordinates: [] } }, 2)).toBe("C");
  });

  it("numérote par rangée (nord en premier) puis d'ouest en est", () => {
    // Two rows of three slots, rows along the east bearing (angle 0), the second row 5 m south.
    const slots = [ring(4.8, 0), ring(0, 0), ring(2.4, 0), ring(2.4, 10), ring(0, 10), ring(4.8, 10)];
    const result: Estimate = {
      usableArea: 0,
      totals: { selfPark: 6, valet24: 6, valet5: 6 },
      zones: [{ zoneId: "z", name: "Zone A", area: 0, usableArea: 0, layouts: { selfPark: { count: 6, angle: 0, pattern: [], slots }, valet24: { count: 6, angle: 0, pattern: [], slots }, valet5: { count: 6, angle: 0, pattern: [], slots } } }],
    };
    const spots = spotsFromLayout(result, [{ id: "z", name: "Zone A", geometry: { type: "Polygon", coordinates: [] } }], "valet24", frame, 5);
    expect(spots.map(s => s.code)).toEqual(["A-01-01", "A-01-02", "A-01-03", "A-02-01", "A-02-02", "A-02-03"]);
    expect(spots[0].row).toBe(1);
    expect(spots[5]).toMatchObject({ row: 2, index: 3 });
    expect(pointInRing(frame.inverse([1, 2]), spots[3].geometry)).toBe(true);
    expect(pointInRing(frame.inverse([1, 12]), spots[0].geometry)).toBe(true);
    expect(pointInRing(frame.inverse([1, 7]), spots[3].geometry)).toBe(false);
  });
});
