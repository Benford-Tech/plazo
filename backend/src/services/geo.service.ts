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

  private async getJson(service: string, url: string): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(this.timeoutMs) });
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
}
