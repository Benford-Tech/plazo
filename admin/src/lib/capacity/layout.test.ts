import { describe, expect, it } from "vitest";
import { areaOf, difference, pointInMulti, type Multi } from "./geometry";
import { candidateAngles, generateLayout, type LayoutParams } from "./layout";

const rect = (w: number, h: number, x = 0, y = 0): Multi => [
  [
    [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
      [x, y],
    ],
  ],
];

const SELF: LayoutParams = {
  slotWidth: 2.5,
  slotLength: 5,
  aisleWidth: 6,
  blockDepth: 2,
  oneSidedDepth: 1,
  crossAisles: true,
  endStalls: false,
};
const VALET_24: LayoutParams = {
  slotWidth: 2.4,
  slotLength: 5,
  aisleWidth: 6,
  blockDepth: 4,
  oneSidedDepth: 3,
  crossAisles: true,
  endStalls: false,
};
const VALET_5: LayoutParams = { ...VALET_24, blockDepth: 10, oneSidedDepth: 5 };

describe("générateur de disposition — exemple de référence 100 m × 60 m, sans retrait, allées 6 m", () => {
  const lot = rect(100, 60);

  it("clients garés seuls : 7 rangées de 35 places entre deux allées transversales = 245", () => {
    const r = generateLayout(lot, SELF);
    expect(r.count).toBeGreaterThanOrEqual(240);
    expect(r.count).toBeLessThanOrEqual(250);
    expect(r.count).toBe(245);
    expect(r.angle % 180).toBe(0);
  });

  it("clients garés seuls avec places en bout d'allée : ≈ 261 (référence ≈ 265)", () => {
    const r = generateLayout(lot, { ...SELF, endStalls: true });
    // 31 colonnes × 7 rangées + 2 × 22 places en épi au bout des allées.
    expect(r.count).toBeGreaterThanOrEqual(255);
    expect(r.count).toBeLessThanOrEqual(270);
  });

  it("voiturier files de 2 à 4 : blocs 3 | allée | 4 | allée | 2 = 324", () => {
    const r = generateLayout(lot, VALET_24);
    expect(r.count).toBeGreaterThanOrEqual(315);
    expect(r.count).toBeLessThanOrEqual(330);
    expect(r.count).toBe(324);
    expect(r.pattern.reduce((a, b) => a + b, 0)).toBe(9);
    expect(Math.max(...r.pattern)).toBeLessThanOrEqual(4);
  });

  it("voiturier files de 5 : blocs 5 | allée | 5 = 360", () => {
    const r = generateLayout(lot, VALET_5);
    expect(r.count).toBe(360);
    expect(r.pattern).toEqual([5, 5]);
  });

  it("sans allées transversales, chaque rangée court sur toute la longueur", () => {
    expect(
      generateLayout(lot, { ...SELF, crossAisles: false }).count,
    ).toBeGreaterThanOrEqual(7 * 40);
    expect(
      generateLayout(lot, { ...VALET_24, crossAisles: false }).count,
    ).toBeGreaterThanOrEqual(9 * 41);
  });

  it("les places générées sont dans le terrain et ne se chevauchent pas", () => {
    const r = generateLayout(lot, { ...SELF, endStalls: true });
    expect(r.slots).toHaveLength(r.count);
    for (const q of r.slots)
      for (const [x, y] of q)
        expect(
          x >= -1e-6 && x <= 100 + 1e-6 && y >= -1e-6 && y <= 60 + 1e-6,
        ).toBe(true);
    const boxes = r.slots.map((q) => {
      const xs = q.map((p) => p[0]);
      const ys = q.map((p) => p[1]);
      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys),
      ];
    });
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const [a, b] = [boxes[i], boxes[j]];
        const overlap =
          Math.min(a[2], b[2]) - Math.max(a[0], b[0]) > 1e-6 &&
          Math.min(a[3], b[3]) - Math.max(a[1], b[1]) > 1e-6;
        expect(overlap).toBe(false);
      }
  });
});

describe("générateur de disposition — cas généraux", () => {
  it("trouve l'orientation d'un terrain tourné", () => {
    const c = Math.cos(Math.PI / 6);
    const s = Math.sin(Math.PI / 6);
    const turned: Multi = rect(100, 60).map((poly) =>
      poly.map((ring) =>
        ring.map(
          ([x, y]) => [x * c - y * s, x * s + y * c] as [number, number],
        ),
      ),
    );
    const r = generateLayout(turned, VALET_24);
    expect(r.count).toBe(324);
    expect(r.angle).toBeCloseTo(30, 0);
    expect(candidateAngles(turned)[0]).toBeCloseTo(30, 5);
  });

  it("ne compte rien quand une allée ne tient pas", () => {
    expect(generateLayout(rect(30, 8), SELF).count).toBe(0);
    expect(generateLayout([], SELF).count).toBe(0);
  });

  it("respecte une orientation imposée", () => {
    const r = generateLayout(rect(100, 60), VALET_24, { angle: 90 });
    expect(r.angle).toBe(90);
    expect(r.count).toBeLessThan(324);
  });

  it("tient compte d'un trou (partie exclue) dans le terrain", () => {
    const withHole: Multi = [
      [rect(100, 60)[0][0], rect(20, 20, 40, 20)[0][0].slice().reverse()],
    ];
    expect(areaOf(withHole)).toBeCloseTo(5600, 6);
    const r = generateLayout(withHole, VALET_24);
    expect(r.count).toBeLessThan(324);
    expect(r.count).toBeGreaterThan(200);
    for (const q of r.slots) {
      const cx = (q[0][0] + q[2][0]) / 2;
      const cy = (q[0][1] + q[2][1]) / 2;
      expect(cx > 40 && cx < 60 && cy > 20 && cy < 40).toBe(false);
    }
  });

  it("calcule une disposition sur un grand terrain irrégulier en un temps raisonnable", () => {
    const lot: Multi = [
      [
        [
          [0, 0],
          [180, 10],
          [200, 120],
          [150, 200],
          [20, 170],
          [0, 0],
        ],
      ],
    ];
    const t = performance.now();
    const r = generateLayout(lot, VALET_5);
    const elapsed = performance.now() - t;
    expect(r.count).toBeGreaterThan(1000);
    expect(r.count * 12).toBeLessThan(areaOf(lot));
    expect(elapsed).toBeLessThan(20000);
  });
});

describe("voiturier « files depuis le bord » (T-A, 04/10/2026)", () => {
  const EDGE: LayoutParams = {
    ...VALET_24,
    blockDepth: 8,
    oneSidedDepth: 8,
    crossAisles: false,
    mode: "edge",
    maxFiles: 8,
  };
  const triangle: Multi = [
    [
      [
        [0, 0],
        [60, 0],
        [0, 45],
        [0, 0],
      ],
    ],
  ];

  it("remplit un triangle bien mieux que les bandes, avec une seule allée le long d'un bord", () => {
    const bands = generateLayout(triangle, VALET_24);
    const edge = generateLayout(triangle, EDGE);
    expect(edge.count).toBeGreaterThan(bands.count * 1.3);
    expect(edge.pattern).toEqual([8]);
    expect(edge.depths).toHaveLength(edge.count);
    expect(edge.files).toHaveLength(edge.count);
    // Every file starts at the aisle and is as deep as announced.
    for (let i = 0; i < edge.count; i++)
      expect(edge.depths[i]).toBeLessThan(edge.files[i]);
    expect(edge.depths.filter((d) => d === 0).length).toBeGreaterThan(0);
  });

  it("sur le rectangle de référence : 41 colonnes de 8 = 328, et les rangs sont connus aussi pour les bandes", () => {
    expect(generateLayout(rect(100, 60), EDGE).count).toBe(328);
    const bands = generateLayout(rect(100, 60), VALET_24);
    expect(bands.depths).toHaveLength(bands.count);
    expect(Math.max(...bands.depths)).toBe(2); // at most 3 from an aisle: ranks 0, 1, 2
  });
});

describe("files depuis le bord : l'allée part de l'entrée", () => {
  const EDGE: LayoutParams = {
    ...VALET_24,
    blockDepth: 8,
    oneSidedDepth: 8,
    crossAisles: false,
    mode: "edge",
    maxFiles: 8,
  };
  it("à nombre de places égal, l'allée longe le bord le plus proche du point d'entrée", () => {
    const lot = rect(100, 60);
    const south = generateLayout(lot, EDGE, { anchor: [50, -5] });
    const north = generateLayout(lot, EDGE, { anchor: [50, 65] });
    expect(south.count).toBe(north.count);
    const minY = (r: ReturnType<typeof generateLayout>) =>
      Math.min(...r.slots.flatMap((q) => q.map((p) => p[1])));
    const maxY = (r: ReturnType<typeof generateLayout>) =>
      Math.max(...r.slots.flatMap((q) => q.map((p) => p[1])));
    // South entrance: the aisle is the 6 m strip at the bottom, the files start above it.
    expect(minY(south)).toBeCloseTo(6, 0);
    expect(maxY(north)).toBeCloseTo(54, 0);
  });
});

describe("voiturier « peigne » (M-A, 07/10/2026)", () => {
  const COMB: LayoutParams = {
    ...VALET_24,
    blockDepth: 16,
    oneSidedDepth: 8,
    crossAisles: false,
    mode: "comb",
    maxFiles: 8,
  };
  const EDGE: LayoutParams = { ...COMB, blockDepth: 8, mode: "edge" };

  it("sur le rectangle de référence, bat les files depuis le bord et les files de 5, avec ses allées", () => {
    const lot = rect(100, 60);
    const comb = generateLayout(lot, COMB);
    expect(comb.count).toBeGreaterThan(generateLayout(lot, EDGE).count);
    expect(comb.count).toBeGreaterThan(generateLayout(lot, VALET_5).count);
    expect(comb.count).toBeGreaterThanOrEqual(390);
    expect(comb.aisles.length).toBeGreaterThan(0);
    expect(comb.depths).toHaveLength(comb.count);
    expect(comb.files).toHaveLength(comb.count);
    for (let i = 0; i < comb.count; i++) {
      expect(comb.depths[i]).toBeLessThan(comb.files[i]);
      expect(comb.files[i]).toBeLessThanOrEqual(8);
    }
  });

  it("contourne un bâtiment au milieu du terrain et remplit les restes dans l'autre sens", () => {
    // 90 m × 70 m with a 40 m × 30 m building in the middle-left.
    const land = difference(rect(90, 70), rect(40, 30, 25, 20));
    const comb = generateLayout(land, COMB);
    expect(comb.count).toBeGreaterThan(generateLayout(land, VALET_5).count);
    expect(comb.count).toBeGreaterThan(generateLayout(land, EDGE).count * 1.2);
    // Every slot lies inside the land, outside the building.
    for (const q of comb.slots) {
      const cx = (q[0][0] + q[2][0]) / 2;
      const cy = (q[0][1] + q[2][1]) / 2;
      expect(pointInMulti([cx, cy], land)).toBe(true);
    }
    // The leftovers took files in another direction: not every slot shares the main angle.
    const bearings = new Set(
      comb.slots.map((q) => Math.round(((Math.atan2(q[1][1] - q[0][1], q[1][0] - q[0][0]) * 180) / Math.PI + 360) % 180)),
    );
    expect(bearings.size).toBeGreaterThan(1);
  });

  it("à nombre de places égal, l'allée de bout part de l'entrée", () => {
    const lot = rect(100, 60);
    const west = generateLayout(lot, COMB, { anchor: [-5, 30] });
    const east = generateLayout(lot, COMB, { anchor: [105, 30] });
    expect(west.count).toBe(east.count);
    // The spine is a 6 m strip along the entrance side, running across the land, on the edge's bearing.
    expect(west.angle % 180).toBe(0);
    const spine = (r: ReturnType<typeof generateLayout>, test: (x: number) => boolean) =>
      r.aisles.some((q) => q.every((p) => test(p[0])) && Math.max(...q.map((p) => p[1])) - Math.min(...q.map((p) => p[1])) >= 30);
    expect(spine(west, (x) => x <= 6 + 1e-6)).toBe(true);
    expect(spine(east, (x) => x >= 94 - 1e-6)).toBe(true);
    expect(spine(west, (x) => x >= 94 - 1e-6)).toBe(false);
  });
});
