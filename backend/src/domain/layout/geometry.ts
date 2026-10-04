// The JSTS classes come from a CommonJS bundle of the ESM sources (vendor/jsts-subset.js, see
// tools/bundle-jsts.sh): the package ships ESM only, which the API's CommonJS build cannot load.
/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
const {
  Coordinate,
  GeometryFactory,
  BufferOp,
  SnapIfNeededOverlayOp,
  UnaryUnionOp,
  TopologyPreservingSimplifier,
} = require('../../../vendor/jsts-subset.js');
import { ringSignedArea, type XY } from './projection';

// Planar geometry in a local metric frame (see projection.ts), on JSTS (the JavaScript port of
// JTS: robust buffers and overlays). Polygons are plain arrays: Multi = Poly[], Poly = Ring[]
// (outer ring first), Ring = closed list of [x, y].
export type Ring = XY[];
export type Poly = Ring[];
export type Multi = Poly[];

// JSTS ships loose typings: the few methods used here.
interface JGeometry {
  getGeometryType(): string;
  getNumGeometries(): number;
  getGeometryN(n: number): JGeometry;
  isEmpty(): boolean;
}
interface JPolygon extends JGeometry {
  getExteriorRing(): { getCoordinates(): { x: number; y: number }[] };
  getNumInteriorRing(): number;
  getInteriorRingN(n: number): { getCoordinates(): { x: number; y: number }[] };
}

const factory = new GeometryFactory();
/** Segments per quarter circle for round joins, caps and trees. */
const QUADRANT_SEGMENTS = 6;

const coords = (ring: Ring) => {
  const list = ring.map(([x, y]) => new Coordinate(x, y));
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) list.push(new Coordinate(first[0], first[1]));
  return list;
};

function toJsts(multi: Multi): JGeometry {
  const polygons = multi
    .filter(poly => poly.length > 0 && poly[0].length >= 3)
    .map(poly =>
      factory.createPolygon(
        factory.createLinearRing(coords(poly[0])),
        poly
          .slice(1)
          .filter(r => r.length >= 3)
          .map(r => factory.createLinearRing(coords(r))),
      ),
    );
  return factory.createMultiPolygon(polygons) as unknown as JGeometry;
}

function fromJsts(geometry: JGeometry): Multi {
  const out: Multi = [];
  const visit = (g: JGeometry) => {
    const type = g.getGeometryType();
    if (type === 'Polygon') {
      const p = g as JPolygon;
      if (p.isEmpty()) return;
      const ring = (r: { getCoordinates(): { x: number; y: number }[] }) => r.getCoordinates().map(c => [c.x, c.y] as XY);
      const poly: Poly = [ring(p.getExteriorRing())];
      for (let i = 0; i < p.getNumInteriorRing(); i++) poly.push(ring(p.getInteriorRingN(i)));
      out.push(poly);
    } else if (type === 'MultiPolygon' || type === 'GeometryCollection') {
      for (let i = 0; i < g.getNumGeometries(); i++) visit(g.getGeometryN(i));
    }
  };
  visit(geometry);
  return out;
}

const buffer = (g: JGeometry, d: number): JGeometry => BufferOp.bufferOp(g, d, QUADRANT_SEGMENTS) as JGeometry;

export function areaOf(multi: Multi): number {
  return multi.reduce(
    (sum, poly) => sum + poly.reduce((s, ring, i) => (i === 0 ? s + Math.abs(ringSignedArea(ring)) : s - Math.abs(ringSignedArea(ring))), 0),
    0,
  );
}

export function union(...parts: Multi[]): Multi {
  const polys = parts.flat();
  if (polys.length === 0) return [];
  return fromJsts(UnaryUnionOp.union(toJsts(polys)) as JGeometry);
}

export function intersection(a: Multi, b: Multi): Multi {
  if (a.length === 0 || b.length === 0) return [];
  return fromJsts(SnapIfNeededOverlayOp.intersection(toJsts(a), toJsts(b)) as JGeometry);
}

export function difference(a: Multi, ...cut: Multi[]): Multi {
  if (a.length === 0) return [];
  const removed = union(...cut);
  if (removed.length === 0) return a;
  return fromJsts(SnapIfNeededOverlayOp.difference(toJsts(a), toJsts(removed)) as JGeometry);
}

export function circle(center: XY, radius: number): Poly {
  const result = fromJsts(buffer(factory.createPoint(new Coordinate(center[0], center[1])) as unknown as JGeometry, radius));
  return result[0] ?? [];
}

/** Every point within d of a polyline (round joins and caps). */
export function bufferLine(points: XY[], d: number): Multi {
  if (d <= 0 || points.length === 0) return [];
  if (points.length === 1) return [circle(points[0], d)];
  return fromJsts(buffer(factory.createLineString(points.map(([x, y]) => new Coordinate(x, y))) as unknown as JGeometry, d));
}

/** Positive buffer (Minkowski sum with a disk of radius d). */
export function grow(multi: Multi, d: number): Multi {
  if (d <= 0 || multi.length === 0) return multi;
  return fromJsts(buffer(toJsts(multi), d));
}

/** Negative buffer: the points of the polygon at least d away from its boundary. */
export function shrink(multi: Multi, d: number): Multi {
  if (d <= 0 || multi.length === 0) return multi;
  return fromJsts(buffer(toJsts(multi), -d));
}

/**
 * Drops vertices that move the boundary by less than `tolerance` (metres), keeping the topology:
 * cadastral outlines carry hundreds of tiny segments that only slow the layout search.
 */
export function simplify(multi: Multi, tolerance: number): Multi {
  if (multi.length === 0 || tolerance <= 0) return multi;
  return fromJsts(TopologyPreservingSimplifier.simplify(toJsts(multi), tolerance) as JGeometry);
}

/** Even-odd point-in-polygon test over every ring. */
export function pointInMulti(p: XY, multi: Multi): boolean {
  let inside = false;
  for (const poly of multi) {
    for (const ring of poly) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside;
      }
    }
  }
  return inside;
}

/** Area-weighted centroid (holes subtracted). */
export function centroidOf(multi: Multi): XY | null {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (const poly of multi) {
    poly.forEach((ring, index) => {
      const orientation = Math.sign(ringSignedArea(ring)) * (index === 0 ? 1 : -1);
      for (let i = 0; i + 1 < ring.length; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        const cross = (x1 * y2 - x2 * y1) * orientation;
        a += cross / 2;
        cx += (x1 + x2) * cross;
        cy += (y1 + y2) * cross;
      }
    });
  }
  if (Math.abs(a) < 1e-9) return null;
  return [cx / (6 * a), cy / (6 * a)];
}
