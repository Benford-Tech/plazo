import { Service } from 'typedi';
import prisma, { Prisma } from '@/database';

/** Activity rows are kept 400 days, like the site's visit counts. */
const KEPT_DAYS = 400;
const PERIODS = [7, 30, 90] as const;
const PLATFORMS = ['ios', 'android', 'web'];

export interface AppUsageDay {
  date: string;
  installs: number;
  plazoActive: number;
  proActive: number;
}

export interface AppUsageReport {
  days: number;
  from: string;
  to: string;
  plazo: {
    installs: number;
    installsBefore: number;
    activeToday: number;
    active7: number;
    active30: number;
    phones: number;
    platforms: { platform: string; count: number }[];
    bookings: number;
    bookingsCents: number;
  };
  pro: {
    activeToday: number;
    active7: number;
    active30: number;
    members: number;
    activeOperators7: number;
    operators: number;
  };
  series: AppUsageDay[];
  measuredSince: string | null;
}

/**
 * « Suivre le nombre de téléchargements et d'utilisation de plazo » (15/11/2026, choix « Mesuré par Plazo »): the Plazo
 * app's phones say hello at each launch (PUT /public/app-devices), Plazo Pro members are seen by their session; each is
 * counted once a day (Paris). The prospects' demo and the test operators (« … (tests) ») are left out of Plazo Pro.
 */
@Service()
export class AppUsageService {
  /** A phone of the Plazo app was opened today. */
  public async recordPlazo(deviceId: string, platform: string | null): Promise<void> {
    const p = platform && PLATFORMS.includes(platform) ? platform : null;
    await prisma.$executeRaw`
      INSERT INTO app_activity_days ("day", "app", "subject", "platform")
      VALUES ((now() AT TIME ZONE 'Europe/Paris')::date, 'plazo', ${deviceId}, ${p})
      ON CONFLICT DO NOTHING`.catch(() => undefined);
  }

  /** A Plazo Pro member (app or web) used Plazo today. */
  public async recordPro(staffId: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO app_activity_days ("day", "app", "subject")
      VALUES ((now() AT TIME ZONE 'Europe/Paris')::date, 'pro', ${staffId})
      ON CONFLICT DO NOTHING`.catch(() => undefined);
  }

  /** GET /internal/platform/apps?days=7|30|90 */
  public async report(requested: number): Promise<AppUsageReport> {
    const days = (PERIODS as readonly number[]).includes(requested) ? requested : 30;
    const [{ today }] = await prisma.$queryRaw<{ today: string }[]>`
      SELECT to_char((now() AT TIME ZONE 'Europe/Paris')::date, 'YYYY-MM-DD') AS today`;
    const to = today;
    const from = shiftDay(today, -(days - 1));
    const beforeFrom = shiftDay(from, -days);

    // Plazo Pro: real operators only (no prospects' demo, no « … (tests) »).
    const realStaff = Prisma.sql`
      SELECT s.id FROM staff s JOIN operators o ON o.id = s."operatorId"
      WHERE o."prospectDemo" = false AND o.name !~ '\\(tests\\)\\s*$'`;

    const active = async (app: 'plazo' | 'pro', since: string): Promise<number> => {
      const scope = app === 'pro' ? Prisma.sql`AND subject IN (${realStaff})` : Prisma.empty;
      const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(DISTINCT subject) AS n FROM app_activity_days
        WHERE app = ${app} AND "day" BETWEEN ${since}::date AND ${to}::date ${scope}`;
      return Number(row.n);
    };

    const installsBetween = async (a: string, b: string): Promise<number> => {
      const [row] = await prisma.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*) AS n FROM traveller_app_devices
        WHERE ("createdAt" AT TIME ZONE 'Europe/Paris')::date BETWEEN ${a}::date AND ${b}::date`;
      return Number(row.n);
    };

    const platforms = await prisma.$queryRaw<{ platform: string | null; n: bigint }[]>`
      SELECT platform, COUNT(DISTINCT subject) AS n FROM app_activity_days
      WHERE app = 'plazo' AND "day" BETWEEN ${from}::date AND ${to}::date
      GROUP BY platform ORDER BY n DESC`;

    const [bookings] = await prisma.$queryRaw<{ n: bigint; cents: bigint | null }[]>`
      SELECT COUNT(*) AS n, SUM("priceCents") AS cents FROM reservations
      WHERE "acquisitionSource" = 'app' AND "deletedAt" IS NULL
        AND status::text NOT IN ('pending_payment', 'cancelled')
        AND ("createdAt" AT TIME ZONE 'Europe/Paris')::date BETWEEN ${from}::date AND ${to}::date`;

    const [members] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM staff s JOIN operators o ON o.id = s."operatorId"
      WHERE s."isActive" = true AND s."deletedAt" IS NULL AND o."prospectDemo" = false AND o.name !~ '\\(tests\\)\\s*$'`;
    const [operators] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(*) AS n FROM operators o
      WHERE o.status = 'active' AND o."archivedAt" IS NULL AND o."prospectDemo" = false AND o.name !~ '\\(tests\\)\\s*$'`;
    const [activeOperators] = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT COUNT(DISTINCT s."operatorId") AS n FROM app_activity_days a JOIN staff s ON s.id = a.subject
      WHERE a.app = 'pro' AND a."day" BETWEEN ${shiftDay(to, -6)}::date AND ${to}::date AND a.subject IN (${realStaff})`;

    const daily = await prisma.$queryRaw<{ date: string; app: string; n: bigint }[]>`
      SELECT to_char("day", 'YYYY-MM-DD') AS date, app, COUNT(DISTINCT subject) AS n FROM app_activity_days
      WHERE "day" BETWEEN ${from}::date AND ${to}::date AND (app = 'plazo' OR subject IN (${realStaff}))
      GROUP BY "day", app`;
    const installsDaily = await prisma.$queryRaw<{ date: string; n: bigint }[]>`
      SELECT to_char(("createdAt" AT TIME ZONE 'Europe/Paris')::date, 'YYYY-MM-DD') AS date, COUNT(*) AS n
      FROM traveller_app_devices
      WHERE ("createdAt" AT TIME ZONE 'Europe/Paris')::date BETWEEN ${from}::date AND ${to}::date
      GROUP BY 1`;
    const [first] = await prisma.$queryRaw<{ day: string | null }[]>`
      SELECT to_char(MIN("day"), 'YYYY-MM-DD') AS day FROM app_activity_days`;

    const series: AppUsageDay[] = [];
    for (let d = from; d <= to; d = shiftDay(d, 1)) {
      series.push({
        date: d,
        installs: Number(installsDaily.find(r => r.date === d)?.n ?? 0),
        plazoActive: Number(daily.find(r => r.date === d && r.app === 'plazo')?.n ?? 0),
        proActive: Number(daily.find(r => r.date === d && r.app === 'pro')?.n ?? 0),
      });
    }

    const [phones] = await prisma.$queryRaw<{ n: bigint }[]>`SELECT COUNT(*) AS n FROM traveller_app_devices`;

    return {
      days,
      from,
      to,
      plazo: {
        installs: await installsBetween(from, to),
        installsBefore: await installsBetween(beforeFrom, shiftDay(from, -1)),
        activeToday: await active('plazo', to),
        active7: await active('plazo', shiftDay(to, -6)),
        active30: await active('plazo', shiftDay(to, -29)),
        phones: Number(phones.n),
        platforms: platforms.map(r => ({ platform: r.platform ?? 'unknown', count: Number(r.n) })),
        bookings: Number(bookings.n),
        bookingsCents: Number(bookings.cents ?? 0),
      },
      pro: {
        activeToday: await active('pro', to),
        active7: await active('pro', shiftDay(to, -6)),
        active30: await active('pro', shiftDay(to, -29)),
        members: Number(members.n),
        activeOperators7: Number(activeOperators.n),
        operators: Number(operators.n),
      },
      series,
      measuredSince: first.day,
    };
  }

  /** Nightly: rows older than 400 days. */
  public async purge(now = new Date()): Promise<number> {
    return prisma.$executeRaw`
      DELETE FROM app_activity_days WHERE "day" < (${now}::timestamptz AT TIME ZONE 'Europe/Paris')::date - ${KEPT_DAYS}::int`;
  }
}

/** « 2026-11-15 » + n days. */
function shiftDay(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
