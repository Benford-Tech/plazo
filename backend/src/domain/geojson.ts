// Structural checks of the GeoJSON stored by the capacity estimator (WGS84 longitude/latitude).
// The pro space does the geometry; the API only refuses malformed or oversized payloads.

export const CAPACITY_LIMITS = {
  /** Vertices of one geometry (all rings). */
  maxVertices: 2000,
  maxZones: 50,
  maxExclusions: 200,
  maxParcels: 50,
  maxCarMarkers: 5000,
  /** Serialized size of free-form objects, in bytes. */
  maxSettingsBytes: 10_000,
  maxResultsBytes: 100_000,
  maxParcelsBytes: 300_000,
  maxNameLength: 120,
} as const;

export type GeometryType = 'Point' | 'LineString' | 'Polygon';

type Check = { ok: true } | { ok: false; code: string };
const OK: Check = { ok: true };
const fail = (code: string): Check => ({ ok: false, code });

export function isPosition(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    (value.length === 2 || value.length === 3) &&
    value.every(n => typeof n === 'number' && Number.isFinite(n)) &&
    Math.abs(value[0]) <= 180 &&
    Math.abs(value[1]) <= 90
  );
}

function checkRing(ring: unknown, minLength: number): { ok: boolean; vertices: number } {
  if (!Array.isArray(ring) || ring.length < minLength || !ring.every(isPosition)) return { ok: false, vertices: 0 };
  return { ok: true, vertices: ring.length };
}

/** Checks a GeoJSON geometry of one of the allowed types, with at most `maxVertices` positions. */
export function checkGeometry(value: unknown, allowed: GeometryType[], maxVertices: number = CAPACITY_LIMITS.maxVertices): Check {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('invalid_geometry');
  const { type, coordinates } = value as { type?: unknown; coordinates?: unknown };
  if (typeof type !== 'string' || !allowed.includes(type as GeometryType)) return fail('invalid_geometry');
  if (type === 'Point') return isPosition(coordinates) ? OK : fail('invalid_geometry');
  if (type === 'LineString') {
    const line = checkRing(coordinates, 2);
    if (!line.ok) return fail('invalid_geometry');
    return line.vertices > maxVertices ? fail('too_many_vertices') : OK;
  }
  // Polygon: closed rings of at least 4 positions.
  if (!Array.isArray(coordinates) || coordinates.length === 0 || coordinates.length > 100) return fail('invalid_geometry');
  let vertices = 0;
  for (const ring of coordinates) {
    const checked = checkRing(ring, 4);
    if (!checked.ok) return fail('invalid_geometry');
    const first = (ring as number[][])[0];
    const last = (ring as number[][])[(ring as number[][]).length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) return fail('invalid_geometry');
    vertices += checked.vertices;
  }
  return vertices > maxVertices ? fail('too_many_vertices') : OK;
}

function countPositions(coordinates: unknown): number {
  if (isPosition(coordinates)) return 1;
  return Array.isArray(coordinates) ? coordinates.reduce((sum: number, c) => sum + countPositions(c), 0) : 0;
}

export function jsonSize(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
}

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export const EXCLUSION_KINDS = ['building', 'reception', 'shuttle_lane', 'tree', 'post', 'other'] as const;

/** A list of { id, name, geometry, … } items (zones or exclusions). */
export function checkFeatureList(value: unknown, options: { maxItems: number; geometry: GeometryType[]; withKind?: boolean }): Check {
  if (!Array.isArray(value)) return fail('invalid_item');
  if (value.length > options.maxItems) return fail('too_many_items');
  let vertices = 0;
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return fail('invalid_item');
    const { id, name, geometry, kind, clearance } = item as Record<string, unknown>;
    if (typeof id !== 'string' || !ID_RE.test(id)) return fail('invalid_item');
    if (typeof name !== 'string' || name.length > CAPACITY_LIMITS.maxNameLength) return fail('invalid_item');
    if (options.withKind) {
      if (typeof kind !== 'string' || !(EXCLUSION_KINDS as readonly string[]).includes(kind)) return fail('invalid_item');
      if (typeof clearance !== 'number' || !Number.isFinite(clearance) || clearance < 0 || clearance > 50) return fail('invalid_item');
    }
    const geometryCheck = checkGeometry(geometry, options.geometry);
    if (!geometryCheck.ok) return geometryCheck;
    vertices += countPositions((geometry as { coordinates: unknown }).coordinates);
    if (vertices > CAPACITY_LIMITS.maxVertices * 5) return fail('too_many_vertices');
  }
  return OK;
}

/** [[lon, lat], …] markers placed on the aerial photo. */
export function checkMarkers(value: unknown): Check {
  if (!Array.isArray(value)) return fail('invalid_item');
  if (value.length > CAPACITY_LIMITS.maxCarMarkers) return fail('too_many_items');
  return value.every(isPosition) ? OK : fail('invalid_item');
}

/** A plain JSON object (not an array) whose serialization stays under `maxBytes`. */
export function checkObject(value: unknown, maxBytes: number): Check {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('invalid_item');
  return jsonSize(value) > maxBytes ? fail('too_large') : OK;
}

/** Cadastral parcels kept with the study: small objects with string/number fields. */
export function checkParcels(value: unknown): Check {
  if (!Array.isArray(value)) return fail('invalid_item');
  if (value.length > CAPACITY_LIMITS.maxParcels) return fail('too_many_items');
  if (!value.every(p => p && typeof p === 'object' && !Array.isArray(p) && typeof (p as { id?: unknown }).id === 'string')) {
    return fail('invalid_item');
  }
  return jsonSize(value) > CAPACITY_LIMITS.maxParcelsBytes ? fail('too_large') : OK;
}
