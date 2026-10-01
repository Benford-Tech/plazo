import { describe, expect, it } from "vitest";
import { bookableCapacity } from "../src/domain/capacity";

describe("bookableCapacity", () => {
  it("returns the full capacity without margin", () => {
    expect(bookableCapacity(200, 0)).toBe(200);
  });

  it("removes the margin and rounds down", () => {
    expect(bookableCapacity(200, 5)).toBe(190);
    expect(bookableCapacity(73, 5)).toBe(69); // 69.35 -> 69
  });

  it("rejects invalid inputs", () => {
    expect(() => bookableCapacity(0, 5)).toThrow(RangeError);
    expect(() => bookableCapacity(100, 51)).toThrow(RangeError);
    expect(() => bookableCapacity(100, -1)).toThrow(RangeError);
    expect(() => bookableCapacity(10.5, 0)).toThrow(RangeError);
  });
});
