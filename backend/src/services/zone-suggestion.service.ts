import Anthropic from '@anthropic-ai/sdk';
import httpStatus from 'http-status';
import jpeg from 'jpeg-js';
import { Service } from 'typedi';
import prisma from '@/database';
import { anthropicApiKey, zoneSuggestionModel } from '@/config';
import { autoZonesFrom, frameFor, polygonToMulti } from '@/domain/layout/estimate';
import { areaOf, intersection, simplify, type Multi } from '@/domain/layout/geometry';
import { metresPerPixel, TILE_SIZE, tileColumns, tileRows, tilesCovering, toLonLat, toPixel, zoomFor, type TileRange } from '@/domain/layout/tiles';
import type { CapacityStudy, Exclusion, GeoPolygon, Zone } from '@/domain/layout/types';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { SuggestZonesDto } from '@/dtos/parking-plan.dto';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';

/** IGN BD ORTHO tiles (no key, open licence): the same layer the pro space and the app draw on. */
export const IGN_ORTHO_TILE_URL = (z: number, x: number, y: number) =>
  `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&FORMAT=image/jpeg`;
/** The photo handed to Claude is at most this many tiles per side (1024 px): one image token budget, one look. */
export const MAX_TILES_PER_SIDE = 4;
/** A proposed surface smaller than this (m²) is dropped. */
export const MIN_SURFACE_M2 = 30;
const OUTLINE_COLOUR: [number, number, number] = [163, 230, 53];

export interface SuggestedSurface {
  /** Pixel ring of the stitched image, [x, y] × n. */
  points: [number, number][];
  label: string;
  surface: 'asphalt' | 'gravel' | 'concrete' | 'grass' | 'other';
  confidence: number;
}

export interface ZoneSuggestion {
  zones: Zone[];
  /** What Claude said about each surface it kept, for the pro space's card. */
  surfaces: { name: string; label: string; surface: string; confidence: number; area: number }[];
  image: { width: number; height: number; metresPerPixel: number; zoom: number };
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['surfaces'],
  properties: {
    surfaces: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['points', 'label', 'surface', 'confidence'],
        properties: {
          // Kept to the keywords structured outputs accept everywhere; sizes and ranges are checked in code.
          points: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
          label: { type: 'string' },
          surface: { type: 'string', enum: ['asphalt', 'gravel', 'concrete', 'grass', 'other'] },
          confidence: { type: 'number' },
        },
      },
    },
  },
};

/** The instructions, with grass as a parkable surface or not (H-A, 07/10/2026). */
export function systemPrompt(allowGrass: boolean): string {
  const ground = allowGrass
    ? 'asphalt, gravel, concrete, compacted ground or flat grass (a lawn, a meadow, a field) that is open to the sky'
    : 'asphalt, gravel, concrete or compacted ground that is open to the sky';
  const excluded = allowGrass
    ? 'buildings and roofs, awnings, hedges, bushes and tree canopies, water, public roads'
    : 'buildings and roofs, awnings, vegetation (lawn, hedges, tree canopies), water, public roads';
  const cut = allowGrass ? 'a building, a hedge or a line of trees' : 'a building or vegetation';
  return `You read aerial photographs of car parks for a parking operator's planning tool.
The photo is an IGN orthophoto (France, 20 cm resolution, north up). A bright green outline marks the operator's land.
Your job: outline every surface INSIDE the green outline where cars can be parked or driven to park:
${ground}. Include the lanes between rows (the tool lays
its own aisles). Exclude ${excluded}
outside the land, and clearly pedestrian or technical areas. Follow the real edges of the surface, with 6 to 20
points per surface. Separate surfaces that are cut from each other by ${cut}. Coordinates are pixels
of the image, origin at its top-left corner, x to the right, y downwards.`;
}

/**
 * V-A (07/10/2026): Claude proposes the parking zones from the IGN photo. The server stitches the
 * tiles covering the land, draws the outline on them, asks Claude Opus 5.5 for the drivable surfaces
 * inside it (structured output), converts the pixel polygons back to positions, clips them to the
 * land minus the exclusions and returns them as zones for the pro space to review. Nothing is saved.
 */
@Service()
export class ZoneSuggestionService {
  public timeoutMs = 10000;
  private client: Anthropic | null = null;

  public static enabled(): boolean {
    return !!anthropicApiKey();
  }

  public async suggest(actor: AuthenticatedStaff, parkingId: string, options: SuggestZonesDto = {}): Promise<ZoneSuggestion> {
    if (!ZoneSuggestionService.enabled()) {
      throw new HttpException(httpStatus.CONFLICT, 'The zone proposal needs an Anthropic API key', 'ai_unavailable');
    }
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    const plan = await prisma.parkingPlan.findUnique({ where: { parkingId: parking.id } });
    const outline = plan?.outline as unknown as GeoPolygon | null;
    if (!outline?.coordinates?.[0]?.length) throw new HttpException(httpStatus.BAD_REQUEST, 'The plan has no outline', 'no_outline');
    const exclusions = ((plan?.exclusions as unknown as Exclusion[] | null) ?? []).filter(e => e.kind !== 'reception');
    const scaleFactor = plan?.scaleFactor ?? 1;

    const ring = outline.coordinates[0];
    const bbox = bboxOf(ring);
    const zoom = zoomFor(bbox, MAX_TILES_PER_SIDE);
    const range = tilesCovering(bbox, zoom);
    const photo = await this.stitch(range);
    const outlinePx = ring.map(([lon, lat]) => toPixel(range, lon, lat));
    drawRing(photo, outlinePx, OUTLINE_COLOUR);
    const midLat = (bbox[1] + bbox[3]) / 2;
    const mpp = metresPerPixel(midLat, zoom);
    const jpg = jpeg.encode(photo, 85).data;

    const { surfaces, usage } = await this.ask(jpg.toString('base64'), photo.width, photo.height, mpp, outlinePx, options.allowGrass !== false);
    try {
      return this.toZones(surfaces, usage, { outline, exclusions, scaleFactor }, range, photo, mpp, zoom);
    } catch (error) {
      // A geometry the engine cannot digest: said as such rather than a bare 500.
      const reason = error instanceof Error ? error.message : String(error);
      logger.error(`[Zones] proposal could not be converted: ${reason}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, `The proposal could not be converted: ${reason}`, 'ai_failed', { reason });
    }
  }

  private toZones(
    surfaces: SuggestedSurface[],
    usage: ZoneSuggestion['usage'],
    input: Pick<CapacityStudy, 'outline' | 'exclusions' | 'scaleFactor'>,
    range: TileRange,
    photo: { width: number; height: number },
    mpp: number,
    zoom: number,
  ): ZoneSuggestion {
    const { outline } = input;
    if (!outline) throw new HttpException(httpStatus.BAD_REQUEST, 'The plan has no outline', 'no_outline');

    const frame = frameFor({ ...input, zones: [] });
    if (!frame) throw new HttpException(httpStatus.BAD_REQUEST, 'The plan has no outline', 'no_outline');
    const land = polygonToMulti(frame, outline);
    const proposed: Multi = [];
    const kept: { multi: Multi; label: string; surface: string; confidence: number }[] = [];
    for (const s of surfaces) {
      const pts = s.points.map(([x, y]) => toLonLat(range, x, y)).map(frame.forward);
      if (pts.length < 3) continue;
      const poly: Multi = [[[...pts, pts[0]]]];
      let clipped: Multi;
      try {
        clipped = intersection(poly, land);
      } catch {
        // A self-crossing ring from the model: skipped rather than failing the proposal.
        continue;
      }
      if (areaOf(clipped) < MIN_SURFACE_M2) continue;
      proposed.push(...clipped);
      kept.push({ multi: clipped, label: s.label, surface: s.surface, confidence: s.confidence });
    }
    // The pieces become zones like the automatic ones: exclusions deducted, one per piece, largest
    // first. Each zone carries what Claude said of the surface that covers it most.
    const zones = autoZonesFrom(simplify(proposed, 0.2), input, letter => `Zone ${letter}`, newId);
    const described = zones.map(z => {
      const multi = polygonToMulti(frame, z.geometry);
      let best = kept[0];
      let bestArea = -1;
      for (const k of kept) {
        let overlap = 0;
        try {
          overlap = areaOf(intersection(multi, k.multi));
        } catch {
          continue;
        }
        if (overlap > bestArea) {
          bestArea = overlap;
          best = k;
        }
      }
      return {
        name: z.name,
        label: best?.label ?? '',
        surface: best?.surface ?? 'other',
        confidence: best?.confidence ?? 0,
        area: Math.round(areaOf(multi)),
      };
    });
    return {
      zones,
      surfaces: described,
      image: { width: photo.width, height: photo.height, metresPerPixel: Math.round(mpp * 1000) / 1000, zoom },
      model: zoneSuggestionModel(),
      usage,
    };
  }

  /** The tiles of the range, decoded and laid side by side (RGBA). */
  public async stitch(range: TileRange): Promise<{ width: number; height: number; data: Buffer }> {
    const cols = tileColumns(range);
    const rows = tileRows(range);
    const width = cols * TILE_SIZE;
    const height = rows * TILE_SIZE;
    const data = Buffer.alloc(width * height * 4, 0);
    const jobs: Promise<void>[] = [];
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        jobs.push(
          this.fetchTile(range.zoom, range.xMin + tx, range.yMin + ty).then(tile => {
            if (!tile) return;
            for (let y = 0; y < TILE_SIZE; y++) {
              const src = y * tile.width * 4;
              const dst = ((ty * TILE_SIZE + y) * width + tx * TILE_SIZE) * 4;
              tile.data.copy(data, dst, src, src + TILE_SIZE * 4);
            }
          }),
        );
      }
    }
    await Promise.all(jobs);
    return { width, height, data };
  }

  /** One tile, decoded; null when the IGN does not serve it (left black). */
  public async fetchTile(z: number, x: number, y: number): Promise<{ width: number; height: number; data: Buffer } | null> {
    try {
      const res = await fetch(IGN_ORTHO_TILE_URL(z, x, y), { signal: AbortSignal.timeout(this.timeoutMs) });
      if (!res.ok) return null;
      const decoded = jpeg.decode(Buffer.from(await res.arrayBuffer()), { useTArray: false, formatAsRGBA: true });
      return { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.data) };
    } catch (error) {
      logger.warn(`[Zones] IGN tile ${z}/${x}/${y} not loaded: ${error instanceof Error ? error.name : 'unknown error'}`);
      return null;
    }
  }

  /** Claude's reading of the photo: the drivable surfaces inside the outline, as pixel rings. */
  public async ask(
    imageBase64: string,
    width: number,
    height: number,
    mpp: number,
    outlinePx: [number, number][],
    allowGrass = true,
  ): Promise<{ surfaces: SuggestedSurface[]; usage: ZoneSuggestion['usage'] }> {
    // Vercel allows this function 60 s: the call stays well under it (medium effort, short answer).
    this.client ??= new Anthropic({ apiKey: anthropicApiKey(), timeout: 45000, maxRetries: 0 });
    const outlineText = outlinePx.map(([x, y]) => `(${Math.round(x)}, ${Math.round(y)})`).join(', ');
    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create({
        model: zoneSuggestionModel(),
        max_tokens: 4000,
        system: systemPrompt(allowGrass),
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: RESPONSE_SCHEMA } },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
              {
                type: 'text',
                text:
                  `Image: ${width} × ${height} px, ${mpp.toFixed(2)} m per pixel. ` +
                  `The green outline passes through these pixels: ${outlineText}. ` +
                  (allowGrass ? 'Grass is allowed. ' : '') +
                  'Return the drivable surfaces inside it as JSON.',
              },
            ],
          },
        ],
      });
    } catch (error) {
      // Most specific first: a bad key, a rate limit, a timeout, any other API answer, the network.
      if (error instanceof Anthropic.AuthenticationError) {
        logger.error('[Zones] Anthropic rejected the API key');
        throw new HttpException(httpStatus.CONFLICT, 'The Anthropic API key is not accepted', 'ai_unavailable');
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Claude is busy, try again shortly', 'ai_busy');
      }
      if (error instanceof Anthropic.APIConnectionTimeoutError) {
        throw new HttpException(httpStatus.GATEWAY_TIMEOUT, 'Claude did not answer in time', 'ai_timeout');
      }
      if (error instanceof Anthropic.APIError) {
        // The answer's own words reach the pro space: a rejected request is fixed from them.
        logger.error(`[Zones] Anthropic answered ${error.status}: ${error.message}`);
        throw new HttpException(httpStatus.BAD_GATEWAY, `Anthropic answered ${error.status}`, 'ai_failed', {
          reason: `${error.status ?? '?'} ${error.message}`.slice(0, 300),
        });
      }
      const reason = error instanceof Error ? error.message : 'unknown error';
      logger.error(`[Zones] Anthropic call failed: ${reason}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude could not be reached', 'ai_failed', { reason: reason.slice(0, 300) });
    }
    if (response.stop_reason === 'refusal') {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude declined to read this photo', 'ai_refused');
    }
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');
    let parsed: { surfaces?: SuggestedSurface[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude answered something that is not JSON', 'ai_failed', {
        reason: `not JSON: ${text.slice(0, 120)}`,
      });
    }
    if (response.stop_reason === 'max_tokens') {
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Claude ran out of room for its answer', 'ai_failed', { reason: 'max_tokens' });
    }
    const surfaces = (parsed.surfaces ?? [])
      .filter(
        s => Array.isArray(s.points) && s.points.length >= 3 && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)),
      )
      .map(s => ({ ...s, confidence: Math.min(1, Math.max(0, Number(s.confidence) || 0)) }));
    return { surfaces, usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens } };
  }
}

const newId = () => Math.random().toString(36).slice(2, 10);

function bboxOf(ring: [number, number][]): [number, number, number, number] {
  let [w, s] = ring[0];
  let [e, n] = ring[0];
  for (const [x, y] of ring) {
    w = Math.min(w, x);
    e = Math.max(e, x);
    s = Math.min(s, y);
    n = Math.max(n, y);
  }
  return [w, s, e, n];
}

/** Draws a closed ring on an RGBA image, 3 px wide. */
export function drawRing(img: { width: number; height: number; data: Buffer }, ring: [number, number][], rgb: [number, number, number]): void {
  const put = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const px = Math.round(x) + dx;
        const py = Math.round(y) + dy;
        if (px < 0 || py < 0 || px >= img.width || py >= img.height) continue;
        const i = (py * img.width + px) * 4;
        img.data[i] = rgb[0];
        img.data[i + 1] = rgb[1];
        img.data[i + 2] = rgb[2];
        img.data[i + 3] = 255;
      }
    }
  };
  for (let i = 0; i < ring.length; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[(i + 1) % ring.length];
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let s = 0; s <= steps; s++) put(x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps);
  }
}
