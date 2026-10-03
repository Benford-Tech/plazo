import { Service } from 'typedi';
import { haversineMeters, LatLng } from '@/domain/arrival';
import { logger } from '@/utils/logger';

/** The IGN Géoplateforme routing service (free, no key): https://geoservices.ign.fr/documentation/services/services-geoplateforme/itineraire */
export const IGN_ROUTING_URL = 'https://data.geopf.fr/navigation/itineraire';
/** Average walking speed of the straight-line fallback. */
const WALKING_SPEED_KMH = 4.5;
/** A route is reused this long (the traveller asks again as they walk; the airport does not move). */
export const ROUTE_CACHE_MS = 3 * 60000;
/** Starts within this distance share a cached route (the traveller's position jitters). */
const ROUTE_CACHE_RADIUS_M = 40;
const MAX_CACHE_ENTRIES = 500;

export interface WalkingRoute {
  /** [lat, lng] pairs, start to end. */
  geometry: [number, number][];
  distanceM: number;
  durationMinutes: number;
  /** True when the routing service could not answer: a straight line at walking pace. */
  fallback: boolean;
  from: LatLng;
  to: LatLng;
}

type CacheEntry = { key: string; from: LatLng; to: LatLng; route: WalkingRoute; expiresAt: number };

/**
 * Pedestrian routes to the meeting point, computed by the IGN Géoplateforme (the app never calls
 * it directly). Cached per booking for a few minutes; a straight line when the service fails.
 * Positions are never logged.
 */
@Service()
export class RoutingService {
  public timeoutMs = 6000;
  private cache = new Map<string, CacheEntry>();

  public async walkingRoute(cacheKey: string, from: LatLng, to: LatLng, now = Date.now()): Promise<WalkingRoute> {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now && this.sameLeg(cached, from, to)) return cached.route;
    const route = (await this.fetchRoute(from, to)) ?? this.straightLine(from, to);
    this.remember(cacheKey, from, to, route, now);
    return route;
  }

  public straightLine(from: LatLng, to: LatLng): WalkingRoute {
    const distanceM = Math.round(haversineMeters(from, to));
    return {
      geometry: [
        [from.lat, from.lng],
        [to.lat, to.lng],
      ],
      distanceM,
      durationMinutes: Math.max(1, Math.ceil((distanceM / 1000 / WALKING_SPEED_KMH) * 60)),
      fallback: true,
      from,
      to,
    };
  }

  private async fetchRoute(from: LatLng, to: LatLng): Promise<WalkingRoute | null> {
    const params = new URLSearchParams({
      resource: 'bdtopo-osrm',
      profile: 'pedestrian',
      optimization: 'fastest',
      start: `${from.lng},${from.lat}`,
      end: `${to.lng},${to.lat}`,
      geometryFormat: 'geojson',
      getSteps: 'false',
      getBbox: 'false',
      distanceUnit: 'meter',
      timeUnit: 'minute',
    });
    try {
      const res = await fetch(`${IGN_ROUTING_URL}?${params}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!res.ok) {
        logger.warn(`[Routing] IGN answered ${res.status}`);
        return null;
      }
      return this.parse(await res.json(), from, to);
    } catch (error) {
      logger.warn(`[Routing] IGN unreachable: ${error instanceof Error ? error.name : 'unknown error'}`);
      return null;
    }
  }

  /** { distance, duration, geometry: { type: LineString, coordinates: [[lng, lat], …] } }. */
  private parse(body: any, from: LatLng, to: LatLng): WalkingRoute | null {
    const coordinates: unknown = body?.geometry?.coordinates;
    if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
    const geometry: [number, number][] = [];
    for (const point of coordinates) {
      if (!Array.isArray(point) || typeof point[0] !== 'number' || typeof point[1] !== 'number') return null;
      geometry.push([point[1], point[0]]);
    }
    const distanceM = typeof body.distance === 'number' ? Math.round(body.distance) : Math.round(haversineMeters(from, to));
    const durationMinutes =
      typeof body.duration === 'number' ? Math.max(1, Math.ceil(body.duration)) : Math.max(1, Math.ceil((distanceM / 1000 / WALKING_SPEED_KMH) * 60));
    return { geometry, distanceM, durationMinutes, fallback: false, from, to };
  }

  private sameLeg(entry: CacheEntry, from: LatLng, to: LatLng): boolean {
    return haversineMeters(entry.from, from) <= ROUTE_CACHE_RADIUS_M && haversineMeters(entry.to, to) <= 1;
  }

  private remember(key: string, from: LatLng, to: LatLng, route: WalkingRoute, now: number) {
    if (this.cache.size >= MAX_CACHE_ENTRIES) {
      for (const [k, entry] of this.cache) if (entry.expiresAt <= now) this.cache.delete(k);
      if (this.cache.size >= MAX_CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value as string);
    }
    this.cache.set(key, { key, from, to, route, expiresAt: now + ROUTE_CACHE_MS });
  }

  public clearCache() {
    this.cache.clear();
  }
}
