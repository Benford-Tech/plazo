import {
  areaOf,
  difference,
  grow,
  intersection,
  pointInMulti,
  union,
  type Multi,
  type Poly,
} from "./geometry";
import type { XY } from "./projection";

/**
 * Deterministic parking layout generator (pure, no DOM: also runs in a Web Worker).
 *
 * Input: the usable polygon in a local metric frame (setback and exclusions already removed).
 * The layout is a repeated band pattern along y in a frame rotated by `angle`:
 *
 *   … | aisle | block of `blockDepth` rows | aisle | block | …
 *
 * Every row is a line of slots (width w along the row, length l across). A slot counts when
 *  - its rectangle lies fully inside the polygon,
 *  - it reaches an aisle through an unbroken file of slots in its column, at most
 *    `oneSidedDepth` slots long counting itself (tandem parking: the valet moves the cars in
 *    front), from the aisle below or the aisle above the block,
 *  - that aisle is inside the polygon over the slot's width, away from the cross aisles reserved
 *    at both ends of every aisle run (`crossAisles`), and the aisle run is at least one slot long.
 *
 * Three layouts are this one generator with different parameters:
 *  - self-park: blockDepth 2, oneSidedDepth 1 (stall | aisle | stall, back to back);
 *  - valet "files de 2 à 4": blockDepth 4 between two aisles, at most 3 from one aisle;
 *  - valet "files de 5": blockDepth 10 (5 | 5 back to back), at most 5 from an aisle.
 *
 * `endStalls` (self-park): the cross aisle moves one slot length inwards and the strip it
 * leaves at the end of the aisle run receives perpendicular stalls facing the cross aisle.
 *
 * Search: every polygon edge bearing plus 0..178° by 2°, band phase in 0.5 m steps over one
 * module, along-row phase in steps over one slot width; the best count wins (first found on ties).
 * A coarse pass ranks the angles first; the full grid then runs on the 6 best (± 1°).
 */
export interface LayoutParams {
  slotWidth: number;
  slotLength: number;
  aisleWidth: number;
  blockDepth: number;
  oneSidedDepth: number;
  crossAisles: boolean;
  endStalls: boolean;
  /**
   * "edge" (T-A, 04/10/2026): one service aisle along a boundary edge, files perpendicular to it as
   * deep as the land allows (up to `maxFiles`), no inner or cross aisle.
   * "comb" (M-A, 07/10/2026): as many service aisles as the land needs, files up to `maxFiles` deep
   * on both sides of each one, a single spine aisle joining them at one end, and the leftovers
   * filled with files in the other direction from a short aisle touching the network.
   * Default: the band pattern.
   */
  mode?: "bands" | "edge" | "comb";
  maxFiles?: number;
}

export interface SearchOptions {
  /** Fixed orientation in degrees (rows along this bearing, counter-clockwise from east); null: search. */
  angle?: number | null;
  /**
   * Edge mode: the entrance (or handover point). Among the aisles within 3 % of the best count,
   * the one nearest this point wins: the valet drives in straight onto the service aisle.
   */
  anchor?: XY | null;
  angleStep?: number;
  phaseStep?: number;
  /** Number of along-row offsets tried over one slot width. */
  alongSteps?: number;
  /** Edge mode: the aisle must touch this area (the aisles already laid), else the piece stays empty. */
  mustTouch?: Multi;
}

/** A slot as its 4 corners, in the input frame. */
export type Quad = [XY, XY, XY, XY];

export interface LayoutResult {
  count: number;
  /** Rows bearing in degrees, 0..180. */
  angle: number;
  /** Rank of each slot from the aisle that serves it (0: first in the file), parallel to `slots`. */
  depths: number[];
  /** Length of the file each slot belongs to, parallel to `slots`. */
  files: number[];
  /** Rows per block in y order, with aisles between them, e.g. [3, 4, 2]. */
  pattern: number[];
  slots: Quad[];
  /** The service aisles (and the spine of a comb), as rectangles in the input frame; may overshoot the land. */
  aisles: Quad[];
}

type Interval = [number, number];
type Edge = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  ymin: number;
  ymax: number;
};

const EPS = 1e-6;

function rotate(p: XY, cos: number, sin: number): XY {
  // Rotation by -angle: rows along the bearing become horizontal.
  return [p[0] * cos + p[1] * sin, -p[0] * sin + p[1] * cos];
}

function unrotate(p: XY, cos: number, sin: number): XY {
  return [p[0] * cos - p[1] * sin, p[0] * sin + p[1] * cos];
}

/** Candidate bearings: every edge of the polygon, then every 2°. */
export function candidateAngles(multi: Multi, step = 2): number[] {
  const angles: number[] = [];
  const push = (a: number) => {
    const n = ((a % 180) + 180) % 180;
    if (!angles.some((b) => Math.abs(b - n) < 0.25 || Math.abs(b - n) > 179.75))
      angles.push(n);
  };
  // Longest edges first: on ties the layout follows the main sides of the land.
  const edges: { angle: number; length: number }[] = [];
  for (const poly of multi)
    for (const ring of poly)
      for (let i = 0; i + 1 < ring.length; i++) {
        const dx = ring[i + 1][0] - ring[i][0];
        const dy = ring[i + 1][1] - ring[i][1];
        edges.push({
          angle: (Math.atan2(dy, dx) * 180) / Math.PI,
          length: Math.hypot(dx, dy),
        });
      }
  edges.sort((a, b) => b.length - a.length);
  for (const e of edges)
    if (e.length >= 2) push(Math.round(e.angle * 100) / 100);
  for (let a = 0; a < 180; a += step) push(a);
  return angles;
}

class Rotated {
  edges: Edge[] = [];
  multi: Multi;
  ymin = Infinity;
  ymax = -Infinity;
  xmin = Infinity;
  xmax = -Infinity;

  constructor(source: Multi, cos: number, sin: number) {
    this.multi = source.map((poly) =>
      poly.map((ring) => ring.map((p) => rotate(p, cos, sin))),
    );
    for (const poly of this.multi)
      for (const ring of poly)
        for (let i = 0; i + 1 < ring.length; i++) {
          const [x1, y1] = ring[i];
          const [x2, y2] = ring[i + 1];
          this.edges.push({
            x1,
            y1,
            x2,
            y2,
            ymin: Math.min(y1, y2),
            ymax: Math.max(y1, y2),
          });
          this.ymin = Math.min(this.ymin, y1);
          this.ymax = Math.max(this.ymax, y1);
          this.xmin = Math.min(this.xmin, x1);
          this.xmax = Math.max(this.xmax, x1);
        }
  }

  /**
   * The x intervals where the vertical segment [y0, y1] lies inside the polygon: the complement
   * of the x-extent of the boundary inside the open strip, kept where the strip's middle is inside.
   */
  strip(y0: number, y1: number): Interval[] {
    const lo = y0 + EPS;
    const hi = y1 - EPS;
    const blocked: Interval[] = [];
    for (const e of this.edges) {
      if (e.ymax <= lo || e.ymin >= hi) continue;
      let xa: number;
      let xb: number;
      if (e.y1 === e.y2) {
        xa = e.x1;
        xb = e.x2;
      } else {
        const t0 = (Math.max(lo, e.ymin) - e.y1) / (e.y2 - e.y1);
        const t1 = (Math.min(hi, e.ymax) - e.y1) / (e.y2 - e.y1);
        xa = e.x1 + (e.x2 - e.x1) * t0;
        xb = e.x1 + (e.x2 - e.x1) * t1;
      }
      blocked.push(xa < xb ? [xa, xb] : [xb, xa]);
    }
    blocked.sort((a, b) => a[0] - b[0]);
    const merged: Interval[] = [];
    for (const b of blocked) {
      const last = merged[merged.length - 1];
      if (last && b[0] <= last[1] + EPS) last[1] = Math.max(last[1], b[1]);
      else merged.push([b[0], b[1]]);
    }
    const out: Interval[] = [];
    const ym = (y0 + y1) / 2;
    for (let i = 0; i + 1 < merged.length; i++) {
      const a = merged[i][1];
      const b = merged[i + 1][0];
      if (b - a > EPS && pointInMulti([(a + b) / 2, ym], this.multi))
        out.push([a, b]);
    }
    return out;
  }
}

function fits(intervals: Interval[], x0: number, x1: number): boolean {
  for (const [a, b] of intervals) {
    if (a - EPS <= x0 && x1 <= b + EPS) return true;
    if (a > x0) return false;
  }
  return false;
}

interface Module {
  aisleY: number;
  /** Aisle runs reachable by the rows (cross aisles removed). */
  aisle: Interval[];
  /** Raw aisle runs, for the end stalls. */
  aisleRaw: Interval[];
  rows: Interval[][];
}

interface Evaluation {
  count: number;
  pattern: number[];
  slots?: Quad[];
  depths?: number[];
  files?: number[];
  aisles?: Quad[];
}

const quad = (x0: number, y0: number, x1: number, y1: number): Quad => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

function buildModules(
  shape: Rotated,
  p: LayoutParams,
  phase: number,
): Module[] {
  const period = p.blockDepth * p.slotLength + p.aisleWidth;
  const modules: Module[] = [];
  // A comb keeps one cross aisle, the spine, at the start of every run; the other end is closed.
  const comb = p.mode === "comb";
  const cut =
    p.crossAisles || comb
      ? p.aisleWidth + (p.endStalls && !comb ? p.slotLength : 0)
      : 0;
  const cutEnd = comb ? 0 : cut;
  for (let y = shape.ymin - period + phase; y < shape.ymax; y += period) {
    const raw =
      y + p.aisleWidth > shape.ymin && y < shape.ymax
        ? shape.strip(y, y + p.aisleWidth)
        : [];
    const aisle: Interval[] = [];
    for (const [a, b] of raw) {
      const s: Interval = [a + cut, b - cutEnd];
      if (s[1] - s[0] >= p.slotWidth - EPS) aisle.push(s);
    }
    const rows: Interval[][] = [];
    for (let r = 0; r < p.blockDepth; r++) {
      const r0 = y + p.aisleWidth + r * p.slotLength;
      rows.push(
        r0 + p.slotLength > shape.ymin && r0 < shape.ymax
          ? shape.strip(r0, r0 + p.slotLength)
          : [],
      );
    }
    modules.push({ aisleY: y, aisle, aisleRaw: raw, rows });
  }
  return modules;
}

/** Marks the columns [along + c·w, along + (c+1)·w] lying inside the intervals. */
function columnMask(
  intervals: Interval[],
  along: number,
  w: number,
  cStart: number,
  mask: Uint8Array,
) {
  mask.fill(0);
  for (const [a, b] of intervals) {
    const first = Math.max(cStart, Math.ceil((a - EPS - along) / w));
    const last = Math.min(
      cStart + mask.length - 1,
      Math.floor((b + EPS - along) / w) - 1,
    );
    for (let c = first; c <= last; c++) mask[c - cStart] = 1;
  }
}

function evaluate(
  shape: Rotated,
  modules: Module[],
  p: LayoutParams,
  along: number,
  emit: boolean,
): Evaluation {
  const w = p.slotWidth;
  const l = p.slotLength;
  const D = p.blockDepth;
  const cStart = Math.floor((shape.xmin - along) / w) - 1;
  const cEnd = Math.ceil((shape.xmax - along) / w) + 1;
  const nCols = cEnd - cStart + 1;
  const rowMasks = Array.from({ length: D }, () => new Uint8Array(nCols));
  const belowMask = new Uint8Array(nCols);
  const aboveMask = new Uint8Array(nCols);
  let count = 0;
  const pattern: number[] = [];
  const slots: Quad[] = [];
  const depths: number[] = [];
  const files: number[] = [];
  const aisles: Quad[] = [];
  const rowUsed = new Array<boolean>(D);
  const period = D * l + p.aisleWidth;

  for (let k = 0; k < modules.length; k++) {
    const m = modules[k];
    const below = m.aisle;
    const above = k + 1 < modules.length ? modules[k + 1].aisle : [];
    if (emit && below.length) {
      for (const [a, b] of m.aisleRaw) {
        if (!below.some(([c, d]) => c >= a - EPS && d <= b + EPS)) continue;
        aisles.push(quad(a, m.aisleY, b, m.aisleY + p.aisleWidth));
        // The spine of a comb runs along the start of the block, down to the next aisle.
        if (p.mode === "comb")
          aisles.push(quad(a, m.aisleY, a + p.aisleWidth, m.aisleY + period));
      }
    }
    if (below.length === 0 && above.length === 0) {
      if (emit) pattern.push(0);
      continue;
    }
    for (let r = 0; r < D; r++)
      columnMask(m.rows[r], along, w, cStart, rowMasks[r]);
    columnMask(below, along, w, cStart, belowMask);
    columnMask(above, along, w, cStart, aboveMask);
    rowUsed.fill(false);
    for (let i = 0; i < nCols; i++) {
      // Unbroken files from each aisle.
      let reachBelow = 0;
      if (belowMask[i])
        while (
          reachBelow < D &&
          reachBelow < p.oneSidedDepth &&
          rowMasks[reachBelow][i]
        )
          reachBelow++;
      let reachAbove = 0;
      if (aboveMask[i])
        while (
          reachAbove < D &&
          reachAbove < p.oneSidedDepth &&
          rowMasks[D - 1 - reachAbove][i]
        )
          reachAbove++;
      if (reachBelow === 0 && reachAbove === 0) continue;
      const n = Math.min(D, reachBelow + reachAbove);
      count += n;
      if (!emit) continue;
      const x0 = along + (cStart + i) * w;
      const x1 = x0 + w;
      for (let r = 0; r < D; r++) {
        if (!(r < reachBelow || r >= D - reachAbove)) continue;
        rowUsed[r] = true;
        const y0 = m.aisleY + p.aisleWidth + r * l;
        slots.push([
          [x0, y0],
          [x1, y0],
          [x1, y0 + l],
          [x0, y0 + l],
        ]);
        const fromBelow = r < reachBelow;
        depths.push(fromBelow ? r : D - 1 - r);
        files.push(fromBelow ? reachBelow : reachAbove);
      }
    }
    if (emit) pattern.push(rowUsed.filter(Boolean).length);
  }

  // End stalls: perpendicular stalls in the strip between the end of an aisle run and its cross
  // aisle, over the aisle and the row on each side of it.
  if (p.crossAisles && p.endStalls) {
    for (let k = 0; k < modules.length; k++) {
      const m = modules[k];
      if (m.aisle.length === 0) continue;
      const prev = k > 0 ? modules[k - 1].rows[D - 1] : [];
      const next = m.rows[0];
      const y0 = m.aisleY - l;
      const y1 = m.aisleY + p.aisleWidth + l;
      const bands: { from: number; to: number; intervals: Interval[] }[] = [
        { from: y0, to: m.aisleY, intervals: prev },
        { from: m.aisleY, to: m.aisleY + p.aisleWidth, intervals: m.aisleRaw },
        { from: m.aisleY + p.aisleWidth, to: y1, intervals: next },
      ];
      for (const [a, b] of m.aisleRaw) {
        // Only runs long enough to keep a reachable aisle between the two end strips.
        if (b - a - 2 * (l + p.aisleWidth) < w - EPS) continue;
        for (const [xa, xb] of [
          [a, a + l],
          [b - l, b],
        ] as Interval[]) {
          for (let ys = y0; ys + w <= y1 + EPS; ys += w) {
            const ok = bands.every(
              (band) =>
                band.to <= ys + EPS ||
                band.from >= ys + w - EPS ||
                fits(band.intervals, xa, xb),
            );
            if (!ok) continue;
            count++;
            if (emit) {
              slots.push([
                [xa, ys],
                [xb, ys],
                [xb, ys + w],
                [xa, ys + w],
              ]);
              depths.push(0);
              files.push(1);
            }
          }
        }
      }
    }
  }
  return {
    count,
    pattern,
    slots: emit ? slots : undefined,
    depths: emit ? depths : undefined,
    files: emit ? files : undefined,
    aisles: emit ? aisles : undefined,
  };
}

/**
 * Edge mode: the aisle is the strip [aisleY, aisleY + aisleWidth]; every column of slot width that
 * touches it takes a file going up, as long as the slots stay inside the polygon (up to maxFiles).
 */
function evaluateEdge(
  shape: Rotated,
  p: LayoutParams,
  aisleY: number,
  along: number,
  emit: boolean,
): Evaluation {
  const w = p.slotWidth;
  const l = p.slotLength;
  const maxFiles = Math.max(1, p.maxFiles ?? 8);
  const aisle = shape.strip(aisleY, aisleY + p.aisleWidth);
  const empty: Evaluation = { count: 0, pattern: [] };
  if (aisle.length === 0) return empty;
  const cStart = Math.floor((shape.xmin - along) / w) - 1;
  const cEnd = Math.ceil((shape.xmax - along) / w) + 1;
  const nCols = cEnd - cStart + 1;
  const aisleMask = new Uint8Array(nCols);
  columnMask(aisle, along, w, cStart, aisleMask);
  const rowMasks: Uint8Array[] = [];
  for (let r = 0; r < maxFiles; r++) {
    const y0 = aisleY + p.aisleWidth + r * l;
    const mask = new Uint8Array(nCols);
    if (y0 < shape.ymax)
      columnMask(shape.strip(y0, y0 + l), along, w, cStart, mask);
    rowMasks.push(mask);
  }
  let count = 0;
  let deepest = 0;
  const slots: Quad[] = [];
  const depths: number[] = [];
  const files: number[] = [];
  for (let i = 0; i < nCols; i++) {
    if (!aisleMask[i]) continue;
    let n = 0;
    while (n < maxFiles && rowMasks[n][i]) n++;
    if (n === 0) continue;
    count += n;
    deepest = Math.max(deepest, n);
    if (!emit) continue;
    const x0 = along + (cStart + i) * w;
    for (let r = 0; r < n; r++) {
      const y0 = aisleY + p.aisleWidth + r * l;
      slots.push([
        [x0, y0],
        [x0 + w, y0],
        [x0 + w, y0 + l],
        [x0, y0 + l],
      ]);
      depths.push(r);
      files.push(n);
    }
  }
  return {
    count,
    pattern: count ? [deepest] : [],
    slots: emit ? slots : undefined,
    depths: emit ? depths : undefined,
    files: emit ? files : undefined,
    aisles: emit
      ? aisle.map(([a, b]) => quad(a, aisleY, b, aisleY + p.aisleWidth))
      : undefined,
  };
}

/** Bearings of the boundary edges, both ways round (the aisle lies on one side or the other). */
function edgeAngles(multi: Multi): number[] {
  const out: number[] = [];
  for (const poly of multi)
    for (const ring of poly)
      for (let i = 0; i + 1 < ring.length; i++) {
        const dx = ring[i + 1][0] - ring[i][0];
        const dy = ring[i + 1][1] - ring[i][1];
        if (Math.hypot(dx, dy) < 2) continue;
        const a = (Math.atan2(dy, dx) * 180) / Math.PI;
        for (const b of [a, a + 180]) {
          const n = ((b % 360) + 360) % 360;
          if (!out.some((x) => Math.abs(x - n) < 0.25)) out.push(n);
        }
      }
  return out;
}

function generateEdgeLayout(
  multi: Multi,
  params: LayoutParams,
  options: SearchOptions,
): LayoutResult {
  const empty: LayoutResult = {
    count: 0,
    angle: options.angle ?? 0,
    pattern: [],
    slots: [],
    depths: [],
    files: [],
    aisles: [],
  };
  const phaseStep = options.phaseStep ?? 0.5;
  const alongSteps = Math.max(1, options.alongSteps ?? 6);
  const angles =
    options.angle != null
      ? [options.angle, options.angle + 180]
      : edgeAngles(multi);
  type Candidate = {
    count: number;
    angle: number;
    aisleY: number;
    along: number;
    anchorDistance: number;
  };
  const candidates: Candidate[] = [];
  for (const angle of angles) {
    const rad = (angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const shape = new Rotated(multi, cos, sin);
    const anchor = options.anchor ? rotate(options.anchor, cos, sin) : null;
    let bestForAngle: Candidate | null = null;
    // The aisle hugs the edge, or floats a little inwards when the edge is not straight.
    for (
      let aisleY = shape.ymin;
      aisleY < shape.ymin + params.slotLength;
      aisleY += phaseStep
    ) {
      for (let s = 0; s < alongSteps; s++) {
        const along = shape.xmin + (s * params.slotWidth) / alongSteps;
        const { count } = evaluateEdge(shape, params, aisleY, along, false);
        const anchorDistance = anchor
          ? Math.abs(anchor[1] - (aisleY + params.aisleWidth / 2))
          : 0;
        if (!bestForAngle || count > bestForAngle.count)
          bestForAngle = { count, angle, aisleY, along, anchorDistance };
      }
    }
    if (bestForAngle) candidates.push(bestForAngle);
  }
  const top = Math.max(0, ...candidates.map((c) => c.count));
  if (top === 0) return empty;
  const ranked = candidates
    .filter((c) => c.count >= top * 0.97 || options.mustTouch)
    .sort(
      (a, b) =>
        (a.count >= top * 0.97 ? 0 : 1) - (b.count >= top * 0.97 ? 0 : 1) ||
        a.anchorDistance - b.anchorDistance ||
        b.count - a.count ||
        a.angle - b.angle,
    );
  for (const best of ranked) {
    const rad = (best.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const shape = new Rotated(multi, cos, sin);
    const result = evaluateEdge(shape, params, best.aisleY, best.along, true);
    const back = (q: Quad) => q.map((p) => unrotate(p, cos, sin)) as Quad;
    const aisles = (result.aisles ?? []).map(back);
    // A leftover piece is only worth filling when its aisle joins the aisles already laid.
    if (
      options.mustTouch &&
      intersection(aisles.map(quadPoly), options.mustTouch).length === 0
    )
      continue;
    return {
      count: result.count,
      angle: Math.round((((best.angle % 180) + 180) % 180) * 10) / 10,
      pattern: result.pattern,
      slots: (result.slots ?? []).map(back),
      depths: result.depths ?? [],
      files: result.files ?? [],
      aisles,
    };
  }
  return empty;
}

const quadPoly = (q: Quad): Poly => [[...q, q[0]]];

/** Pieces of the land the layout left empty, largest first, big enough for two files of one car. */
export function leftoverPieces(
  multi: Multi,
  result: Pick<LayoutResult, "slots" | "aisles">,
  params: LayoutParams,
): Multi {
  // The aisle rectangles overlap (an aisle and the spine): the union makes them one valid area.
  const occupied = union(result.slots.map(quadPoly), result.aisles.map(quadPoly));
  if (occupied.length === 0) return [];
  // 30 cm around what is laid: a car never touches another or the aisle's edge.
  const free = difference(multi, grow(occupied, 0.3));
  const minArea = 2 * params.slotWidth * params.slotLength;
  return free
    .filter((poly) => areaOf([poly]) >= minArea)
    .sort((a, b) => areaOf([b]) - areaOf([a]))
    .slice(0, 12);
}

/**
 * Comb (M-A): the leftovers of the band layout take files in another direction, from a short
 * aisle of their own that joins the aisles already laid. Returns the enriched result.
 */
function fillLeftovers(
  multi: Multi,
  result: LayoutResult,
  params: LayoutParams,
): LayoutResult {
  const pieces = leftoverPieces(multi, result, params);
  if (pieces.length === 0) return result;
  const network = grow(union(result.aisles.map(quadPoly)), 0.5);
  const edge: LayoutParams = {
    ...params,
    mode: "edge",
    crossAisles: false,
    endStalls: false,
    maxFiles: params.maxFiles ?? params.oneSidedDepth,
  };
  const out = { ...result, slots: [...result.slots], depths: [...result.depths], files: [...result.files], aisles: [...result.aisles] };
  for (const piece of pieces) {
    const r = generateEdgeLayout([piece], edge, { mustTouch: network });
    if (r.count === 0) continue;
    out.count += r.count;
    out.slots.push(...r.slots);
    out.depths.push(...r.depths);
    out.files.push(...r.files);
    out.aisles.push(...r.aisles);
  }
  return out;
}

/** Trims empty blocks at both ends of a pattern. */
function trimPattern(pattern: number[]): number[] {
  let start = 0;
  let end = pattern.length;
  while (start < end && pattern[start] === 0) start++;
  while (end > start && pattern[end - 1] === 0) end--;
  return pattern.slice(start, end);
}

export function generateLayout(
  multi: Multi,
  params: LayoutParams,
  options: SearchOptions = {},
): LayoutResult {
  const empty: LayoutResult = {
    count: 0,
    angle: options.angle ?? 0,
    pattern: [],
    slots: [],
    depths: [],
    files: [],
    aisles: [],
  };
  if (multi.length === 0) return empty;
  if (params.mode === "edge") return generateEdgeLayout(multi, params, options);
  const comb = params.mode === "comb";
  const angleStep = options.angleStep ?? 2;
  const phaseStep = options.phaseStep ?? 0.5;
  const alongSteps = Math.max(1, options.alongSteps ?? 6);
  // A comb is not symmetric: its spine sits at one end of the aisles, so both directions of
  // every bearing are tried (the angle keeps its full 0..360 range until the result is reported).
  const bearings =
    options.angle != null ? [options.angle] : candidateAngles(multi, angleStep);
  const angles = comb
    ? bearings.flatMap((a) => [a, (a + 180) % 360])
    : bearings;
  const period = params.blockDepth * params.slotLength + params.aisleWidth;

  type Candidate = {
    count: number;
    angle: number;
    phase: number;
    along: number;
    /** Comb: distance from the entrance to the spine, when an anchor is given. */
    anchorDistance: number;
  };
  const search = (
    angleList: number[],
    step: number,
    steps: number,
    p: LayoutParams = params,
  ) => {
    const found: Candidate[] = [];
    const period = p.blockDepth * p.slotLength + p.aisleWidth;
    for (const angle of angleList) {
      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const shape = new Rotated(multi, cos, sin);
      const anchor =
        comb && options.anchor ? rotate(options.anchor, cos, sin) : null;
      // The spine is the aisle-wide strip at the start of the runs, along the whole land.
      const anchorDistance = anchor
        ? Math.max(0, shape.xmin - anchor[0], anchor[0] - shape.xmin - p.aisleWidth)
        : 0;
      let bestForAngle: Candidate | null = null;
      for (let phase = 0; phase < period - EPS; phase += step) {
        const modules = buildModules(shape, p, phase);
        for (let s = 0; s < steps; s++) {
          const along = shape.xmin + (s * p.slotWidth) / steps;
          const { count } = evaluate(shape, modules, p, along, false);
          if (!bestForAngle || count > bestForAngle.count)
            bestForAngle = { count, angle, phase, along, anchorDistance };
        }
      }
      if (bestForAngle) found.push(bestForAngle);
    }
    return found;
  };

  // Coarse pass over every angle (1 m phases, 2 along-row offsets), then the full grid on the
  // best angles and their neighbours: same result as the full search in practice, far faster.
  // A comb's period is long (two deep blocks and an aisle): its coarse phases are spaced out too.
  const coarseStep = Math.max(phaseStep, 1, comb ? period / 40 : 0);
  const coarse =
    angles.length > 1
      ? search(angles, coarseStep, Math.min(2, alongSteps))
      : [];
  const finalists: number[] = [];
  if (angles.length === 1) finalists.push(angles[0]);
  else {
    const ranked = [...coarse].sort(
      (a, b) =>
        b.count - a.count || angles.indexOf(a.angle) - angles.indexOf(b.angle),
    );
    const span = comb ? 360 : 180;
    for (const c of ranked.slice(0, 6)) {
      for (const a of [
        c.angle,
        c.angle - angleStep / 2,
        c.angle + angleStep / 2,
      ]) {
        const n = ((a % span) + span) % span;
        if (!finalists.some((f) => Math.abs(f - n) < 0.1)) finalists.push(n);
      }
    }
  }
  // E-A (07/10/2026): a comb's files need not be as deep as allowed. Shallower blocks mean more
  // aisles, closer together: on a land too small or too cut up for the full period, the only way
  // to serve its middle. Every depth is tried on the finalist angles (coarse grid), the best wins
  // (the deepest on ties: fewer aisles), and the full grid then runs on that depth alone.
  let chosen = params;
  if (comb && angles.length > 0) {
    const maxDepth = Math.max(1, params.oneSidedDepth);
    let bestDepth: { count: number; p: LayoutParams } | null = null;
    for (let depth = maxDepth; depth >= 1; depth--) {
      const p: LayoutParams = {
        ...params,
        blockDepth: 2 * depth,
        oneSidedDepth: depth,
      };
      const step = Math.max(phaseStep, 1, (p.blockDepth * p.slotLength + p.aisleWidth) / 40);
      const count = Math.max(
        0,
        ...search(finalists, step, Math.min(2, alongSteps), p).map((c) => c.count),
      );
      if (!bestDepth || count > bestDepth.count) bestDepth = { count, p };
    }
    if (bestDepth) chosen = bestDepth.p;
  }
  const finals = search(finalists, phaseStep, alongSteps, chosen);
  const top = Math.max(0, ...finals.map((c) => c.count));
  if (top === 0) return empty;
  // The best count wins (first found on ties). A comb prefers, among the layouts within 1 % of
  // the best, one aligned on a boundary edge (a plan tilted by 2° for one more car reads badly),
  // then, with an entrance, the one whose spine is nearest to it.
  const edges = comb ? edgeAngles(multi) : [];
  const onEdge = (angle: number) =>
    edges.some((e) => Math.abs(e - angle) < 0.3 || Math.abs(e - angle) > 359.7);
  const best = comb
    ? finals
        .filter((c) => c.count >= top * 0.99)
        .sort(
          (a, b) =>
            Number(onEdge(b.angle)) - Number(onEdge(a.angle)) ||
            a.anchorDistance - b.anchorDistance ||
            b.count - a.count ||
            a.angle - b.angle,
        )[0]
    : finals.find((c) => c.count === top)!;

  // Rebuild the winner with its slots, back in the input frame.
  const rad = (best.angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const shape = new Rotated(multi, cos, sin);
  const result = evaluate(
    shape,
    buildModules(shape, chosen, best.phase),
    chosen,
    best.along,
    true,
  );
  const back = (q: Quad) => q.map((p) => unrotate(p, cos, sin)) as Quad;
  const laid: LayoutResult = {
    count: result.count,
    angle: Math.round((((best.angle % 180) + 180) % 180) * 10) / 10,
    pattern: trimPattern(result.pattern),
    slots: (result.slots ?? []).map(back),
    depths: result.depths ?? [],
    files: result.files ?? [],
    aisles: (result.aisles ?? []).map(back),
  };
  return comb ? fillLeftovers(multi, laid, params) : laid;
}
