import httpStatus from 'http-status';
import { Service } from 'typedi';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';

// Public IGN services used by the capacity estimator (no key needed), called from the API so the
// pro space has no CORS issue and every call has a timeout.
export const API_CARTO_PARCELS_URL = 'https://apicarto.ign.fr/api/cadastre/parcelle';
export const GEOPF_WFS_URL = 'https://data.geopf.fr/wfs/ows';
export const GEOPF_GEOCODE_URL = 'https://data.geopf.fr/geocodage/search';

/** A BD TOPO query covers at most this span (degrees) so a call stays small. */
export const MAX_BBOX_SPAN = 0.05;

/** Below this score (0-1) a geocoding match is a guess, not the address. */
export const GEOCODE_MIN_SCORE = 0.3;

type Position = [number, number];
type Geometry = { type: string; coordinates: unknown };

export interface Parcel {
  id: string; // IDU, e.g. 692990000E1033
  section: string;
  numero: string;
  commune: string;
  insee: string;
  /** Surface from the cadastre, in m² (indicative). */
  contenance: number | null;
  geometry: Geometry;
}

export interface ParkingArea {
  id: string;
  name: string | null;
  geometry: Geometry;
}

/** A BD TOPO building (B-A, 07/10/2026): the footprint the plan excludes by itself. */
export interface BuildingArea {
  id: string;
  /** BD TOPO "nature", e.g. "Indifférenciée", "Industriel, agricole ou commercial". */
  nature: string | null;
  geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: unknown };
}

export interface GeocodeResult {
  label: string;
  type: string;
  lon: number;
  lat: number;
}

const unavailable = (service: string) => new HttpException(httpStatus.BAD_GATEWAY, `${service} is unavailable, try again`, 'geo_unavailable');

/** Drops the altitude BD TOPO adds to every position (-1000 when unknown). */
function to2d(coordinates: unknown): unknown {
  if (Array.isArray(coordinates) && typeof coordinates[0] === 'number') return [coordinates[0], coordinates[1]] as Position;
  return Array.isArray(coordinates) ? coordinates.map(to2d) : coordinates;
}

@Service()
export class GeoService {
  public timeoutMs = 10000;

  private async getJson(service: string, url: string, timeoutMs = this.timeoutMs): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
    } catch (error) {
      logger.error(`[Geo] ${service} call failed: ${error instanceof Error ? error.name : 'unknown error'}`);
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new HttpException(httpStatus.GATEWAY_TIMEOUT, `${service} did not answer in time`, 'geo_timeout');
      }
      throw unavailable(service);
    }
    if (!res.ok) {
      logger.error(`[Geo] ${service} answered HTTP ${res.status}`);
      throw unavailable(service);
    }
    try {
      return await res.json();
    } catch {
      throw unavailable(service);
    }
  }

  /** Cadastral parcels containing a point (API Carto, module cadastre). */
  public async parcelsAt(lon: number, lat: number): Promise<Parcel[]> {
    const geom = JSON.stringify({ type: 'Point', coordinates: [lon, lat] });
    const data = await this.getJson('API Carto', `${API_CARTO_PARCELS_URL}?${new URLSearchParams({ geom }).toString()}`);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .filter(f => f?.geometry && f?.properties?.idu)
      .slice(0, 10)
      .map(f => {
        const p = f.properties;
        return {
          id: String(p.idu),
          section: String(p.section ?? ''),
          numero: String(p.numero ?? ''),
          commune: String(p.nom_com ?? ''),
          insee: String(p.code_insee ?? ''),
          contenance: typeof p.contenance === 'number' ? p.contenance : null,
          geometry: { type: f.geometry.type, coordinates: to2d(f.geometry.coordinates) },
        };
      });
  }

  /** BD TOPO parking areas (equipement_de_transport, nature 'Parking') within a box. */
  public async parkingsIn(bbox: [number, number, number, number]): Promise<ParkingArea[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: '2.0.0',
      REQUEST: 'GetFeature',
      TYPENAMES: 'BDTOPO_V3:equipement_de_transport',
      OUTPUTFORMAT: 'application/json',
      SRSNAME: 'EPSG:4326',
      COUNT: '200',
      CQL_FILTER: `nature='Parking' AND BBOX(geometrie,${minLon},${minLat},${maxLon},${maxLat},'EPSG:4326')`,
    });
    const data = await this.getJson('Géoplateforme WFS', `${GEOPF_WFS_URL}?${params.toString()}`);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .filter(f => f?.geometry && ['Polygon', 'MultiPolygon'].includes(f.geometry.type))
      .map(f => ({
        id: String(f.properties?.cleabs ?? f.id),
        name: typeof f.properties?.toponyme === 'string' ? f.properties.toponyme : null,
        geometry: { type: f.geometry.type, coordinates: to2d(f.geometry.coordinates) },
      }));
  }

  /** BD TOPO buildings within a box (B-A): light constructions (sheds, shelters) included. */
  public async buildingsIn(bbox: [number, number, number, number]): Promise<BuildingArea[]> {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: '2.0.0',
      REQUEST: 'GetFeature',
      TYPENAMES: 'BDTOPO_V3:batiment',
      OUTPUTFORMAT: 'application/json',
      SRSNAME: 'EPSG:4326',
      COUNT: '500',
      CQL_FILTER: `BBOX(geometrie,${minLon},${minLat},${maxLon},${maxLat},'EPSG:4326')`,
    });
    const data = await this.getJson('Géoplateforme WFS', `${GEOPF_WFS_URL}?${params.toString()}`);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .filter(f => f?.geometry && ['Polygon', 'MultiPolygon'].includes(f.geometry.type))
      .map(f => ({
        id: String(f.properties?.cleabs ?? f.id),
        nature: typeof f.properties?.nature === 'string' ? f.properties.nature : null,
        geometry: { type: f.geometry.type as 'Polygon' | 'MultiPolygon', coordinates: to2d(f.geometry.coordinates) },
      }));
  }

  /** Address search (Géoplateforme geocoding, BAN). */
  public async geocode(q: string): Promise<GeocodeResult[]> {
    const params = new URLSearchParams({ q, limit: '6' });
    const data = await this.getJson('Géoplateforme geocoding', `${GEOPF_GEOCODE_URL}?${params.toString()}`);
    const features: any[] = Array.isArray(data?.features) ? data.features : [];
    return features
      .filter(f => f?.geometry?.type === 'Point' && typeof f?.properties?.label === 'string')
      .map(f => ({
        label: f.properties.label as string,
        type: String(f.properties.type ?? ''),
        lon: f.geometry.coordinates[0] as number,
        lat: f.geometry.coordinates[1] as number,
      }));
  }

  /**
   * Best match of an address (Géoplateforme geocoding), or null when there is none, it is too
   * uncertain or the service fails: callers treat a position as optional.
   */
  public async geocodeBest(q: string, timeoutMs: number, minScore = GEOCODE_MIN_SCORE): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({ q, limit: '1' });
      const data = await this.getJson('Géoplateforme geocoding', `${GEOPF_GEOCODE_URL}?${params.toString()}`, timeoutMs);
      const f = Array.isArray(data?.features) ? data.features[0] : null;
      const [lng, lat] = f?.geometry?.type === 'Point' && Array.isArray(f.geometry.coordinates) ? f.geometry.coordinates : [];
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      const score = typeof f.properties?.score === 'number' ? f.properties.score : 0;
      return score >= minScore ? { lat, lng } : null;
    } catch {
      return null;
    }
  }
}
