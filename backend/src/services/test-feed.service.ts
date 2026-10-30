import { isProspectDemoName } from '@/domain/prospect-demo';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { isPlatformAdmin, testFeedOff } from '@/config';
import prisma, { Parking, Prisma, ReservationStatus } from '@/database';
import { customerNamesOf } from '@/domain/customer-name';
import { billableDays, quoteCents, Tier } from '@/domain/pricing';
import { newReference, statusSideEffects } from '@/domain/reservation';
import {
  applyWrite,
  FEED_PEOPLE,
  FEED_REFERENCES,
  FeedCounts,
  feedCounts,
  FeedPerson,
  feedPersonOf,
  feedRng,
  FeedRow,
  feedState,
  FeedStay,
  FeedWrite,
  handsOffReason,
  isTestOperatorName,
  planFeed,
  recordApplied,
  TEST_FEED_AUDIT_DAYS,
  TEST_FEED_DAY_PRICE_CENTS,
  TEST_FEED_HANDS_OFF_MINUTES,
  TEST_FEED_MANUAL_RUN_EVERY_SECONDS,
  TEST_FEED_MEMO_SECONDS,
  TEST_FEED_MIN_CAP,
  TEST_FEED_NOTE,
  TEST_FEED_POOL_SIZE,
  TEST_FEED_REFERENCE_DRAWS,
  TEST_FEED_RUN_EVERY_MINUTES,
} from '@/domain/test-feed';
import { PERSONAL_AUDIT_KEYS } from '@/domain/retention';
import { localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { CapacityService } from './capacity.service';

type Client = Prisma.TransactionClient | typeof prisma;
type ParkingRow = Pick<Parking, 'id' | 'timezone' | 'totalCapacity' | 'safetyMarginPct' | 'extraDayPriceCents'>;

const MINUTE = 60000;
const DAY = 24 * 60 * MINUTE;

/** What a run reports (test_feeds.lastReport, GET /internal/test-feed). */
export interface TestFeedReport {
  at: string;
  ms: number;
  cap: number;
  seats: number;
  counts: FeedCounts;
  moves: { plate: string; from: ReservationStatus; to: ReservationStatus; rule: string }[];
  rebooks: { plate: string; target: string; status: ReservationStatus; arrivalAt: string; returnAt: string }[];
  retimes: { plate: string; returnAt: string }[];
  skipped: { plate: string; reason: string }[];
  poolExhausted: boolean;
  listingPublished: boolean;
  error?: string;
}

export interface TestFeedView {
  enabled: boolean;
  /** The operator qualifies (active, neither archived nor a demo) and TEST_FEED is not off. */
  available: boolean;
  /** TEST_FEED=off. */
  killSwitch: boolean;
  ranAt: string | null;
  lastError: string | null;
  /** The test parking's listing is online (its fictional bookings take from its public capacity). */
  listingPublished: boolean;
  cap: number;
  report: unknown;
  pool: { plate: string; reference: string; status: ReservationStatus; arrivalAt: string; returnAt: string; onTrip: boolean }[];
}

export interface TestFeedLeft {
  plate: string;
  reason: 'on_trip' | 'busy';
}

/** Every move to « Rendu » takes the car off its spot, file and hook, and forgets where it stood. */
const CLEARED_ON_RETURN = {
  spotId: null,
  fileId: null,
  fileRank: null,
  keyHook: null,
  boardingTripId: null,
  carLat: null,
  carLng: null,
  carAccuracyM: null,
  carLocatedAt: null,
  carLocatedBy: null,
  carNote: null,
} as const;

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Not found', 'not_found');
const errorName = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError
    ? error.code
    : error instanceof HttpException
      ? (error.code ?? error.name)
      : error instanceof Error
        ? error.name
        : 'error';

/**
 * The continuous fictional travellers of the platform's own test operator (15/10/2026, « ajoute en continu des données
 * de tests pour le chauffeur pour qu'il ait toujours des personnes à emmener »): at each read of the driver's lists
 * (departures, pickups, the day's forecast, the planning), at most every 3 minutes, the 40 pool bookings TS-201-PZ to
 * TS-240-PZ are moved on (checked in, back, handed back) and rebooked so that a driver always has travellers to take to
 * the terminal and to fetch, whatever the hour (domain/test-feed.ts). Written with Prisma directly, never through
 * ReservationService: no push, no digest, no message, no flight. Only on « … (tests) » with an active platform admin
 * among its members, neither suspended, archived nor a demo, unless TEST_FEED=off. Never starts nor ends a trip.
 * Imports no service but the capacity's (ShuttleService and ReservationService import this one).
 */
@Service()
export class TestFeedService {
  public capacity = Container.get(CapacityService);
  /** When this server instance last tried each operator (ms): real operators pay nothing, the test one a query a minute. */
  public tried = new Map<string, number>();

  // ---------------------------------------------------------------- the trigger (the driver's reads)

  /** Called by the driver's lists right after they read the parking, before they read the bookings. Never throws. */
  public async maybeRun(actor: AuthenticatedStaff, parking: Parking): Promise<void> {
    // 21/10/2026: the prospects' demo (« Parking des Cèdres (démo) ») is fed the same way.
    if (!isTestOperatorName(actor.operatorName) && !isProspectDemoName(actor.operatorName)) return;
    if (testFeedOff()) return;
    const nowMs = Date.now();
    const last = this.tried.get(actor.operatorId);
    if (last !== undefined && nowMs >= last && nowMs - last < TEST_FEED_MEMO_SECONDS * 1000) return;
    this.tried.set(actor.operatorId, nowMs);
    try {
      await this.tick(actor.operatorId, parking, new Date());
    } catch (error) {
      await this.failed(actor.operatorId, error);
    }
  }

  /** Claims a run (one at a time, every 3 minutes at most, whatever the number of instances), then runs it. */
  public async tick(
    operatorId: string,
    parking: ParkingRow,
    now: Date,
    claimMs = TEST_FEED_RUN_EVERY_MINUTES * MINUTE,
  ): Promise<TestFeedReport | null> {
    const feed = await prisma.testFeed.findUnique({ where: { operatorId }, select: { id: true } });
    if (!feed) {
      // Switched on by itself at the first read after the deploy.
      if (!(await this.qualifies(operatorId))) return null;
      try {
        await prisma.testFeed.create({ data: { operatorId, enabled: true } });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
      }
    }
    const { count } = await prisma.testFeed.updateMany({
      where: { operatorId, enabled: true, OR: [{ ranAt: null }, { ranAt: { lte: new Date(now.getTime() - claimMs) } }] },
      data: { ranAt: now },
    });
    if (!count) return null;
    if (!(await this.qualifies(operatorId))) {
      await prisma.testFeed.update({ where: { operatorId }, data: { enabled: false, lastError: 'not_test_operator' } });
      logger.warn('[TestFeed] The operator is no longer the platform test operator: feed switched off');
      return null;
    }
    return this.run(operatorId, parking, now);
  }

  private async failed(operatorId: string, error: unknown) {
    const name = errorName(error);
    logger.warn(`[TestFeed] run failed: ${name}`);
    await prisma.testFeed.updateMany({ where: { operatorId }, data: { lastError: name } }).catch(() => undefined);
  }

  /**
   * The platform's test operator: named « … (tests) », with an active member whose e-mail is a platform admin's (as the
   * platform space tells its own account), active, neither archived nor a demo.
   */
  public async qualifies(operatorId: string): Promise<boolean> {
    const operator = await this.operatorOf(operatorId);
    return (
      !!operator &&
      (this.isTestOperator(operator) || operator.prospectDemo) &&
      operator.status === 'active' &&
      !operator.archivedAt &&
      !operator.isDemo
    );
  }

  private operatorOf(operatorId: string) {
    return prisma.operator.findUnique({
      where: { id: operatorId },
      select: {
        name: true,
        status: true,
        archivedAt: true,
        isDemo: true,
        prospectDemo: true,
        staff: { where: { isActive: true }, select: { email: true } },
      },
    });
  }

  private isTestOperator(operator: { name: string; staff: { email: string | null }[] }): boolean {
    return isTestOperatorName(operator.name) && operator.staff.some(s => isPlatformAdmin(s.email));
  }

  // ---------------------------------------------------------------- the pool

  private poolWhere(operatorId: string, parkingId: string): Prisma.ReservationWhereInput {
    return { operatorId, parkingId, externalReference: { in: FEED_REFERENCES } };
  }

  /** References not used yet (one query per draw, 5 draws at most: the run fails rather than loop). */
  private async freshReferences(client: Client, count: number): Promise<string[]> {
    const references = new Set<string>();
    for (let draw = 0; references.size < count; draw += 1) {
      if (draw >= TEST_FEED_REFERENCE_DRAWS) throw new Error('No free booking reference');
      const drawn = Array.from({ length: count - references.size }, () => newReference()).filter(r => !references.has(r));
      const taken = new Set(
        (await client.reservation.findMany({ where: { reference: { in: drawn } }, select: { reference: true } })).map(r => r.reference),
      );
      for (const reference of drawn) if (!taken.has(reference)) references.add(reference);
    }
    return [...references].slice(0, count);
  }

  /**
   * The 40 plates, created once as bookings cancelled 7 days ago (created, cancelled and dated then): the hourly digest
   * counts the bookings created within its hour, so it never counts these, nor their later stays.
   */
  private async ensurePool(operatorId: string, parking: ParkingRow, now: Date) {
    const existing = await prisma.reservation.findMany({
      where: { operatorId, externalReference: { in: FEED_REFERENCES } },
      select: { externalReference: true },
    });
    if (existing.length >= TEST_FEED_POOL_SIZE) return;
    const have = new Set(existing.map(r => r.externalReference));
    const missing = FEED_PEOPLE.filter(p => !have.has(p.externalReference));
    const references = await this.freshReferences(prisma, missing.length);
    const weekAgo = new Date(now.getTime() - 7 * DAY);
    await prisma.reservation.createMany({
      data: missing.map((person, i) => ({
        ...this.personFields(person),
        reference: references[i],
        operatorId,
        parkingId: parking.id,
        externalReference: person.externalReference,
        status: 'cancelled' as const,
        arrivalAt: weekAgo,
        returnAt: new Date(now.getTime() - 6 * DAY),
        passengers: 1,
        cancelledAt: weekAgo,
        createdAt: weekAgo,
        updatedAt: weekAgo,
        reminderExcludedAt: now,
      })),
      // A reference drawn meanwhile by another booking: that plate is created at the next run.
      skipDuplicates: true,
    });
  }

  private personFields(person: FeedPerson) {
    return {
      channel: person.channel,
      channelDetail: person.channelDetail,
      ...customerNamesOf({ customerFirstName: person.firstName, customerLastName: person.lastName }),
      customerPhone: person.phone,
      customerEmail: null,
      plate: person.plate,
      plateKey: person.plateKey,
      vehicleModel: person.vehicleModel,
      vehicleColour: person.vehicleColour,
      notes: TEST_FEED_NOTE,
    };
  }

  // ---------------------------------------------------------------- a run

  private async run(operatorId: string, parking: ParkingRow, now: Date): Promise<TestFeedReport | null> {
    const startedMs = Date.now();
    await this.ensurePool(operatorId, parking, now);
    const [vehicles, tiers, listing, pool] = await Promise.all([
      prisma.shuttleVehicle.findMany({ where: { operatorId, inService: true }, select: { seats: true } }),
      prisma.pricingTier.findMany({ where: { parkingId: parking.id }, select: { days: true, priceCents: true } }),
      prisma.listing.findUnique({ where: { parkingId: parking.id }, select: { status: true } }),
      prisma.reservation.findMany({ where: this.poolWhere(operatorId, parking.id), select: { id: true } }),
    ]);
    // The largest shuttle in service, 8 seats at most (8 without one, or with seats unknown).
    const seats = vehicles.length ? Math.max(1, Math.min(8, Math.max(...vehicles.map(v => v.seats ?? 8)))) : 8;
    const listingPublished = listing?.status === 'published';
    const price = (arrivalAt: Date, returnAt: Date) => priceOf(tiers, parking.extraDayPriceCents, arrivalAt, returnAt, parking.timezone);

    const outcome = await prisma.$transaction(
      async tx => {
        // The capacity's lock first, as ReservationService.update: the rebooks check the nights they take.
        await this.capacity.lock(tx, parking.id);
        const today = localDate(now, parking.timezone);
        const [night] = await this.capacity.nights(parking, today, today, { client: tx });
        const cap = Math.min(TEST_FEED_POOL_SIZE, Math.floor((night?.bookable ?? 0) / 2));
        const feed = await tx.testFeed.findUniqueOrThrow({ where: { operatorId }, select: { state: true, enabled: true } });
        // Switched off since this run was claimed (« feed-off » closes the pool under the same lock): nothing written,
        // or the bookings it just closed would be stocked again with nobody left to close them.
        if (!feed.enabled) return null;
        const ids = pool.map(r => r.id);
        const { rows, references, people } =
          cap >= TEST_FEED_MIN_CAP && ids.length
            ? await this.snapshot(tx, ids, now)
            : { rows: [], references: new Map<string, string>(), people: new Map<string, FeedPerson>() };
        const plan = planFeed({ now, timezone: parking.timezone, cap, seats, rows, state: feedState(feed.state) }, feedRng(operatorId, now));

        const current = new Map(rows.map(r => [r.id, r]));
        const applied: FeedWrite[] = [];
        const audits: Prisma.AuditLogCreateManyInput[] = [];
        const report: Omit<TestFeedReport, 'counts' | 'ms'> = {
          at: now.toISOString(),
          cap,
          seats,
          moves: [],
          rebooks: [],
          retimes: [],
          skipped: [...plan.skipped],
          poolExhausted: plan.poolExhausted,
          listingPublished,
          ...(plan.tooSmall ? { error: 'parking_too_small' } : {}),
        };
        const audit = (action: string, entityId: string, details: Prisma.InputJsonObject) =>
          audits.push({ operatorId, staffId: null, action, entityType: 'reservation', entityId, details: { ...details, via: 'test_feed' } });

        for (const w of plan.writes) {
          const before = current.get(w.id)!;
          if (w.kind === 'move') {
            await tx.reservation.update({ where: { id: w.id }, data: moveData(before, w, now), select: { id: true } });
            audit('reservation.status_changed', w.id, { from: w.from, to: w.to, rule: w.rule });
            report.moves.push({ plate: w.plate, from: w.from, to: w.to, rule: w.rule });
            current.set(w.id, applyWrite(before, w, now));
            applied.push(w);
          } else if (w.kind === 'retime') {
            await tx.reservation.update({
              where: { id: w.id },
              data: { returnAt: w.returnAt, priceCents: price(before.arrivalAt, w.returnAt), updatedAt: now },
              select: { id: true },
            });
            audit('reservation.updated', w.id, {
              target: w.target,
              reference: references.get(w.id) ?? null,
              status: before.status,
              arrivalAt: before.arrivalAt.toISOString(),
              returnAt: w.returnAt.toISOString(),
            });
            report.retimes.push({ plate: w.plate, returnAt: w.returnAt.toISOString() });
            current.set(w.id, applyWrite(before, w, now));
            applied.push(w);
          } else {
            // A new stay takes nights: none full (a 25-hour stay is tried instead), never overbooked.
            let stay: FeedStay | null = w.stay;
            for (const option of [w.stay, w.fallback]) {
              stay = option;
              const { full } = await this.capacity.fullNights(parking, option.arrivalAt, option.returnAt, { client: tx, excludeReservationId: w.id });
              if (!full.length) break;
              stay = null;
            }
            if (!stay) {
              report.skipped.push({ plate: w.plate, reason: 'full' });
              continue;
            }
            const person = people.get(w.id)!;
            const [reference] = await this.freshReferences(tx, 1);
            await tx.reservation.update({
              where: { id: w.id },
              data: rebookData(person, stay, reference, price(stay.arrivalAt, stay.returnAt), now),
              select: { id: true },
            });
            audit('reservation.updated', w.id, {
              target: w.target,
              reference,
              status: stay.status,
              arrivalAt: stay.arrivalAt.toISOString(),
              returnAt: stay.returnAt.toISOString(),
            });
            report.rebooks.push({
              plate: w.plate,
              target: w.target,
              status: stay.status,
              arrivalAt: stay.arrivalAt.toISOString(),
              returnAt: stay.returnAt.toISOString(),
            });
            const made: FeedWrite = { ...w, stay };
            current.set(w.id, applyWrite(before, made, now));
            references.set(w.id, reference);
            applied.push(made);
          }
        }
        // A new stay is a new booking: nothing of the plate's last stay follows it. A phone registered on it (a tester
        // opening the fictional booking in the traveller app) would get the pushes of every later fictional stay, an
        // arrival signal would show the new traveller « au point de rendez-vous », and its manage link would open the
        // next stays (manageTokenVersion, in rebookData). Personal data a member typed into it would escape the
        // retention, the pool's return dates never ageing: scrubbed from its history now, as the retention does.
        const rebooked = applied.filter(w => w.kind === 'rebook').map(w => w.id);
        if (rebooked.length) {
          await tx.travellerDevice.deleteMany({ where: { reservationId: { in: rebooked } } });
          await tx.arrivalSignal.deleteMany({ where: { reservationId: { in: rebooked } } });
          await tx.$executeRaw`
            UPDATE "audit_logs"
            SET "details" = ("details" - ${PERSONAL_AUDIT_KEYS}::text[]) || '{"anonymized": true}'::jsonb
            WHERE "entityType" = 'reservation' AND "entityId" = ANY(${rebooked}::text[])
              AND jsonb_typeof("details") = 'object' AND jsonb_exists_any("details", ${PERSONAL_AUDIT_KEYS}::text[])`;
        }
        if (audits.length) await tx.auditLog.createMany({ data: audits });
        const state = recordApplied(plan.state, applied, now);
        const done: TestFeedReport = {
          ...report,
          counts: feedCounts([...current.values()], now, parking.timezone, state.writes),
          ms: Date.now() - startedMs,
        };
        await tx.testFeed.update({
          where: { operatorId },
          data: {
            state: state as unknown as Prisma.InputJsonObject,
            lastReport: done as unknown as Prisma.InputJsonObject,
            lastError: plan.tooSmall ? 'parking_too_small' : null,
          },
        });
        return { report: done, written: applied.length, rebooks: report.rebooks.length };
      },
      { maxWait: 2000, timeout: 6000 },
    );
    if (!outcome) return null;
    // The feed's own history entries are kept a week: they never pile up (a run every 3 minutes, day and night).
    await prisma.$executeRaw`
      DELETE FROM "audit_logs"
      WHERE "operatorId" = ${operatorId} AND "createdAt" < ${new Date(now.getTime() - TEST_FEED_AUDIT_DAYS * DAY)}
        AND "staffId" IS NULL AND "entityType" = 'reservation' AND "details"->>'via' = 'test_feed'`;
    if (outcome.written) {
      const c = outcome.report.counts;
      logger.info(
        `[TestFeed] take=${c.toTake} soon=${c.soonReturns} pickup=${c.toPickUp} moves=${outcome.report.moves.length} ` +
          `rebooks=${outcome.rebooks} ms=${outcome.report.ms}`,
      );
    }
    return outcome.report;
  }

  /**
   * The pool as the run sees it, inside its transaction: the rows it could lock (one locked by someone else, a trip
   * starting or a member's change, is left alone), and their trips (running, or ended less than 10 minutes ago).
   */
  private async snapshot(
    tx: Prisma.TransactionClient,
    ids: string[],
    now: Date,
  ): Promise<{ rows: FeedRow[]; references: Map<string, string>; people: Map<string, FeedPerson> }> {
    const locked = new Set(
      (await tx.$queryRaw<{ id: string }[]>`SELECT id FROM reservations WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE SKIP LOCKED`).map(
        r => r.id,
      ),
    );
    const [rows, passengers] = await Promise.all([
      tx.reservation.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          reference: true,
          externalReference: true,
          plate: true,
          status: true,
          arrivalAt: true,
          returnAt: true,
          arrivedAt: true,
          returnedAt: true,
          updatedAt: true,
          passengers: true,
          flightEstimatedAt: true,
          flightLandedAt: true,
        },
      }),
      tx.shuttleTripPassenger.findMany({
        where: {
          reservationId: { in: ids },
          trip: { OR: [{ status: 'running' }, { endedAt: { gt: new Date(now.getTime() - TEST_FEED_HANDS_OFF_MINUTES * MINUTE) } }] },
        },
        select: { reservationId: true, trip: { select: { status: true, endedAt: true } } },
      }),
    ]);
    const people = new Map<string, FeedPerson>();
    for (const r of rows) {
      const person = feedPersonOf(r.externalReference);
      if (person) people.set(r.id, person);
    }
    return {
      references: new Map(rows.map(r => [r.id, r.reference])),
      people,
      rows: rows.map(r => {
        const trips = passengers.filter(p => p.reservationId === r.id).map(p => p.trip);
        const ended = trips.filter(trip => trip.status !== 'running' && trip.endedAt).map(trip => trip.endedAt!.getTime());
        return {
          id: r.id,
          plate: r.plate,
          status: r.status,
          arrivalAt: r.arrivalAt,
          returnAt: r.returnAt,
          arrivedAt: r.arrivedAt,
          returnedAt: r.returnedAt,
          updatedAt: r.updatedAt,
          passengers: r.passengers,
          flightEstimatedAt: r.flightEstimatedAt,
          flightLandedAt: r.flightLandedAt,
          locked: locked.has(r.id),
          onTrip: trips.some(trip => trip.status === 'running'),
          tripEndedAt: ended.length ? new Date(Math.max(...ended)) : null,
        };
      }),
    };
  }

  // ---------------------------------------------------------------- routes (GET / PUT / POST run)

  /** The test operator, else 404 (any other operator, whatever its role). */
  private async identify(operatorId: string): Promise<{ qualifies: boolean }> {
    const operator = await this.operatorOf(operatorId);
    if (!operator) throw notFound();
    if (!this.isTestOperator(operator)) {
      // Once the test operator (it has a feed), always able to see and switch off its fictional bookings: renamed, or
      // without its platform admin, the reads no longer run the feed and nothing else would ever close them.
      if (await prisma.testFeed.count({ where: { operatorId } })) return { qualifies: false };
      throw notFound();
    }
    return { qualifies: operator.status === 'active' && !operator.archivedAt && !operator.isDemo };
  }

  private async primary(operatorId: string): Promise<Parking> {
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' } });
    if (!parking) throw notFound();
    return parking;
  }

  /** GET /internal/test-feed: the switch, the last run and the pool. */
  public async view(actor: AuthenticatedStaff): Promise<TestFeedView> {
    const { qualifies } = await this.identify(actor.operatorId);
    const parking = await this.primary(actor.operatorId);
    const today = localDate(new Date(), parking.timezone);
    const [feed, listing, rows, nights] = await Promise.all([
      prisma.testFeed.findUnique({ where: { operatorId: actor.operatorId } }),
      prisma.listing.findUnique({ where: { parkingId: parking.id }, select: { status: true } }),
      prisma.reservation.findMany({
        where: this.poolWhere(actor.operatorId, parking.id),
        select: { id: true, plate: true, reference: true, status: true, arrivalAt: true, returnAt: true },
        orderBy: { plate: 'asc' },
      }),
      this.capacity.nights(parking, today, today),
    ]);
    const onTrip = new Set(
      (
        await prisma.shuttleTripPassenger.findMany({
          where: { reservationId: { in: rows.map(r => r.id) }, trip: { status: 'running' } },
          select: { reservationId: true },
        })
      ).map(p => p.reservationId),
    );
    const killSwitch = testFeedOff();
    return {
      // No row yet: it switches itself on at the next read of the driver's lists.
      enabled: feed ? feed.enabled : qualifies,
      available: qualifies && !killSwitch,
      killSwitch,
      ranAt: feed?.ranAt?.toISOString() ?? null,
      lastError: feed?.lastError ?? null,
      listingPublished: listing?.status === 'published',
      cap: Math.min(TEST_FEED_POOL_SIZE, Math.floor((nights[0]?.bookable ?? 0) / 2)),
      report: feed?.lastReport ?? null,
      pool: rows.map(r => ({
        plate: r.plate,
        reference: r.reference,
        status: r.status,
        arrivalAt: r.arrivalAt.toISOString(),
        returnAt: r.returnAt.toISOString(),
        onTrip: onTrip.has(r.id),
      })),
    };
  }

  /**
   * PUT /internal/test-feed { enabled }: on, the feed runs at once; off, every pool booking it may close is closed
   * (« Attendu » cancelled, the others handed back) and those left (on a trip, or busy) are listed: call it again later.
   */
  public async setEnabled(actor: AuthenticatedStaff, enabled: boolean): Promise<TestFeedView & { left?: TestFeedLeft[] }> {
    const { qualifies } = await this.identify(actor.operatorId);
    const parking = await this.primary(actor.operatorId);
    if (enabled) {
      if (!qualifies) throw new HttpException(httpStatus.CONFLICT, 'This operator cannot run the test feed', 'test_feed_unavailable');
      // Switched on again: a fresh hour of rebooks (the stock was closed when it was switched off, maybe minutes ago).
      // Already on: nothing reset, a run as « feed-run » (10 seconds apart), so that calling it again and again never
      // lifts the hourly budget.
      const before = await prisma.testFeed.findUnique({ where: { operatorId: actor.operatorId }, select: { state: true, enabled: true } });
      const wasOn = !!before?.enabled;
      const state = { writes: feedState(before?.state).writes, rebooks: [] };
      await prisma.testFeed.upsert({
        where: { operatorId: actor.operatorId },
        create: { operatorId: actor.operatorId, enabled: true, changedById: actor.id },
        update: wasOn ? { changedById: actor.id } : { enabled: true, ranAt: null, lastError: null, changedById: actor.id, state },
      });
      if (!wasOn) await this.auditSwitch(actor, 'test_feed.enabled', {});
      if (!testFeedOff()) {
        try {
          await this.tick(actor.operatorId, parking, new Date(), wasOn ? TEST_FEED_MANUAL_RUN_EVERY_SECONDS * 1000 : undefined);
        } catch (error) {
          await this.failed(actor.operatorId, error);
        }
      }
      return this.view(actor);
    }
    await prisma.testFeed.upsert({
      where: { operatorId: actor.operatorId },
      create: { operatorId: actor.operatorId, enabled: false, changedById: actor.id },
      update: { enabled: false, changedById: actor.id },
    });
    const left = await this.closePool(actor, parking, new Date());
    return { ...(await this.view(actor)), left };
  }

  private async auditSwitch(actor: AuthenticatedStaff, action: string, details: Prisma.InputJsonObject, client: Client = prisma) {
    await client.auditLog.create({
      data: {
        operatorId: actor.operatorId,
        staffId: actor.id,
        action,
        entityType: 'test_feed',
        details: { ...details, ...(actor.actingAs ? { viewAs: true } : {}) },
      },
    });
  }

  /** Closes the pool's open bookings that are nobody's now; returns the others. */
  private async closePool(actor: AuthenticatedStaff, parking: Parking, now: Date): Promise<TestFeedLeft[]> {
    const pool = await prisma.reservation.findMany({ where: this.poolWhere(actor.operatorId, parking.id), select: { id: true } });
    return prisma.$transaction(
      async tx => {
        await this.capacity.lock(tx, parking.id);
        const feed = await tx.testFeed.findUnique({ where: { operatorId: actor.operatorId }, select: { state: true } });
        const writes = feedState(feed?.state).writes;
        const { rows } = pool.length
          ? await this.snapshot(
              tx,
              pool.map(r => r.id),
              now,
            )
          : { rows: [] as FeedRow[] };
        const left: TestFeedLeft[] = [];
        const closedIds: string[] = [];
        for (const row of rows.sort((a, b) => a.plate.localeCompare(b.plate))) {
          if (['returned', 'cancelled', 'no_show'].includes(row.status)) continue;
          const reason = handsOffReason(row, now, writes);
          if (reason) {
            left.push({ plate: row.plate, reason: reason === 'on_trip' ? 'on_trip' : 'busy' });
            continue;
          }
          const to: ReservationStatus = row.status === 'upcoming' ? 'cancelled' : 'returned';
          await tx.reservation.update({
            where: { id: row.id },
            data: { status: to, ...statusSideEffects(row, to, now), ...(to === 'returned' ? CLEARED_ON_RETURN : {}), updatedAt: now },
            select: { id: true },
          });
          await tx.auditLog.create({
            data: {
              operatorId: actor.operatorId,
              staffId: actor.id,
              action: 'reservation.status_changed',
              entityType: 'reservation',
              entityId: row.id,
              details: { from: row.status, to, via: 'test_feed', rule: 'feed_off', ...(actor.actingAs ? { viewAs: true } : {}) },
            },
          });
          closedIds.push(row.id);
        }
        // These closures are the feed's own writes: switched on again within 15 minutes, it may rebook these plates at
        // once (else every plate it had in play would read as « changed by someone », and nobody would be left to take).
        if (closedIds.length) {
          const state = feedState(feed?.state);
          for (const id of closedIds) state.writes[id] = now.toISOString();
          await tx.testFeed.update({ where: { operatorId: actor.operatorId }, data: { state: state as unknown as Prisma.InputJsonObject } });
        }
        await this.auditSwitch(actor, 'test_feed.disabled', { closed: closedIds.length, left: left.length }, tx);
        return left;
      },
      { maxWait: 2000, timeout: 10000 },
    );
  }

  /** POST /internal/test-feed/run: a run now (10 seconds after the last one at least). */
  public async runNow(actor: AuthenticatedStaff): Promise<TestFeedView> {
    const { qualifies } = await this.identify(actor.operatorId);
    if (!qualifies) throw new HttpException(httpStatus.CONFLICT, 'This operator cannot run the test feed', 'test_feed_unavailable');
    const feed = await prisma.testFeed.findUnique({ where: { operatorId: actor.operatorId }, select: { enabled: true } });
    if (testFeedOff() || (feed && !feed.enabled)) throw new HttpException(httpStatus.CONFLICT, 'The test feed is off', 'test_feed_off');
    const parking = await this.primary(actor.operatorId);
    try {
      await this.tick(actor.operatorId, parking, new Date(), TEST_FEED_MANUAL_RUN_EVERY_SECONDS * 1000);
    } catch (error) {
      await this.failed(actor.operatorId, error);
    }
    return this.view(actor);
  }
}

/** The parking's grid price of the stay, else 15 € a billable day. */
function priceOf(tiers: Tier[], extraDayPriceCents: number | null, arrivalAt: Date, returnAt: Date, timezone: string): number {
  const days = billableDays(arrivalAt, returnAt, timezone);
  return quoteCents(tiers, extraDayPriceCents, days) ?? TEST_FEED_DAY_PRICE_CENTS * days;
}

/** A status change of the feed: the change's own fields (statusSideEffects), the run's overrides, the car let go when handed back. */
function moveData(before: FeedRow, w: Extract<FeedWrite, { kind: 'move' }>, now: Date): Prisma.ReservationUncheckedUpdateInput {
  return {
    status: w.to,
    ...statusSideEffects(before, w.to, now),
    ...(w.arrivedAt !== undefined ? { arrivedAt: w.arrivedAt } : {}),
    ...(w.returnedAt !== undefined ? { returnedAt: w.returnedAt } : {}),
    ...(w.to === 'returned' ? CLEARED_ON_RETURN : {}),
    updatedAt: now,
  };
}

/** A plate's new stay: a new reference, the same fictional person, nothing left of the last stay. */
function rebookData(person: FeedPerson, stay: FeedStay, reference: string, priceCents: number, now: Date): Prisma.ReservationUncheckedUpdateInput {
  return {
    reference,
    ...stay,
    channel: person.channel,
    channelDetail: person.channelDetail,
    ...customerNamesOf({ customerFirstName: person.firstName, customerLastName: person.lastName }),
    customerPhone: person.phone,
    customerEmail: null,
    customerNote: null,
    plate: person.plate,
    plateKey: person.plateKey,
    vehicleModel: person.vehicleModel,
    vehicleColour: person.vehicleColour,
    notes: TEST_FEED_NOTE,
    returnFlight: null,
    departureFlight: null,
    flightStatus: null,
    flightScheduledAt: null,
    flightEstimatedAt: null,
    flightLandedAt: null,
    flightLandedSource: null,
    flightTerminal: null,
    flightGate: null,
    flightOrigin: null,
    flightCheckedAt: null,
    departureStatus: null,
    departureScheduledAt: null,
    departureEstimatedAt: null,
    departureTerminal: null,
    departureDestination: null,
    departureCheckedAt: null,
    stopId: null,
    ...CLEARED_ON_RETURN,
    returnNoticeKind: null,
    returnNoticeText: null,
    returnNoticeAt: null,
    returnedAt: null,
    cancelledAt: null,
    anonymizedAt: null,
    landingNotifiedAt: null,
    landingSmsAt: null,
    parkedNotifiedAt: null,
    closingSentAt: null,
    reminderSentAt: null,
    reminderExcludedAt: now,
    reminderExcludedById: null,
    overbooked: false,
    importedPriceCents: null,
    priceCents,
    // The last stay's manage link stops working (domain/booking.ts, manageToken).
    manageTokenVersion: { increment: 1 },
    updatedAt: now,
  };
}
