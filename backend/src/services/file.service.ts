import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ParkingFile, Prisma, ReservationStatus } from '@/database';
import { HOLDING_STATUSES, ON_SITE_STATUSES } from '@/domain/reservation';
import {
  blockersIn,
  type ExpectedReturns,
  type FileChoice,
  frontCar,
  isKeptByHand,
  movesToday,
  planEmptyFiles,
  positionFromAisle,
  rankFiles,
  type StackCar,
  type StackFile,
  stackOf,
} from '@/domain/file-stacks';
import { buildFiles } from '@/domain/files';
import { addDays, DATE_RE, dayBounds, localDate, parseInstant } from '@/domain/time';
import { AssignFileDto, FileInputDto, ReplaceFilesDto } from '@/dtos/file.dto';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { TravellerMessagesService } from './traveller-messages.service';

const HOLDING: ReservationStatus[] = HOLDING_STATUSES;
const ON_SITE: ReservationStatus[] = ON_SITE_STATUSES;
/** A car placed this long before its booked arrival counts as a check-in, later as a pre-assignment. */
const CHECK_IN_AHEAD_HOURS = 6;
/** The night preparation looks this far ahead. */
const PLAN_DAYS = 14;
/** The planning of the files: default and longest window, in days. */
const PLANNING_DAYS = 7;
const PLANNING_MAX_DAYS = 31;

const carSelect = {
  id: true,
  reference: true,
  customerName: true,
  plate: true,
  status: true,
  arrivalAt: true,
  returnAt: true,
  returnFlight: true,
  fileId: true,
  fileRank: true,
  keyHook: true,
  vehicleModel: true,
  vehicleColour: true,
} as const;
type CarRow = Prisma.ReservationGetPayload<{ select: typeof carSelect }>;

export interface FileCarView extends CarRow {
  onSite: boolean;
  leavesToday: boolean;
  /** 1 = first out (at the aisle). */
  position: number;
  /** Cars in front that leave later: to take out before this one leaves. */
  blockedBy: { reservationId: string; reference: string; plate: string; returnAt: Date }[];
}

export interface FileView {
  id: string;
  code: string;
  name: string | null;
  capacity: number;
  geometry: unknown;
  sortOrder: number;
  active: boolean;
  plannedDay: string | null;
  /** The planned day was chosen by hand (Planning des files): the night preparation leaves it. */
  keptByHand: boolean;
  /** The return day the file serves: its front car's, else the planned one. */
  day: string | null;
  /** Cars from the aisle to the back. */
  cars: FileCarView[];
  /** Cars to take out today because of this file's order. */
  movesToday: number;
  sound: boolean;
}

/** Planning des files (08/10/2026): one file, as the planning lists it. */
export interface FilePlanningFile {
  id: string;
  code: string;
  name: string | null;
  capacity: number;
  active: boolean;
  plannedDay: string | null;
  keptByHand: boolean;
  /** The return day the file serves: its front car's local day, else the planned one. */
  day: string | null;
  cars: number;
  sound: boolean;
}

/** One day of the planning window. */
export interface FilePlanningLoad {
  date: string;
  /** Holding bookings whose return falls on that local day. */
  returns: number;
  /** Of those, already in a file. */
  placed: number;
  toCome: number;
  /** Holding bookings overlapping the day. */
  onSite: number;
  /** Codes of the files serving that day (front car returning that day). */
  filesServing: string[];
  /** Codes of the empty active files kept for that day. */
  filesKept: string[];
  /** Free slots in the active files serving or kept for the day (a closed file offers none). */
  room: number;
  /** Cars to come without a slot in those files. */
  missing: number;
}

export type FilePlanningAlert =
  | { kind: 'missing_room'; date: string; count: number }
  | { kind: 'over_capacity'; date: string; count: number }
  | { kind: 'unsound'; fileCode: string; count: number };

export interface FilePlanning {
  from: string;
  days: number;
  timezone: string;
  /** The parking's local day as the server reckons it, so the clients never trust the device clock. */
  today: string;
  /** Sum of the capacities of the active files. */
  capacity: number;
  files: FilePlanningFile[];
  load: FilePlanningLoad[];
  alerts: FilePlanningAlert[];
}

/**
 * S-C (07/10/2026): the files of a valet parking, the rule that says which file an arriving car
 * takes, and the night preparation that keeps empty files for the big return days.
 */
@Service()
export class FileService {
  public audit = Container.get(AuditService);
  public messages = Container.get(TravellerMessagesService);

  /** The board: every file with its stack, the arrivals to place with their file, today's moves. */
  public async board(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await this.parkingOf(actor, parkingId);
    const today = localDate(new Date(), parking.timezone);
    const { start, end } = dayBounds(today, parking.timezone);
    await this.prepareIfStale(parking.id, parking.timezone, today);
    const [rows, holding] = await Promise.all([
      prisma.parkingFile.findMany({ where: { parkingId: parking.id }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: HOLDING }, OR: [{ fileId: { not: null } }, { arrivalAt: { lt: end } }] },
        select: carSelect,
        orderBy: { arrivalAt: 'asc' },
      }),
    ]);
    const stacks = this.stacks(rows, holding);
    const localDay = (d: Date) => localDate(d, parking.timezone);
    const files: FileView[] = stacks.map(f => {
      const blockers = blockersIn(f);
      const stack = stackOf(f).reverse();
      const front = frontCar(f);
      return {
        id: f.id,
        code: f.code,
        name: f.name,
        capacity: f.capacity,
        geometry: f.geometry,
        sortOrder: f.sortOrder,
        active: f.active,
        plannedDay: f.plannedDay,
        keptByHand: f.keptByHand,
        day: front ? localDay(front.returnAt) : f.plannedDay,
        cars: stack.map((c, i) => {
          const row = holding.find(h => h.id === c.reservationId) as CarRow;
          return {
            ...row,
            onSite: ON_SITE.includes(row.status),
            leavesToday: row.returnAt >= start && row.returnAt < end,
            position: i + 1,
            blockedBy: (blockers.get(c.reservationId) ?? []).map(b => ({
              reservationId: b.reservationId,
              reference: b.reference,
              plate: b.plate,
              returnAt: b.returnAt,
            })),
          };
        }),
        movesToday: movesToday(f, start, end),
        sound: blockers.size === 0,
      };
    });
    // Arrivals to place: on site without a file, or booked for today and not placed yet.
    const unplaced = holding
      .filter(r => !r.fileId && (ON_SITE.includes(r.status) || (r.arrivalAt >= start && r.arrivalAt < end)))
      .sort((a, b) => Number(ON_SITE.includes(b.status)) - Number(ON_SITE.includes(a.status)) || a.arrivalAt.getTime() - b.arrivalAt.getTime());
    const arrivals = [];
    // Each arrival takes its file in the ranking: the next one sees it with one more car.
    const working = stacks.map(f => ({ ...f, cars: [...f.cars] }));
    for (const r of unplaced) {
      const choices = rankFiles(working, { returnAt: r.returnAt, returnDay: localDay(r.returnAt) }, { localDay });
      const best = choices[0] && choices[0].reason !== 'full' ? choices[0] : null;
      if (best) {
        const f = working.find(w => w.id === best.fileId) as StackFile;
        f.cars.push({ ...this.stackCar(r), rank: f.cars.length + 1 });
      }
      arrivals.push({ ...r, onSite: ON_SITE.includes(r.status), choices: choices.slice(0, 4), suggested: best });
    }
    const cars = files.reduce((s, f) => s + f.cars.length, 0);
    return {
      date: today,
      timezone: parking.timezone,
      files,
      arrivals,
      stats: {
        files: files.filter(f => f.active).length,
        capacity: files.filter(f => f.active).reduce((s, f) => s + f.capacity, 0),
        cars,
        onSite: files.reduce((s, f) => s + f.cars.filter(c => c.onSite).length, 0),
        leavingToday: files.reduce((s, f) => s + f.cars.filter(c => c.leavesToday).length, 0),
        movesToday: files.reduce((s, f) => s + f.movesToday, 0),
        unsound: files.filter(f => !f.sound).length,
      },
    };
  }

  /** The ranked files for one booking (the app's "Autre file…"). */
  public async choicesFor(actor: AuthenticatedStaff, parkingId: string, reservationId: string): Promise<FileChoice[]> {
    const parking = await this.parkingOf(actor, parkingId);
    const r = await prisma.reservation.findFirst({ where: { id: reservationId, parkingId: parking.id }, select: carSelect });
    if (!r) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    const [rows, placed] = await Promise.all([
      prisma.parkingFile.findMany({ where: { parkingId: parking.id }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
      prisma.reservation.findMany({
        where: { parkingId: parking.id, status: { in: HOLDING }, fileId: { not: null }, id: { not: r.id } },
        select: carSelect,
      }),
    ]);
    const localDay = (d: Date) => localDate(d, parking.timezone);
    return rankFiles(this.stacks(rows, placed), { returnAt: r.returnAt, returnDay: localDay(r.returnAt) }, { localDay });
  }

  /** Saves the files of the plan: upserts by id, deletes the empty ones left out (409 when one holds cars). */
  public async replace(actor: AuthenticatedStaff, parkingId: string, data: ReplaceFilesDto) {
    const parking = await this.parkingOf(actor, parkingId);
    const codes = new Set<string>();
    for (const f of data.files) {
      const code = f.code.toUpperCase();
      if (codes.has(code)) throw new HttpException(httpStatus.BAD_REQUEST, `Duplicate file code ${code}`, 'duplicate_code');
      codes.add(code);
      if (f.geometry && (f.geometry.length < 2 || f.geometry.some(p => !Array.isArray(p) || p.length !== 2 || p.some(n => typeof n !== 'number'))))
        throw new HttpException(httpStatus.BAD_REQUEST, 'A file geometry needs two positions', 'invalid_geometry');
    }
    const existing = await prisma.parkingFile.findMany({
      where: { parkingId: parking.id },
      include: { _count: { select: { reservations: { where: { status: { in: HOLDING } } } } } },
    });
    const keep = new Set(data.files.map(f => f.id).filter(Boolean) as string[]);
    const gone = existing.filter(e => !keep.has(e.id));
    const occupied = gone.find(g => g._count.reservations > 0);
    if (occupied) throw new HttpException(httpStatus.CONFLICT, `File ${occupied.code} holds cars`, 'file_occupied');
    await prisma.$transaction(async tx => {
      if (gone.length) await tx.parkingFile.deleteMany({ where: { id: { in: gone.map(g => g.id) } } });
      // Two passes so a code swap does not hit the unique index.
      for (const f of data.files)
        if (f.id && keep.has(f.id)) await tx.parkingFile.update({ where: { id: f.id }, data: { code: `~${f.id.slice(-6)}` } });
      for (const [i, f] of data.files.entries()) {
        const row = this.rowOf(f, i);
        if (f.id && existing.some(e => e.id === f.id)) await tx.parkingFile.update({ where: { id: f.id }, data: row });
        else await tx.parkingFile.create({ data: { ...row, parkingId: parking.id } });
      }
      await this.audit.record(
        actor,
        { action: 'parking.files_replaced', entityType: 'parking', entityId: parking.id, details: { files: data.files.length } },
        tx,
      );
    });
    return this.list(parking.id);
  }

  /** Builds the files from the valet spots of the plan (one file per lane of spots), replacing the empty ones. */
  public async fromSpots(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await this.parkingOf(actor, parkingId);
    const spots = await prisma.parkingSpot.findMany({ where: { parkingId: parking.id, active: true, depth: { not: null } } });
    if (!spots.length) throw new HttpException(httpStatus.CONFLICT, 'The plan has no valet files', 'no_valet_spots');
    const lanes = [...new Set(buildFiles(spots).values())].filter(l => l.length > 0);
    // Order by zone, then along the aisle (west to east, then south to north) so the codes follow the ground.
    lanes.sort((a, b) => a[0].zoneId.localeCompare(b[0].zoneId) || a[0].lon - b[0].lon || a[0].lat - b[0].lat);
    const holdingCount = await prisma.reservation.count({ where: { parkingId: parking.id, status: { in: HOLDING }, fileId: { not: null } } });
    if (holdingCount) throw new HttpException(httpStatus.CONFLICT, 'Files already hold cars', 'file_occupied');
    const files: FileInputDto[] = lanes.map((lane, i) => {
      const first = lane[0];
      const last = lane[lane.length - 1];
      return {
        code: `F${String(i + 1).padStart(2, '0')}`,
        capacity: lane.length,
        geometry:
          lane.length > 1
            ? [
                [first.lon, first.lat],
                [last.lon, last.lat],
              ]
            : [
                [first.lon, first.lat],
                [first.lon, first.lat],
              ],
        sortOrder: i,
      };
    });
    await prisma.$transaction(async tx => {
      await tx.parkingFile.deleteMany({ where: { parkingId: parking.id } });
      await tx.parkingFile.createMany({ data: files.map((f, i) => ({ ...this.rowOf(f, i), parkingId: parking.id })) });
      await this.audit.record(
        actor,
        { action: 'parking.files_from_spots', entityType: 'parking', entityId: parking.id, details: { files: files.length } },
        tx,
      );
    });
    return this.list(parking.id);
  }

  public async list(parkingId: string) {
    return prisma.parkingFile.findMany({ where: { parkingId }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] });
  }

  /** Puts the vehicle in a file (in front of the others) or takes it out; a move is traced. */
  public async assign(actor: AuthenticatedStaff, reservationId: string, data: AssignFileDto) {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId }, include: { file: true } });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    if (!HOLDING.includes(reservation.status)) throw new HttpException(httpStatus.BAD_REQUEST, 'This booking cannot be placed', 'not_placeable');
    let file: ParkingFile | null = null;
    let rank: number | null = null;
    if (data.fileId) {
      file = await prisma.parkingFile.findFirst({ where: { id: data.fileId, parkingId: reservation.parkingId } });
      if (!file) throw new HttpException(httpStatus.NOT_FOUND, 'File not found', 'file_not_found');
      if (!file.active) throw new HttpException(httpStatus.BAD_REQUEST, 'This file is closed', 'file_inactive');
      const others = await prisma.reservation.findMany({
        where: { fileId: file.id, id: { not: reservation.id }, status: { in: HOLDING } },
        select: { fileRank: true },
      });
      if (others.length >= file.capacity) throw new HttpException(httpStatus.CONFLICT, `File ${file.code} is full`, 'file_full');
      rank = reservation.fileId === file.id && reservation.fileRank ? reservation.fileRank : Math.max(0, ...others.map(o => o.fileRank ?? 0)) + 1;
    }
    const keyHook = data.keyHook === undefined ? reservation.keyHook : data.keyHook?.trim() || null;
    const car = data.car
      ? {
          carLat: data.car.lat,
          carLng: data.car.lng,
          carAccuracyM: data.car.accuracyM ?? null,
          carLocatedAt: new Date(),
          carLocatedBy: 'staff' as const,
          carNote: data.car.note?.trim() || null,
        }
      : {};
    // Decision A (06/10/2026): placing the car of a traveller expected today (or late) is the check-in.
    const checkIn = !!file && reservation.status === 'upcoming' && reservation.arrivalAt.getTime() - Date.now() <= CHECK_IN_AHEAD_HOURS * 3600000;
    const updated = await prisma.$transaction(async tx => {
      const row = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          fileId: file?.id ?? null,
          fileRank: rank,
          keyHook,
          ...car,
          ...(checkIn ? { status: 'arrived', arrivedAt: reservation.arrivedAt ?? new Date() } : {}),
        },
        include: { file: { select: { id: true, code: true, name: true } } },
      });
      if (checkIn) {
        await this.audit.record(
          actor,
          {
            action: 'reservation.status_changed',
            entityType: 'reservation',
            entityId: reservation.id,
            details: { from: 'upcoming', to: 'arrived', by: 'file_assigned' },
          },
          tx,
        );
      }
      await this.audit.record(
        actor,
        {
          action: 'reservation.file_assigned',
          entityType: 'reservation',
          entityId: reservation.id,
          details: { from: reservation.file?.code ?? null, to: file?.code ?? null, rank, keyHook, carLocated: !!data.car },
        },
        tx,
      );
      // A file that gets its first car loses its planned day (even one chosen by hand): its front
      // car says what it serves now.
      if (file && (file.plannedDay || file.keptByHand))
        await tx.parkingFile.update({ where: { id: file.id }, data: { plannedDay: null, keptByHand: false } });
      return row;
    });
    if (file && !reservation.fileId) await this.messages.carParked(reservation.id);
    const position = file ? await this.positionOf(file.id, reservation.id) : null;
    return { ...updated, filePosition: position };
  }

  /** Where a placed car stands, for the sheets: "File F07 · 3e depuis l'allée". */
  public async positionOf(fileId: string, reservationId: string): Promise<number | null> {
    const cars = await prisma.reservation.findMany({ where: { fileId, status: { in: HOLDING } }, select: carSelect });
    return positionFromAisle({ cars: cars.map(c => this.stackCar(c)) }, reservationId);
  }

  /**
   * Night preparation (also on demand): keeps empty files for the coming days with the most cars
   * to come, from the bookings of the next two weeks. A file kept by hand keeps its day until that
   * day has passed; it then goes back to the automatic pool.
   */
  public async prepare(parkingId: string, timezone: string, today: string): Promise<{ planned: number; free: number }> {
    const [rows, holding] = await Promise.all([
      prisma.parkingFile.findMany({ where: { parkingId } }),
      prisma.reservation.findMany({ where: { parkingId, status: { in: HOLDING } }, select: carSelect }),
    ]);
    if (!rows.length) return { planned: 0, free: 0 };
    const stacks = this.stacks(rows, holding).map(f => ({ ...f, keptByHand: f.keptByHand && !!f.plannedDay && f.plannedDay >= today }));
    const kept = new Set(stacks.filter(isKeptByHand).map(f => f.id));
    const localDay = (d: Date) => localDate(d, timezone);
    const horizon = addDays(today, PLAN_DAYS);
    const counts = new Map<string, number>();
    for (const r of holding) {
      if (r.fileId) continue;
      const day = localDay(r.returnAt);
      if (day < today || day > horizon) continue;
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
    const expected: ExpectedReturns[] = [...counts.entries()].map(([day, cars]) => ({ day, cars }));
    const plan = planEmptyFiles(stacks, expected, localDay);
    const now = new Date();
    await prisma.$transaction([
      // Files with cars take their role from their front car; every file is stamped so the board knows the plan is today's.
      prisma.parkingFile.updateMany({
        where: { parkingId, id: { notIn: [...plan.keys()] } },
        data: { plannedDay: null, keptByHand: false, plannedAt: now },
      }),
      ...[...plan.entries()].map(([id, day]) =>
        prisma.parkingFile.update({ where: { id }, data: { plannedDay: day, keptByHand: kept.has(id), plannedAt: now } }),
      ),
    ]);
    const planned = [...plan.values()].filter(Boolean).length;
    return { planned, free: plan.size - planned };
  }

  public async prepareFor(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await this.parkingOf(actor, parkingId);
    return this.prepare(parking.id, parking.timezone, localDate(new Date(), parking.timezone));
  }

  /** Every parking with files: the nightly cron. */
  public async prepareAll(): Promise<{ parkings: number; planned: number }> {
    const parkings = await prisma.parking.findMany({ where: { files: { some: {} } }, select: { id: true, timezone: true } });
    let planned = 0;
    for (const p of parkings) planned += (await this.prepare(p.id, p.timezone, localDate(new Date(), p.timezone))).planned;
    return { parkings: parkings.length, planned };
  }

  /**
   * Planning des files (08/10/2026): day by day over a window, the returns to come against the
   * room of the files serving or kept for that day, and the files with their day.
   */
  public async planning(actor: AuthenticatedStaff, parkingId: string, query: { from?: unknown; days?: unknown }): Promise<FilePlanning> {
    const parking = await this.parkingOf(actor, parkingId);
    const { from, days } = this.parseWindow(query, parking.timezone);
    const today = localDate(new Date(), parking.timezone);
    await this.prepareIfStale(parking.id, parking.timezone, today);
    const { start: windowStart } = dayBounds(from, parking.timezone);
    const { end: windowEnd } = dayBounds(addDays(from, days - 1), parking.timezone);
    const [rows, holding] = await Promise.all([
      prisma.parkingFile.findMany({ where: { parkingId: parking.id }, orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] }),
      prisma.reservation.findMany({
        where: {
          parkingId: parking.id,
          status: { in: HOLDING },
          OR: [{ fileId: { not: null } }, { arrivalAt: { lt: windowEnd }, returnAt: { gt: windowStart } }],
        },
        select: carSelect,
      }),
    ]);
    const localDay = (d: Date) => localDate(d, parking.timezone);
    // Cars blocked in each file (by code): the "unsound" alerts.
    const blockedIn = new Map<string, number>();
    const files: FilePlanningFile[] = this.stacks(rows, holding).map(f => {
      const front = frontCar(f);
      const blocked = blockersIn(f).size;
      blockedIn.set(f.code, blocked);
      return {
        id: f.id,
        code: f.code,
        name: f.name,
        capacity: f.capacity,
        active: f.active,
        plannedDay: f.plannedDay,
        keptByHand: f.keptByHand,
        day: front ? localDay(front.returnAt) : f.plannedDay,
        cars: f.cars.length,
        sound: blocked === 0,
      };
    });
    const capacity = files.filter(f => f.active).reduce((s, f) => s + f.capacity, 0);
    const load: FilePlanningLoad[] = [];
    const alerts: FilePlanningAlert[] = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i);
      const { start, end } = dayBounds(date, parking.timezone);
      const returns = holding.filter(r => r.returnAt >= start && r.returnAt < end);
      const placed = returns.filter(r => r.fileId).length;
      const toCome = returns.length - placed;
      const onSite = holding.filter(r => r.arrivalAt < end && r.returnAt > start).length;
      const serving = files.filter(f => f.cars > 0 && f.day === date);
      const kept = files.filter(f => f.active && f.cars === 0 && f.plannedDay === date);
      // A closed file that still holds cars is listed (the staff sees where they are) but takes no
      // new car (assign answers 400 file_inactive, rankFiles skips it): its free slots are no room.
      const room = [...serving, ...kept].reduce((s, f) => s + (f.active ? Math.max(0, f.capacity - f.cars) : 0), 0);
      const missing = Math.max(0, toCome - room);
      load.push({
        date,
        returns: returns.length,
        placed,
        toCome,
        onSite,
        filesServing: serving.map(f => f.code),
        filesKept: kept.map(f => f.code),
        room,
        missing,
      });
      if (missing > 0) alerts.push({ kind: 'missing_room', date, count: missing });
      if (onSite > capacity) alerts.push({ kind: 'over_capacity', date, count: onSite - capacity });
    }
    for (const f of files) {
      const blocked = blockedIn.get(f.code) ?? 0;
      if (blocked > 0) alerts.push({ kind: 'unsound', fileCode: f.code, count: blocked });
    }
    return { from, days, timezone: parking.timezone, today, capacity, files, load, alerts };
  }

  /**
   * Keeps an empty file for a return day by hand (`day`), or frees it (`null`): the night
   * preparation then leaves it alone until its day has passed. Audited.
   */
  public async keep(actor: AuthenticatedStaff, parkingId: string, fileId: string, day: string | null): Promise<ParkingFile> {
    const parking = await this.parkingOf(actor, parkingId);
    const file = await prisma.parkingFile.findFirst({
      where: { id: fileId, parkingId: parking.id },
      include: { _count: { select: { reservations: { where: { status: { in: HOLDING } } } } } },
    });
    if (!file) throw new HttpException(httpStatus.NOT_FOUND, 'File not found', 'file_not_found');
    if (file._count.reservations > 0) throw new HttpException(httpStatus.CONFLICT, `File ${file.code} holds cars`, 'file_occupied');
    if (day !== null) {
      if (!DATE_RE.test(day) || !parseInstant(`${day}T00:00`, parking.timezone))
        throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid day', 'invalid_day');
      if (day < localDate(new Date(), parking.timezone)) throw new HttpException(httpStatus.BAD_REQUEST, 'The day has passed', 'invalid_day');
      if (!file.active) throw new HttpException(httpStatus.BAD_REQUEST, 'This file is closed', 'file_inactive');
    }
    return prisma.$transaction(async tx => {
      const updated = await tx.parkingFile.update({ where: { id: file.id }, data: { plannedDay: day, keptByHand: day !== null } });
      await this.audit.record(
        actor,
        {
          action: 'parking.file_kept',
          entityType: 'parking',
          entityId: parking.id,
          details: { fileId: file.id, code: file.code, from: file.plannedDay, day },
        },
        tx,
      );
      return updated;
    });
  }

  /** The window of the planning: `from` (a local day, today by default) and `days` (1 to 31, 7 by default). */
  public parseWindow(query: { from?: unknown; days?: unknown }, timezone: string): { from: string; days: number } {
    const invalid = () => new HttpException(httpStatus.BAD_REQUEST, 'Invalid planning window', 'invalid_window');
    let from = localDate(new Date(), timezone);
    if (query.from !== undefined && query.from !== '') {
      if (typeof query.from !== 'string' || !DATE_RE.test(query.from) || !parseInstant(`${query.from}T00:00`, timezone)) throw invalid();
      from = query.from;
    }
    let days = PLANNING_DAYS;
    if (query.days !== undefined && query.days !== '') {
      days = typeof query.days === 'string' && /^\d+$/.test(query.days) ? Number(query.days) : NaN;
      if (!Number.isInteger(days) || days < 1 || days > PLANNING_MAX_DAYS) throw invalid();
    }
    return { from, days };
  }

  /** Today's returns that stand behind a car leaving later, for the dashboard. */
  public async blockedReturns(parkingId: string, start: Date, end: Date) {
    const [rows, holding] = await Promise.all([
      prisma.parkingFile.findMany({ where: { parkingId } }),
      prisma.reservation.findMany({ where: { parkingId, status: { in: HOLDING }, fileId: { not: null } }, select: carSelect }),
    ]);
    const out: { car: StackCar; fileCode: string; blockers: StackCar[] }[] = [];
    for (const f of this.stacks(rows, holding)) {
      const blockers = blockersIn(f);
      for (const car of f.cars) {
        if (car.returnAt < start || car.returnAt >= end) continue;
        const b = blockers.get(car.reservationId);
        if (b?.length) out.push({ car, fileCode: f.code, blockers: b });
      }
    }
    return out;
  }

  private async prepareIfStale(parkingId: string, timezone: string, today: string) {
    const stale = await prisma.parkingFile.findFirst({
      where: { parkingId, OR: [{ plannedAt: null }, { plannedAt: { lt: dayBounds(today, timezone).start } }] },
      select: { id: true },
    });
    if (stale) await this.prepare(parkingId, timezone, today);
  }

  private stacks(rows: ParkingFile[], cars: CarRow[]): (StackFile & { name: string | null; geometry: unknown; keptByHand: boolean })[] {
    return rows.map(f => ({
      id: f.id,
      code: f.code,
      name: f.name,
      geometry: f.geometry,
      capacity: f.capacity,
      active: f.active,
      sortOrder: f.sortOrder,
      plannedDay: f.plannedDay,
      keptByHand: f.keptByHand,
      cars: cars.filter(c => c.fileId === f.id).map(c => this.stackCar(c)),
    }));
  }

  private stackCar(c: CarRow): StackCar {
    return { reservationId: c.id, reference: c.reference, plate: c.plate, customerName: c.customerName, returnAt: c.returnAt, rank: c.fileRank ?? 0 };
  }

  private rowOf(f: FileInputDto, index: number) {
    return {
      code: f.code.toUpperCase(),
      name: f.name?.trim() || null,
      capacity: f.capacity,
      geometry: f.geometry === undefined ? undefined : f.geometry === null ? Prisma.JsonNull : (f.geometry as Prisma.InputJsonValue),
      sortOrder: f.sortOrder ?? index,
      active: f.active ?? true,
    };
  }

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }
}
