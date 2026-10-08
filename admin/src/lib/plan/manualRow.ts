import type { Frame, LonLat, XY } from "@/lib/capacity/projection";
import type { Zone } from "@/lib/capacity/types";
import { pointInRing } from "./numbering";
import type { Spot, SpotInput } from "./types";

/** Prefix of the codes of the spots laid by hand: "M-01", "M-02"… (P-B, 07/10/2026). */
export const MANUAL_CODE_PREFIX = "M";
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * P-B (07/10/2026): a row of spots along a line drawn on the map. The line is the axis of the
 * row: spots of `slotWidth` sit side by side along it, `slotLength` across it, centred on it.
 * A segment shorter than one spot gives nothing; codes continue the manual sequence.
 */
export function rowAlong(
  line: LonLat[],
  frame: Frame,
  slotWidth: number,
  slotLength: number,
  zones: Zone[],
  existing: Spot[],
): SpotInput[] {
  const taken = new Set(existing.map((s) => s.code));
  let next = existing.filter((s) => s.manual).length + 1;
  const code = () => {
    while (taken.has(`${MANUAL_CODE_PREFIX}-${pad(next)}`)) next += 1;
    const c = `${MANUAL_CODE_PREFIX}-${pad(next)}`;
    next += 1;
    return c;
  };
  const row =
    Math.max(0, ...existing.filter((s) => s.manual).map((s) => s.row)) + 1;
  const out: SpotInput[] = [];
  const points = line.map((p) => frame.forward(p));
  for (let i = 0; i + 1 < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    const len = Math.hypot(bx - ax, by - ay);
    const count = Math.floor(len / slotWidth + 1e-6);
    if (count < 1) continue;
    const ux = (bx - ax) / len;
    const uy = (by - ay) / len;
    // Perpendicular, so the spot straddles the line.
    const nx = -uy * (slotLength / 2);
    const ny = ux * (slotLength / 2);
    // Spots are centred on the segment: the leftover is split between both ends.
    const start = (len - count * slotWidth) / 2;
    for (let k = 0; k < count; k++) {
      const s0 = start + k * slotWidth;
      const s1 = s0 + slotWidth;
      const corners: XY[] = [
        [ax + ux * s0 + nx, ay + uy * s0 + ny],
        [ax + ux * s1 + nx, ay + uy * s1 + ny],
        [ax + ux * s1 - nx, ay + uy * s1 - ny],
        [ax + ux * s0 - nx, ay + uy * s0 - ny],
      ];
      const ring = [...corners, corners[0]].map((c) => frame.inverse(c)) as [
        number,
        number,
      ][];
      const centre = frame.inverse([
        ax + ux * ((s0 + s1) / 2),
        ay + uy * ((s0 + s1) / 2),
      ]);
      const zone =
        zones.find((z) => pointInRing(centre, z.geometry.coordinates[0])) ??
        zones[0];
      out.push({
        zoneId: zone?.id ?? "manual",
        code: code(),
        row,
        index: out.length + 1,
        geometry: ring,
        depth: null,
        fileLength: null,
        stayClass: null,
      });
    }
  }
  return out;
}
