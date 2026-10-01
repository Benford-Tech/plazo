import { Service } from 'typedi';
import prisma, { Parking, Prisma } from '@/database';
import { bookableCapacity } from '@/domain/capacity';
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

  /** Load of each night between two local dates (inclusive). */
  public async nights(
    parking: Pick<Parking, 'id' | 'timezone' | 'totalCapacity' | 'safetyMarginPct'>,
    from: string,
    to: string,
    options: { excludeReservationId?: string; client?: Client } = {},
  ): Promise<NightLoad[]> {
    const client = options.client ?? prisma;
    const tz = parking.timezone;
    // The columns are "timestamp without time zone" holding UTC: read them as UTC first, then
    // convert to the parking's local time to get the local date.
    const rows = await client.$queryRaw<{ night: Date; count: number }[]>`
      SELECT d::date AS night, COUNT(r.id)::int AS count
      FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
      LEFT JOIN reservations r
        ON r."parkingId" = ${parking.id}
        AND r.status::text <> ALL(${RELEASED_STATUSES}::text[])
        AND (${options.excludeReservationId ?? null}::text IS NULL OR r.id <> ${options.excludeReservationId ?? null})
        AND ((r."arrivalAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date <= d::date
        AND d::date < GREATEST(
          ((r."returnAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date,
          ((r."arrivalAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz})::date + 1
        )
      GROUP BY d
      ORDER BY d`;
    const bookable = bookableCapacity(parking.totalCapacity, parking.safetyMarginPct);
    return rows.map(row => ({
      date: row.night.toISOString().slice(0, 10),
      count: row.count,
      bookable,
      free: bookable - row.count,
      overbooked: row.count > bookable,
    }));
  }

  /** Nights of a stay that are already full (one more vehicle would exceed the bookable capacity). */
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
