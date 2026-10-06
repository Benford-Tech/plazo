import { describe, expect, it } from "vitest";
import { snapToRings } from "./snap";

// A flat projection: 1 unit = 10 px.
const context = {
  project: (lng: number, lat: number) => ({ x: lng * 10, y: lat * 10 }),
  unproject: (x: number, y: number) => ({ lng: x / 10, lat: y / 10 }),
};
const square: [number, number][] = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
];

describe("aimantation du tracé (T-A)", () => {
  it("aimante au sommet à moins de 12 px, sinon au bord à moins de 8 px, sinon nulle part", () => {
    expect(snapToRings([square], { containerX: 101, containerY: 8 }, context)).toEqual([10, 0]);
    expect(snapToRings([square], { containerX: 50, containerY: 5 }, context)).toEqual([5, 0]);
    expect(snapToRings([square], { containerX: 50, containerY: 30 }, context)).toBeUndefined();
    expect(snapToRings([], { containerX: 0, containerY: 0 }, context)).toBeUndefined();
  });
});
