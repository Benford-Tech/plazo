import { fromL93, type LonLat } from "./projection";

/** A w × h rectangle drawn in Lambert-93 near Lyon Saint-Exupéry, as WGS84 coordinates. */
export function l93Rect(w: number, h: number, x0 = 868000, y0 = 6516000): LonLat[][] {
  return [
    [
      [x0, y0],
      [x0 + w, y0],
      [x0 + w, y0 + h],
      [x0, y0 + h],
      [x0, y0],
    ].map(p => fromL93(p as [number, number])),
  ];
}
