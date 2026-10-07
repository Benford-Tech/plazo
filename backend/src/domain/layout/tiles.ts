/**
 * Web Mercator tile arithmetic for the IGN WMTS (tile matrix set "PM", 256 px tiles): which tiles
 * cover a box at a zoom, and how a pixel of the stitched image maps back to a position. Used by
 * the zone proposal (V-A, 07/10/2026), which hands Claude a photo of the land.
 */

export const TILE_SIZE = 256;
const EARTH_CIRCUMFERENCE_M = 40075016.686;

export interface TileRange {
  zoom: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function lonToTileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * 2 ** zoom;
}

export function latToTileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom;
}

export function tileXToLon(x: number, zoom: number): number {
  return (x / 2 ** zoom) * 360 - 180;
}

export function tileYToLat(y: number, zoom: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** zoom;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** The tiles covering a WGS84 box at a zoom, with a margin of tiles around it. */
export function tilesCovering(bbox: [number, number, number, number], zoom: number, margin = 0): TileRange {
  const [w, s, e, n] = bbox;
  return {
    zoom,
    xMin: Math.floor(lonToTileX(w, zoom)) - margin,
    xMax: Math.floor(lonToTileX(e, zoom)) + margin,
    yMin: Math.floor(latToTileY(n, zoom)) - margin,
    yMax: Math.floor(latToTileY(s, zoom)) + margin,
  };
}

export const tileColumns = (r: TileRange): number => r.xMax - r.xMin + 1;
export const tileRows = (r: TileRange): number => r.yMax - r.yMin + 1;

/** Metres on the ground per pixel at this zoom and latitude. */
export function metresPerPixel(lat: number, zoom: number): number {
  return (EARTH_CIRCUMFERENCE_M * Math.cos((lat * Math.PI) / 180)) / (TILE_SIZE * 2 ** zoom);
}

/** A position to a pixel of the stitched image (origin: the top-left tile's corner). */
export function toPixel(range: TileRange, lon: number, lat: number): [number, number] {
  return [(lonToTileX(lon, range.zoom) - range.xMin) * TILE_SIZE, (latToTileY(lat, range.zoom) - range.yMin) * TILE_SIZE];
}

/** A pixel of the stitched image back to a position. */
export function toLonLat(range: TileRange, px: number, py: number): [number, number] {
  return [tileXToLon(range.xMin + px / TILE_SIZE, range.zoom), tileYToLat(range.yMin + py / TILE_SIZE, range.zoom)];
}

/** The zoom at which the box fits in at most `maxTiles` tiles per side, 19 at best (the BD ORTHO's last level). */
export function zoomFor(bbox: [number, number, number, number], maxTiles: number, maxZoom = 19): number {
  for (let zoom = maxZoom; zoom > 10; zoom--) {
    const r = tilesCovering(bbox, zoom);
    if (tileColumns(r) <= maxTiles && tileRows(r) <= maxTiles) return zoom;
  }
  return 11;
}
