import type { Estimate } from './estimate';
import type { Frame, LonLat } from './projection';
import { stayClassOf, type LayoutKey, type StayClass, type Zone } from './types';

export interface NumberedSpot {
  zoneId: string;
  code: string;
  row: number;
  index: number;
  geometry: [number, number][];
  /** Rank from the aisle and length of the file; the stay class follows (valet layouts only). */
  depth: number | null;
  fileLength: number | null;
  stayClass: StayClass | null;
}

/** "Zone A" → "A"; otherwise the first letters of the name, or the zone's rank. */
export function zoneLetter(zone: Zone, rank: number): string {
  const m = /^zone\s+([a-z0-9]{1,3})$/i.exec(zone.name.trim());
  if (m) return m[1].toUpperCase();
  const letters = zone.name
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .toUpperCase();
  return letters || String.fromCharCode(65 + (rank % 26));
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Same rule as the pro space (admin/src/lib/plan/numbering.ts): rows are the lines of slots along
 * the layout's bearing, north-most first, numbered from west to east. Code: "A-02-08".
 */
export function spotsFromLayout(result: Estimate, zones: Zone[], layout: LayoutKey, frame: Frame, slotLength: number): NumberedSpot[] {
  const out: NumberedSpot[] = [];
  zones.forEach((zone, rank) => {
    const z = result.zones.find(r => r.zoneId === zone.id);
    if (!z) return;
    const { slots, angle, depths, files } = z.layouts[layout];
    const valet = layout !== 'selfPark';
    const a = (angle * Math.PI) / 180;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const items = slots.map((ring, k) => {
      const corners = ring.slice(0, 4).map(p => frame.forward(p as LonLat));
      const cx = corners.reduce((s, p) => s + p[0], 0) / 4;
      const cy = corners.reduce((s, p) => s + p[1], 0) / 4;
      const depth = depths?.[k] ?? null;
      const fileLength = files?.[k] ?? null;
      return { ring, x: cx * cos + cy * sin, y: -cx * sin + cy * cos, depth, fileLength };
    });
    items.sort((p, q) => q.y - p.y || p.x - q.x);
    const letter = zoneLetter(zone, rank);
    let row = 0;
    let lastY = Number.POSITIVE_INFINITY;
    let current: typeof items = [];
    const flush = () => {
      current.sort((p, q) => p.x - q.x);
      current.forEach((it, i) =>
        out.push({
          zoneId: zone.id,
          code: `${letter}-${pad(row)}-${pad(i + 1)}`,
          row,
          index: i + 1,
          geometry: it.ring as [number, number][],
          depth: it.depth,
          fileLength: it.fileLength,
          stayClass: valet && it.depth != null && it.fileLength != null ? stayClassOf(it.depth, it.fileLength) : null,
        }),
      );
      current = [];
    };
    for (const it of items) {
      if (lastY - it.y > slotLength * 0.6) {
        if (current.length) flush();
        row += 1;
        lastY = it.y;
      }
      current.push(it);
    }
    if (current.length) flush();
  });
  return out;
}
