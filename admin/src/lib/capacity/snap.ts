import type { LonLat } from "./types";

const SNAP_VERTEX_PX = 12;
const SNAP_EDGE_PX = 8;

/** The position the pointer snaps to among the rings' vertices, then their edges (T-A). */
export function snapToRings(
  rings: LonLat[][] | undefined,
  event: { containerX: number; containerY: number },
  context: { project: (lng: number, lat: number) => { x: number; y: number }; unproject: (x: number, y: number) => { lng: number; lat: number } },
): LonLat | undefined {
  if (!rings?.length) return undefined;
  const px = event.containerX;
  const py = event.containerY;
  let bestVertex: LonLat | undefined;
  let bestVertexD = SNAP_VERTEX_PX;
  let bestEdge: { x: number; y: number } | undefined;
  let bestEdgeD = SNAP_EDGE_PX;
  for (const ring of rings) {
    const pts = ring.map(([lng, lat]) => context.project(lng, lat));
    pts.forEach((p, i) => {
      const d = Math.hypot(p.x - px, p.y - py);
      if (d < bestVertexD) {
        bestVertexD = d;
        bestVertex = ring[i];
      }
    });
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / len2));
      const q = { x: a.x + t * dx, y: a.y + t * dy };
      const d = Math.hypot(q.x - px, q.y - py);
      if (d < bestEdgeD) {
        bestEdgeD = d;
        bestEdge = q;
      }
    }
  }
  if (bestVertex) return bestVertex;
  if (bestEdge) {
    const { lng, lat } = context.unproject(bestEdge.x, bestEdge.y);
    return [lng, lat];
  }
  return undefined;
}
