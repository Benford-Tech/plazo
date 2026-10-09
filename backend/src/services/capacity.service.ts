import { Service } from 'typedi';
import prisma, { Parking, Prisma } from '@/database';
import { bookableCapacity, effectiveCapacity, type CapacitySource, type PlanCapacity } from '@/domain/capacity';
import { RELEASED_STATUSES } from '@/domain/reservation';
import { addDays, localDate } from '@/domain/time';

export interface NightLoad {
  date: string; // YYYY-MM-DD, local to the parking
  count: number; // vehicles present that night
  bookable: number;
  free: number; // may be negative when overbooked
  overbooked: boolean;
}

type Client = Prisma.TransactionClient | typeof prisma;

/** The capacity used everywhere, as the pro space and the app show it. */
export interface ParkingCapacity {
  /** `Parking.totalCapacity`: the figure typed by the operator, used while the plan has no room. */
  declaredCapacity: number;
  /** Files, else active spots, else declared (`effectiveCapacity`). */
  effectiveCapacity: number;
  capacitySource: CapacitySource;
  /** `effectiveCapacity` minus the safety margin. */
  bookableCapacity: number;
}

/**
 * The room of each parking's plan in one query (active files' capacity, active spots), for any
 * number of parkings: the platform's lists read many at once. A parking without a plan reads 0, 0.
 */
export async function loadPlanCapacity(parkingIds: string[], client: Client = prisma): Promise<Map<string, PlanCapacity>> {
  const ids = [...new Set(parkingIds)];
  const result = new Map<string, PlanCapacity>(ids.map(id => [id, { activeFilesCapacity: 0, activeSpots: 0 }]));
  if (!ids.length) return result;
  const rows = await client.$queryRaw<{ parkingId: string; files: number; spots: number }[]>`
    SELECT p.id AS "parkingId",
      COALESCE((SELECT SUM(f.capacity) FROM parking_files f WHERE f."parkingId" = p.id AND f.active), 0)::int AS files,
      (SELECT COUNT(*) FROM parking_spots s WHERE s."parkingId" = p.id AND s.active)::int AS spots
    FROM parkings p
    WHERE p.id = ANY(${ids}::text[])`;
  for (const row of rows) result.set(row.parkingId, { activeFilesCapacity: row.files, activeSpots: row.spots });
  return result;
}

/** The declared figure, the effective capacity and its source, and what can be booked of it. */
export function parkingCapacity(parking: Pick<Parking, 'totalCapacity' | 'safetyMarginPct'>, plan: PlanCapacity): ParkingCapacity {
  const effective = effectiveCapacity({ declared: parking.totalCapacity, ...plan });
  return {
    declaredCapacity: parking.totalCapacity,
    effectiveCapacity: effective.total,
    capacitySource: effective.source,
    bookableCapacity: bookableCapacity(effective.total, parking.safetyMarginPct),
  };
}

/**
 * A reservation occupies a spot every night from its arrival date to the day before its return
 * date (local dates). A same-day stay still holds its arrival date.
 */
export function occupiedNights(arrivalAt: Date, returnAt: Date, timeZone: string): string[] {
  const first = localDate(arrivalAt, timeZone);
  const last = localDate(returnAt, timeZone);
  const nights: string[] = [];
  for (let d = first; d < last || d === first; d = addDays(d, 1)) nights.push(d);
  return nights;
}

@Service()
export class CapacityService {
  /**
   * Serializes capacity checks per parking until the end of the transaction: two concurrent
   * bookings (staff or travellers) cannot both take the last spot.
   */
  public async lock(tx: Prisma.TransactionClient, parkingId: string) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${parkingId}))`;
  }

  /**
   * Load of each night between two local dates (inclusive), against the effective capacity (the
   * plan's room, else the declared figure), read in the same query: the public search makes one
   * call per listing.
   */
  public async nights(
    parking: Pick<Parking, 'id' | 'timezone' | 'totalCapacity' | 'safetyMarginPct'>,
    from: string,
    to: string,
    options: { excludeReservationId?: string; client?: Client } = {},
  ): Promise<NightLoad[]> {
    const client = options.client ?? prisma;
    const tz = parking.timezone;
    const now = new Date();
    // The columns are "timestamp without time zone" holding UTC: read them as UTC first, then
    // convert to the parking's local time to get the local date.
    const rows = await client.$queryRaw<{ night: Date; count: number; files: number; spots: number }[]>`
      WITH plan AS (
        SELECT
          COALESCE((SELECT SUM(f.capacity) FROM parking_files f WHERE f."parkingId" = ${parking.id} AND f.active), 0)::int AS files,
          (SELECT COUNT(*) FROM parking_spots s WHERE s."parkingId" = ${parking.id} AND s.active)::int AS spots
      )
      SELECT d::date AS night, COUNT(r.id)::int AS count, plan.files, plan.spots
      FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
      CROSS JOIN plan
      LEFT JOIN reservations r
        ON r."parkingId" = ${parking.id}
        AND r.status::text <> ALL(${RELEASED_STATUSES}::text[])
        -- A place held for an online payment counts until its hold ends (even before the sweep).
        AND NOT (r.status::text = 'pending_payment' AND r."holdExpiresAt" <= ${now})
        AND (${options.excludeReservationId ?? null}::text IS NULL OR r.id <> ${options.excludeReservationId ?? null})
        AND ((r."arrivalAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date <= d::date
        AND d::date < GREATEST(
          ((r."returnAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date,
          ((r."arrivalAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date + 1
        )
      GROUP BY d, plan.files, plan.spots
      ORDER BY d`;
    if (!rows.length) return [];
    const { bookableCapacity: bookable } = parkingCapacity(parking, { activeFilesCapacity: rows[0].files, activeSpots: rows[0].spots });
    return rows.map(row => ({
      date: row.night.toISOString().slice(0, 10),
      count: row.count,
      bookable,
      free: bookable - row.count,
      overbooked: row.count > bookable,
    }));
  }

  /**
   * Nights of a stay that are already full (one more vehicle would exceed the bookable capacity):
   * staff bookings, imports, the form's preview, the site's search and booking, late payments.
   */
  public async fullNights(
    parking: Pick<Parking, 'id' | 'timezone' | 'totalCapacity' | 'safetyMarginPct'>,
    arrivalAt: Date,
    returnAt: Date,
    options: { excludeReservationId?: string; client?: Client } = {},
  ): Promise<{ nights: NightLoad[]; full: NightLoad[] }> {
    const stay = occupiedNights(arrivalAt, returnAt, parking.timezone);
    const nights = await this.nights(parking, stay[0], stay[stay.length - 1], options);
    return { nights, full: nights.filter(n => n.count + 1 > n.bookable) };
  }
}
