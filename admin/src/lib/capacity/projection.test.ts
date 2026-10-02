import { describe, expect, it } from "vitest";
import { areaOf, bufferLine, circle, grow, pointInMulti, shrink, type Multi } from "./geometry";
import { distanceM, fromL93, makeFrame, polygonAreaM2, scaleFromMeasure, toL93 } from "./projection";
import { l93Rect } from "./testUtils";

describe("Lambert-93", () => {
  it("place l'origine de la projection au bon endroit et fait l'aller-retour", () => {
    const [x, y] = toL93([3, 46.5]);
    expect(x).toBeCloseTo(700000, 3);
    expect(y).toBeCloseTo(6600000, 3);
    const back = fromL93(toL93([5.078, 45.722]));
    expect(back[0]).toBeCloseTo(5.078, 9);
    expect(back[1]).toBeCloseTo(45.722, 9);
  });

  it("mesure surfaces et longueurs en mètres Lambert-93, pas en Web Mercator", () => {
    const rect = l93Rect(100, 60);
    expect(polygonAreaM2(rect)).toBeCloseTo(6000, 3);
    expect(distanceM(rect[0][0], rect[0][1])).toBeCloseTo(100, 4);
    // Web Mercator would give ≈ 143 m for these 100 m at 45.7° N.
    const mercX = (lon: number) => (lon * Math.PI * 6378137) / 180;
    expect(Math.abs(mercX(rect[0][1][0]) - mercX(rect[0][0][0]))).toBeGreaterThan(130);
  });

  it("applique le facteur d'échelle aux longueurs et son carré aux surfaces", () => {
    const rect = l93Rect(100, 60);
    expect(distanceM(rect[0][0], rect[0][1], 1.1)).toBeCloseTo(110, 4);
    expect(polygonAreaM2(rect, 1.1)).toBeCloseTo(7260, 2);
    const frame = makeFrame(rect[0][0], 1.1);
    const p = frame.forward(rect[0][2]);
    expect(p[0]).toBeCloseTo(110, 4);
    expect(p[1]).toBeCloseTo(66, 4);
    const back = frame.inverse(p);
    expect(back[0]).toBeCloseTo(rect[0][2][0], 9);
  });

  it("déduit l'échelle d'une cote mesurée sur place", () => {
    const rect = l93Rect(100, 60);
    expect(scaleFromMeasure(rect[0][0], rect[0][1], 101.5)).toBeCloseTo(1.015, 6);
    expect(scaleFromMeasure(rect[0][0], rect[0][0], 10)).toBe(1);
    expect(scaleFromMeasure(rect[0][0], rect[0][1], 0)).toBe(1);
  });
});

describe("géométrie plane", () => {
  const square: Multi = [
    [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ],
  ];

  it("rétrécit et élargit un polygone", () => {
    expect(areaOf(shrink(square, 1))).toBeCloseTo(64, 6);
    // Grown by 1 m: 100 + 4 × 10 + π (round corners, polygonal approximation).
    expect(areaOf(grow(square, 1))).toBeCloseTo(100 + 40 + Math.PI, 0);
    expect(areaOf(shrink(square, 6))).toBe(0);
  });

  it("donne une largeur aux lignes et un rayon aux points", () => {
    // A 6 m wide lane, 20 m long, with round ends.
    expect(areaOf(bufferLine([[0, 0], [20, 0]], 3))).toBeCloseTo(120 + Math.PI * 9, 0);
    expect(areaOf([circle([0, 0], 2)])).toBeCloseTo(Math.PI * 4, 0);
    expect(pointInMulti([5, 5], square)).toBe(true);
    expect(pointInMulti([15, 5], square)).toBe(false);
  });
});
