import { alignBearing } from "./alignment";

/** A w × h metre rectangle turned by `deg` (counter-clockwise from east), near Lyon. */
function rect(w: number, h: number, deg: number) {
  const lat0 = 45.6855;
  const lon0 = 5.0629;
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180);
  const a = (deg * Math.PI) / 180;
  const corners = [
    [0, 0],
    [w, 0],
    [w, h],
    [0, h],
    [0, 0],
  ];
  return corners.map(([x, y]) => {
    const u = x * Math.cos(a) - y * Math.sin(a);
    const v = x * Math.sin(a) + y * Math.cos(a);
    return [lon0 + u / kx, lat0 + v / 111_320] as [number, number];
  });
}

describe("aligner la carte sur le parking (R-A, 09/10/2026)", () => {
  it("un terrain déjà droit ne tourne pas", () => {
    expect(alignBearing(rect(120, 40, 0))).toBe(0);
  });

  it("met le grand côté à l'horizontale, au plus près du nord", () => {
    // Long side 30° above east: turn the map by -30°.
    expect(alignBearing(rect(120, 40, 30))).toBeCloseTo(-30, 0);
    expect(alignBearing(rect(120, 40, -25))).toBeCloseTo(25, 0);
    // Long side north-south: a quarter turn.
    expect(Math.abs(alignBearing(rect(40, 120, 0))!)).toBeCloseTo(90, 0);
  });

  it("suit le rectangle le plus serré, pas un petit pan coupé", () => {
    // A 100 × 50 parking turned by 20°, with one corner cut short.
    const ring = rect(100, 50, 20);
    const cut: [number, number] = [
      (ring[1][0] + ring[2][0]) / 2,
      (ring[1][1] + ring[2][1]) / 2,
    ];
    const shape = [
      ring[0],
      [
        (ring[0][0] + ring[1][0] * 3) / 4,
        (ring[0][1] + ring[1][1] * 3) / 4,
      ] as [number, number],
      cut,
      ring[2],
      ring[3],
      ring[0],
    ];
    expect(alignBearing(shape)).toBeCloseTo(-20, 0);
  });

  it("rien pour un contour sans forme", () => {
    expect(alignBearing([])).toBeNull();
    expect(
      alignBearing([
        [5, 45],
        [5, 45],
        [5, 45],
      ]),
    ).toBeNull();
  });
});
