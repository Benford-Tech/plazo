import { describe, expect, it } from "vitest";
import { ceilingOf, estimate, subtractFromOutline, summarize, unionPolygons, frameFor } from "./estimate";
import { studyToGeoJSON } from "./export";
import { fromL93, polygonAreaM2 } from "./projection";
import { l93Rect } from "./testUtils";
import { DEFAULT_SETTINGS, type CapacityStudy, type GeoPolygon } from "./types";

const outline: GeoPolygon = { type: "Polygon", coordinates: l93Rect(100, 60) };
const base: CapacityStudy = {
  id: "s1",
  name: "Test",
  outline,
  parcels: [],
  scaleFactor: 1,
  zones: [{ id: "a", name: "Zone A", geometry: outline }],
  exclusions: [],
  settings: { setback: 0 },
  results: {},
  carMarkers: [],
  createdAt: "",
  updatedAt: "",
  createdBy: null,
};

describe("estimation d'une étude", () => {
  it("retrouve l'exemple de référence sur une vraie position (Lambert-93)", () => {
    const r = estimate(base);
    expect(r.zones[0].area).toBeCloseTo(6000, 1);
    expect(r.totals.valet24).toBe(324);
    expect(r.totals.valet5).toBe(360);
    expect(r.totals.selfPark).toBeGreaterThanOrEqual(255);
    expect(r.totals.selfPark).toBeLessThanOrEqual(270);
    expect(r.zones[0].layouts.valet24.slots).toHaveLength(324);
    expect(ceilingOf(r.usableArea, DEFAULT_SETTINGS)).toBe(500);
    const summary = summarize(r);
    expect(summary.totals).toEqual(r.totals);
    expect(summary.zones?.[0].counts.valet24).toBe(324);
  });

  it("déduit le retrait en bordure et les parties exclues", () => {
    const withSetback = estimate({ ...base, settings: { setback: 1 } });
    expect(withSetback.totals.valet24).toBeLessThan(324);
    const tree = estimate({
      ...base,
      exclusions: [{ id: "t", name: "Arbre", kind: "tree", clearance: 2, geometry: { type: "Point", coordinates: fromL93([868050, 6516030]) } }],
    });
    expect(tree.zones[0].usableArea).toBeCloseTo(6000 - Math.PI * 4, 0);
    expect(tree.totals.valet24).toBeLessThan(324);
  });

  it("agrandit tout avec le facteur d'échelle", () => {
    const r = estimate({ ...base, scaleFactor: 1.1 });
    expect(r.zones[0].area).toBeCloseTo(7260, 0);
    expect(r.totals.valet24).toBeGreaterThan(324);
  });

  it("assemble des parcelles voisines et retire une partie du contour", () => {
    const left: GeoPolygon = { type: "Polygon", coordinates: l93Rect(50, 60) };
    const right: GeoPolygon = { type: "Polygon", coordinates: l93Rect(50, 60, 868050) };
    const frame = frameFor({ outline: left, zones: [], scaleFactor: 1 })!;
    const merged = unionPolygons([left, right], frame);
    expect(merged).toHaveLength(1);
    expect(polygonAreaM2(merged[0].coordinates)).toBeCloseTo(6000, 0);
    const clipped = unionPolygons([left, right], frame, [{ type: "Polygon", coordinates: l93Rect(100, 30) }]);
    expect(polygonAreaM2(clipped[0].coordinates)).toBeCloseTo(3000, 0);
    const cut = subtractFromOutline(merged[0], { type: "Polygon", coordinates: l93Rect(20, 60) }, frame)!;
    expect(polygonAreaM2(cut.coordinates)).toBeCloseTo(4800, 0);
  });

  it("exporte le contour, les zones et les places en GeoJSON", () => {
    const r = estimate(base);
    const geojson = studyToGeoJSON(base, r);
    const kinds = geojson.features.map(f => (f as { properties: { kind: string } }).properties.kind);
    expect(kinds.filter(k => k === "outline")).toHaveLength(1);
    expect(kinds.filter(k => k === "zone")).toHaveLength(1);
    expect(kinds.filter(k => k === "slot")).toHaveLength(r.totals.selfPark + r.totals.valet24 + r.totals.valet5 + r.totals.valetEdge);
  });
});
