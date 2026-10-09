import type { LonLat } from "@/lib/capacity/types";

/** Metres per degree of latitude (and of longitude at the equator), close enough for one parking. */
const M_PER_DEG = 111_320;

/**
 * R-A (09/10/2026, « faire une rotation du parking »): the map bearing that lays a parking
 * straight on the screen. The outline's tightest enclosing rectangle (one of its sides lies on an
 * edge of the hull, so trying every edge finds it) gets its long side horizontal; of the two
 * bearings that do so, the one closer to north. Null for a ring too small to have a direction.
 */
export function alignBearing(ring: LonLat[]): number | null {
  if (ring.length < 3) return null;
  const [lon0, lat0] = ring[0];
  const kx = M_PER_DEG * Math.cos((lat0 * Math.PI) / 180);
  const pts = ring.map(
    ([lon, lat]) => [(lon - lon0) * kx, (lat - lat0) * M_PER_DEG] as const,
  );
  let best: {
    angle: number;
    area: number;
    width: number;
    height: number;
  } | null = null;
  for (let i = 0; i + 1 < pts.length; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    if (Math.hypot(dx, dy) < 0.5) continue;
    const angle = Math.atan2(dy, dx);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    for (const [x, y] of pts) {
      const u = x * cos + y * sin;
      const v = -x * sin + y * cos;
      minU = Math.min(minU, u);
      maxU = Math.max(maxU, u);
      minV = Math.min(minV, v);
      maxV = Math.max(maxV, v);
    }
    const width = maxU - minU;
    const height = maxV - minV;
    if (!best || width * height < best.area - 1e-6)
      best = { angle, area: width * height, width, height };
  }
  if (!best) return null;
  // The rectangle's long side, as an angle from east, counter-clockwise (degrees).
  const long =
    ((best.width >= best.height ? best.angle : best.angle + Math.PI / 2) *
      180) /
    Math.PI;
  // A ground direction at `long` from east shows horizontal once the map turns by -long; the
  // same line read the other way round (±180°) gives the other answer.
  let bearing = -long;
  bearing = ((bearing % 180) + 180) % 180;
  if (bearing > 90) bearing -= 180;
  return Math.round(bearing * 10) / 10;
}
