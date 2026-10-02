import { Container, Service } from 'typedi';
import prisma, { Prisma } from '@/database';
import { logger } from '@/utils/logger';
import { GeoService } from './geo.service';

export type LatLng = { lat: number; lng: number };
type Client = Prisma.TransactionClient | typeof prisma;

/** Geocoding when the operator saves the page: they are waiting for the answer anyway. */
export const SAVE_GEOCODE_TIMEOUT_MS = 4000;
/** Geocoding while a traveller waits for a page: short, and its failure only hides a marker. */
export const READ_GEOCODE_TIMEOUT_MS = 2000;
/** A failed lookup of the same address is not retried before this delay (per server instance). */
export const GEOCODE_RETRY_MS = 6 * 3600 * 1000;

/**
 * Position of a parking (Parking.location, a PostGIS point in WGS84) for the traveller site's map.
 * Until the pro space lets the operator place it, it comes from the parking's address through the
 * Géoplateforme geocoder: when the page or the address is saved, else the first time a traveller
 * needs it. A parking without a usable address simply has no position.
 */
@Service()
export class ParkingLocationService {
  public geo = Container.get(GeoService);
  /** "parkingId|address" -> time of the last failed lookup. */
  private failures = new Map<string, number>();

  /** Stored positions of some parkings (missing ids have none). */
  public async locations(parkingIds: string[], client: Client = prisma): Promise<Map<string, LatLng>> {
    const found = new Map<string, LatLng>();
    if (!parkingIds.length) return found;
    const rows = await client.$queryRaw<{ id: string; lat: number; lng: number }[]>`
      SELECT id, ST_Y(location) AS lat, ST_X(location) AS lng
      FROM parkings
      WHERE id IN (${Prisma.join(parkingIds)}) AND location IS NOT NULL`;
    for (const r of rows) found.set(r.id, { lat: Number(r.lat), lng: Number(r.lng) });
    return found;
  }

  public async store(parkingId: string, position: LatLng | null, client: Client = prisma): Promise<void> {
    if (position) {
      await client.$executeRaw`
        UPDATE parkings SET location = ST_SetSRID(ST_MakePoint(${position.lng}, ${position.lat}), 4326) WHERE id = ${parkingId}`;
    } else {
      await client.$executeRaw`UPDATE parkings SET location = NULL WHERE id = ${parkingId}`;
    }
  }

  /**
   * Geocodes the address of a parking without a position and stores the result. Never throws: the
   * position is optional. Returns the position (stored or found), or null.
   */
  public async locate(parking: { id: string; address: string | null }, timeoutMs: number): Promise<LatLng | null> {
    const existing = (await this.locations([parking.id])).get(parking.id);
    if (existing) return existing;
    const address = parking.address?.trim();
    if (!address) return null;
    const key = `${parking.id}|${address}`;
    const failedAt = this.failures.get(key);
    if (failedAt !== undefined && Date.now() - failedAt < GEOCODE_RETRY_MS) return null;

    const position = await this.geo.geocodeBest(address, timeoutMs);
    if (!position) {
      this.failures.set(key, Date.now());
      logger.warn(`[Location] no position found for parking ${parking.id}`);
      return null;
    }
    this.failures.delete(key);
    try {
      // Only fills an empty position: one set meanwhile (e.g. by the operator) wins.
      await prisma.$executeRaw`
        UPDATE parkings SET location = ST_SetSRID(ST_MakePoint(${position.lng}, ${position.lat}), 4326)
        WHERE id = ${parking.id} AND location IS NULL AND address = ${parking.address}`;
    } catch (error) {
      logger.error(`[Location] could not store the position of parking ${parking.id}: ${error instanceof Error ? error.message : error}`);
    }
    return position;
  }

  /**
   * Positions of the parkings of a public page: the stored ones, and a lookup (in parallel, short
   * timeout) for those that have an address but no position yet.
   */
  public async forPublic(parkings: { id: string; address: string | null }[]): Promise<Map<string, LatLng>> {
    const found = await this.locations(parkings.map(p => p.id));
    const missing = parkings.filter(p => !found.has(p.id) && p.address?.trim());
    const located = await Promise.all(missing.map(p => this.locate(p, READ_GEOCODE_TIMEOUT_MS)));
    missing.forEach((p, i) => {
      const position = located[i];
      if (position) found.set(p.id, position);
    });
    return found;
  }

  /** Forgets the failed lookups (tests). */
  public resetFailures(): void {
    this.failures.clear();
  }
}
