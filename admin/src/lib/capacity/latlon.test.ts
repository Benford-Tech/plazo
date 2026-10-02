import { describe, expect, it } from "vitest";
import { parseLatLon } from "./latlon";

describe("point saisi en coordonnées", () => {
  it("lit « latitude, longitude »", () => {
    expect(parseLatLon("45.7095, 5.1033")).toMatchObject({ lat: 45.7095, lon: 5.1033, type: "point" });
    expect(parseLatLon(" 45,7095 ; 5,1033 ")).toMatchObject({ lat: 45.7095, lon: 5.1033 });
    expect(parseLatLon("45.7095 5.1033")).toMatchObject({ lat: 45.7095, lon: 5.1033 });
  });
  it("ignore les adresses", () => {
    expect(parseLatLon("12 rue de Lyon")).toBeNull();
    expect(parseLatLon("Colombier-Saugnieu")).toBeNull();
    expect(parseLatLon("95, 5")).toBeNull();
  });
});
