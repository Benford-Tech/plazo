import { describe, expect, it } from "vitest";
import { eraseZones, nextLetter, paintZones, strokeArea } from "./brush";
import { frameFor, polygonToMulti } from "./estimate";
import { areaOf } from "./geometry";
import { fromL93, polygonAreaM2 } from "./projection";
import { l93Rect } from "./testUtils";
import type { GeoPolygon, Zone } from "./types";

const outline: GeoPolygon = { type: "Polygon", coordinates: l93Rect(100, 60) };
const frame = frameFor({ outline, zones: [], scaleFactor: 1 })!;
let n = 0;
const ctx = { frame, outline, name: (l: string) => `Zone ${l}`, newId: () => `id${++n}` };
const m2 = (z: Zone) => polygonAreaM2(z.geometry.coordinates, 1);
// A stroke along y = 30 from x = 10 to x = 50, in L93 (the frame's origin is the outline's corner).
const stroke = (x0: number, x1: number, y: number) => [fromL93([868000 + x0, 6516000 + y]), fromL93([868000 + x1, 6516000 + y])];

describe("pinceau des zones (P-A, 07/10/2026)", () => {
  it("un trait fait une surface de la largeur du pinceau, coupée au contour", () => {
    const area = strokeArea(stroke(10, 50, 30), 6, ctx);
    // 40 m × 6 m plus the two round ends (a 6 m disc).
    expect(areaOf(area)).toBeCloseTo(240 + Math.PI * 9, -1);
    const outside = strokeArea(stroke(90, 130, 30), 6, ctx);
    expect(areaOf(outside)).toBeLessThan(240 + Math.PI * 9);
    expect(areaOf(outside)).toBeGreaterThan(60);
    expect(strokeArea([], 6, ctx)).toEqual([]);
  });

  it("peint une nouvelle zone, puis l'agrandit quand le trait la touche, et fusionne deux zones reliées", () => {
    const one = paintZones([], strokeArea(stroke(10, 50, 30), 6, ctx), ctx);
    expect(one.map(z => z.name)).toEqual(["Zone A"]);
    const two = paintZones(one, strokeArea(stroke(60, 90, 30), 6, ctx), ctx);
    expect(two.map(z => z.name)).toEqual(["Zone A", "Zone B"]);
    const grown = paintZones(two, strokeArea(stroke(10, 50, 34), 6, ctx), ctx);
    expect(grown.map(z => z.id)).toEqual([one[0].id, two[1].id]);
    expect(m2(grown[0])).toBeGreaterThan(m2(two[0]) + 100);
    const merged = paintZones(grown, strokeArea(stroke(45, 65, 30), 6, ctx), ctx);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe(one[0].id);
    const strokeM2 = areaOf(strokeArea(stroke(45, 65, 30), 6, ctx));
    expect(m2(merged[0])).toBeGreaterThanOrEqual(m2(grown[0]) + m2(grown[1]) - 1);
    expect(m2(merged[0])).toBeLessThanOrEqual(m2(grown[0]) + m2(grown[1]) + strokeM2 + 1);
  });

  it("la gomme retire la surface, coupe une zone en deux et la fait disparaître quand tout est effacé", () => {
    const zone: Zone = { id: "z", name: "Zone A", geometry: { type: "Polygon", coordinates: l93Rect(40, 20, 868010, 6516010) } };
    const nick = eraseZones([zone], strokeArea(stroke(0, 20, 20), 6, ctx), ctx);
    expect(nick).toHaveLength(1);
    expect(nick[0].id).toBe("z");
    expect(m2(nick[0])).toBeLessThan(800);
    const cut = eraseZones([zone], strokeArea([fromL93([868030, 6516000]), fromL93([868030, 6516040])], 6, ctx), ctx);
    expect(cut.map(z => z.name)).toEqual(["Zone A", "Zone B"]);
    expect(m2(cut[0]) + m2(cut[1])).toBeCloseTo(800 - 6 * 20, 0);
    const gone = eraseZones([zone], polygonToMulti(frame, outline), ctx);
    expect(gone).toEqual([]);
    // A zone the stroke does not touch is returned as is.
    const far = eraseZones([zone], strokeArea(stroke(80, 95, 55), 6, ctx), ctx);
    expect(far[0]).toBe(zone);
  });

  it("donne la première lettre libre", () => {
    const name = (l: string) => `Zone ${l}`;
    expect(nextLetter([], name)).toBe("A");
    expect(nextLetter([{ id: "1", name: "Zone A" }, { id: "3", name: "Zone C" }] as Zone[], name)).toBe("B");
  });
});
