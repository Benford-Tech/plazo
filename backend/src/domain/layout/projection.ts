import proj4 from 'proj4';

// Every length and area of the capacity estimator is computed in Lambert-93 (EPSG:2154), the
// official projection of mainland France (scale error below 0.1 % around Lyon), never in Web
// Mercator (which inflates lengths by about 40 % at Lyon's latitude).
proj4.defs(
  'EPSG:2154',
  '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
);

export type LonLat = [number, number];
export type XY = [number, number];

const toL93Converter = proj4('EPSG:4326', 'EPSG:2154');

export function toL93(p: LonLat): XY {
  const [x, y] = toL93Converter.forward([p[0], p[1]]);
  return [x, y];
}

export function fromL93(p: XY): LonLat {
  const [lon, lat] = toL93Converter.inverse([p[0], p[1]]);
  return [lon, lat];
}

/**
 * A local metric frame: Lambert-93 coordinates relative to an origin (for numerical stability),
 * multiplied by the study's scale factor (a dimension measured on site corrects every length;
 * areas follow with its square).
 */
export interface Frame {
  origin: XY;
  scale: number;
  forward(p: LonLat): XY;
  inverse(p: XY): LonLat;
}

export function makeFrame(origin: LonLat, scale = 1): Frame {
  const o = toL93(origin);
  return {
    origin: o,
    scale,
    forward: p => {
      const [x, y] = toL93(p);
      return [(x - o[0]) * scale, (y - o[1]) * scale];
    },
    inverse: p => fromL93([o[0] + p[0] / scale, o[1] + p[1] / scale]),
  };
}

/** Distance in metres between two WGS84 points, in Lambert-93, times the scale factor. */
export function distanceM(a: LonLat, b: LonLat, scale = 1): number {
  const pa = toL93(a);
  const pb = toL93(b);
  return Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) * scale;
}

/** Signed shoelace area of a ring (positive when counter-clockwise). */
export function ringSignedArea(ring: XY[]): number {
  let sum = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

/** Area in m² of a GeoJSON Polygon (outer ring minus holes), in Lambert-93, times scale². */
export function polygonAreaM2(coordinates: LonLat[][], scale = 1): number {
  return (
    coordinates.reduce((sum, ring, i) => {
      const area = Math.abs(ringSignedArea(ring.map(toL93)));
      return i === 0 ? sum + area : sum - area;
    }, 0) *
    scale *
    scale
  );
}

/** Calibration from a dimension measured on site between two vertices. */
export function scaleFromMeasure(a: LonLat, b: LonLat, measuredM: number): number {
  const mapped = distanceM(a, b);
  if (!(mapped > 0) || !(measuredM > 0)) return 1;
  return measuredM / mapped;
}

export const SCALE_MIN = 0.5;
export const SCALE_MAX = 2;
