import { describe, expect, it, vi } from "vitest";
import { autoZones, ceilingOf, estimate, subtractFromOutline, summarize, unionPolygons, frameFor, withIgnBuildings } from "./estimate";
import { studyToGeoJSON } from "./export";
import { fromL93, polygonAreaM2 } from "./projection";
import { l93Rect } from "./testUtils";
import { DEFAULT_SETTINGS, type CapacityStudy, type GeoPolygon } from "./types";

// Each case runs the whole layout engine (comb search over every depth and orientation): about 4 s alone, past the default
// 5 s once the full suite shares the CPU.
vi.setConfig({ testTimeout: 30_000 });

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

describe("bâtiments IGN et zones automatiques (B-A, T-A, 07/10/2026)", () => {
  // A 20 m × 60 m building across the middle of the 100 m × 60 m land: two pieces remain.
  const building = { id: "BATIMENT0001", geometry: { type: "Polygon" as const, coordinates: l93Rect(20, 60, 868040) } };
  const shed = { id: "BATIMENT0002", geometry: { type: "Polygon" as const, coordinates: l93Rect(10, 10, 868200, 6516200) } };

  it("exclut les bâtiments qui touchent le terrain, avec 1 m de marge, et garde les parties exclues à la main", () => {
    const hand = { id: "h", name: "Arbre", kind: "tree" as const, clearance: 2, geometry: { type: "Point" as const, coordinates: fromL93([868010, 6516010]) } };
    const old = { id: "ign-old", name: "Bâtiment", kind: "building" as const, clearance: 1, geometry: outline, source: "ign" as const, ref: "old" };
    const list = withIgnBuildings({ ...base, exclusions: [hand, old] }, [building, shed], "Bâtiment");
    expect(list.map((e) => e.id)).toEqual(["h", "ign-BATIMENT0001"]);
    expect(list[1]).toMatchObject({ kind: "building", clearance: 1, source: "ign", ref: "BATIMENT0001", name: "Bâtiment" });
    expect(estimate({ ...base, exclusions: list }).totals.valet24).toBeLessThan(324);
  });

  it("découpe les zones autour des bâtiments, la plus grande en premier, en gardant les identifiants", () => {
    const exclusions = withIgnBuildings(base, [building], "Bâtiment");
    const ids = ["keep-a", "keep-b"];
    const zones = autoZones({ ...base, exclusions }, (l) => `Zone ${l}`, () => ids.shift() ?? "new");
    expect(zones.map((z) => z.name)).toEqual(["Zone A", "Zone B"]);
    expect(zones.map((z) => z.id)).toEqual(["keep-a", "keep-b"]);
    const areas = zones.map((z) => polygonAreaM2(z.geometry.coordinates, 1));
    expect(areas[0]).toBeGreaterThanOrEqual(areas[1]);
    expect(areas[0] + areas[1]).toBeCloseTo(6000 - 22 * 60, -1);
    // No zone without a building: the whole land.
    expect(autoZones(base, (l) => `Zone ${l}`, () => "z")).toHaveLength(1);
  });
});
