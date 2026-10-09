import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { ArrivalKind, ArrivalSignal, ArrivalState, Prisma, ReservationStatus } from '@/database';
import {
  ANNOUNCE_MINUTES,
  ARRIVED_WITHIN_METERS,
  ArrivalEstimator,
  canSignal,
  crossesSoonThreshold,
  currentMoment,
  LatLng,
  POSITION_MAX_AGE_SECONDS,
  POSITION_MIN_INTERVAL_SECONDS,
  SIGNAL_MAX_MINUTES,
  SOON_THRESHOLD_MINUTES,
  START_PUSH_COOLDOWN_MINUTES,
  straightLineEstimate,
} from '@/domain/arrival';
import { arrivalPush, ArrivalPushEvent } from '@/domain/arrival-messages';
import { BookingRecord } from '@/domain/booking-view';
import { canTransition } from '@/domain/reservation';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { POSITION_INTERVAL_TOLERANCE_MS } from '@/domain/shuttle';
import { HttpException } from '@/utils/httpException';
import { AuditService } from './audit.service';
import { READ_GEOCODE_TIMEOUT_MS, ParkingLocationService } from './parking-location.service';
import { PublicBookingService } from './public-booking.service';
import { PushService } from './push.service';

const ACTIVE_STATES: ArrivalState[] = ['sharing', 'announced', 'at_meeting_point'];
/** Fields of the position: all cleared together, whenever a live sharing ends. */
const ERASED_POSITION = { lat: null, lng: null, accuracyM: null, positionRecordedAt: null };
/** A tap twice on "J'arrive dans…" sends one push. */
const ANNOUNCE_PUSH_DEBOUNCE_MS = 2 * 60000;

export type MeetingPointSource = 'parking' | 'return_point' | 'airport';
export interface MeetingPoint extends LatLng {
  source: MeetingPointSource;
  /** Set by the operator for the return point, or the airport's name; null: the client names it. */
  label: string | null;
  /** The operator's written directions and photo (return point only). */
  instructions?: string | null;
  photoUrl?: string | null;
}

export interface ReturnMeetingPointDetails extends LatLng {
  label: string | null;
  instructions: string | null;
  photoUrl: string | null;
}

/** What the traveller sees: never their own position back, only the estimate. */
export interface TravellerSignal {
  kind: ArrivalKind;
  state: ArrivalState;
  endReason: string | null;
  startedAt: string;
  expiresAt: string;
  secondsLeft: number;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  announcedMinutes: number | null;
  atMeetingPointAt: string | null;
  positionUpdatedAt: string | null;
  /** E (06/10/2026): the traveller's word for the parking. */
  note: string | null;
}

export interface TravellerArrival {
  reference: string;
  /** The moment the app offers now (open) or next (with when it opens); null: nothing left. */
  moment: { kind: ArrivalKind; open: boolean; opensAt: string; closesAt: string } | null;
  meetingPoint: MeetingPoint | null;
  signal: TravellerSignal | null;
  rules: { maxMinutes: number; arrivedWithinMeters: number; positionIntervalSeconds: number; announceMinutes: readonly number[] };
}

export interface StaffSignal {
  id: string;
  reservationId: string;
  reference: string;
  kind: ArrivalKind;
  state: ArrivalState;
  customerName: string;
  /** 09/10/2026: the stored first and last name (the banner says « C. Martin »). */
  customerFirstName: string;
  customerLastName: string;
  plate: string;
  passengers: number;
  returnFlight: string | null;
  scheduledAt: string;
  startedAt: string;
  expiresAt: string;
  distanceM: number | null;
  etaMinutes: number | null;
  etaAt: string | null;
  announcedMinutes: number | null;
  atMeetingPointAt: string | null;
  position: { lat: number; lng: number; accuracyM: number | null } | null;
  positionUpdatedAt: string | null;
  positionAgeSeconds: number | null;
  meetingPoint: MeetingPoint | null;
  /** E (06/10/2026): the traveller's word for the parking. */
  note: string | null;
}

type SignalWithReservation = ArrivalSignal & {
  reservation: {
    reference: string;
    customerName: string;
    customerFirstName: string;
    customerLastName: string;
    plate: string;
    passengers: number;
    returnFlight: string | null;
    arrivalAt: Date;
    returnAt: Date;
    parking: { id: string; name: string; address: string | null };
  };
};

const windowClosed = () => new HttpException(httpStatus.CONFLICT, 'This booking cannot signal an arrival now', 'arrival_window_closed');
const notSharing = () => new HttpException(httpStatus.CONFLICT, 'The position is not being shared', 'not_sharing');
const iso = (d: Date | null) => (d ? d.toISOString() : null);
const after = (now: Date, minutes: number) => new Date(now.getTime() + minutes * 60000);

/**
 * "Prévenir de son arrivée": a traveller (manage token, no account) shares their live position
 * with the parking until they arrive, or just announces "dans 10 / 20 / 30 min", or says they are
 * at the meeting point. Staff see it on the planning and get a push. RGPD: one row per booking and
 * moment, only the latest position, erased on stop, on arrival and after 2 h; the audit log never
 * holds coordinates; nothing here is logged.
 */
@Service()
export class ArrivalService {
  public audit = Container.get(AuditService);
  public bookings = Container.get(PublicBookingService);
  public locations = Container.get(ParkingLocationService);
  public push = Container.get(PushService);
  /** Straight line at an average speed; a routing API can replace it. */
  public estimator: ArrivalEstimator = straightLineEstimate;

  // ---------------------------------------------------------------- traveller

  public async state(reference: string, token: string | undefined): Promise<TravellerArrival> {
    const booking = await this.bookings.load(reference, token);
    await this.sweep({ reservationId: booking.id });
    return this.travellerView(booking);
  }

  /** Starts sharing the live position (consent required). Idempotent while sharing. */
  public async start(
    reference: string,
    token: string | undefined,
    kind: ArrivalKind,
    consent: boolean,
    note?: string | null,
  ): Promise<TravellerArrival> {
    if (consent !== true) throw new HttpException(httpStatus.BAD_REQUEST, 'Consent is required to share a position', 'consent_required');
    const booking = await this.openMoment(reference, token, kind);
    const existing = await this.find(booking.id, kind);
    if (existing?.state !== 'sharing') {
      const now = new Date();
      await this.upsert(booking, kind, {
        state: 'sharing',
        note: note?.trim() || null,
        ...ERASED_POSITION,
        positionReceivedAt: null,
        distanceM: null,
        etaMinutes: null,
        etaAt: null,
        announcedMinutes: null,
        atMeetingPointAt: null,
        startedAt: now,
        expiresAt: after(now, SIGNAL_MAX_MINUTES),
        notifiedSoonAt: null,
        notifiedArrivedAt: null,
      });
      await this.record(booking, 'arrival.sharing_started', { kind });
    }
    return this.travellerView(booking);
  }

  /** The latest position of a live sharing: at most one per 10 s; within 150 m it stops by itself. */
  public async position(
    reference: string,
    token: string | undefined,
    position: { lat: number; lng: number; accuracy?: number | null; recordedAt: string },
  ): Promise<TravellerArrival> {
    const booking = await this.bookings.load(reference, token);
    await this.sweep({ reservationId: booking.id });
    const signal = await prisma.arrivalSignal.findFirst({ where: { reservationId: booking.id, state: 'sharing' }, orderBy: { startedAt: 'desc' } });
    if (!signal) throw notSharing();

    const now = new Date();
    const recordedAt = new Date(position.recordedAt);
    if (recordedAt.getTime() > now.getTime() + 60000) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'The position is dated in the future', 'invalid_recorded_at');
    }
    if (now.getTime() - recordedAt.getTime() > POSITION_MAX_AGE_SECONDS * 1000) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'The position is too old', 'position_too_old');
    }
    // Sent out of order (a retried request): the newer position already counts.
    if (signal.positionRecordedAt && recordedAt <= signal.positionRecordedAt) return this.travellerView(booking);

    const meeting = await this.meetingPoint(booking, signal.kind);
    const estimate = meeting ? this.estimator({ lat: position.lat, lng: position.lng }, meeting) : null;
    const arrived = !!estimate && estimate.distanceM <= ARRIVED_WITHIN_METERS;
    const data: Prisma.ArrivalSignalUpdateManyMutationInput = arrived
      ? {
          state: 'at_meeting_point',
          ...ERASED_POSITION,
          positionReceivedAt: now,
          distanceM: estimate.distanceM,
          etaMinutes: 0,
          etaAt: now,
          atMeetingPointAt: now,
        }
      : {
          lat: position.lat,
          lng: position.lng,
          accuracyM: position.accuracy ?? null,
          positionRecordedAt: recordedAt,
          positionReceivedAt: now,
          distanceM: estimate?.distanceM ?? null,
          etaMinutes: estimate?.etaMinutes ?? null,
          etaAt: estimate ? after(now, estimate.etaMinutes) : null,
        };
    // Conditional write: the rate limit holds across server instances and concurrent requests.
    const { count } = await prisma.arrivalSignal.updateMany({
      where: {
        id: signal.id,
        state: 'sharing',
        expiresAt: { gt: now },
        OR: [
          { positionReceivedAt: null },
          { positionReceivedAt: { lte: new Date(now.getTime() - POSITION_MIN_INTERVAL_SECONDS * 1000 + POSITION_INTERVAL_TOLERANCE_MS) } },
        ],
      },
      data,
    });
    if (!count) {
      const current = await prisma.arrivalSignal.findUnique({ where: { id: signal.id } });
      if (current?.state !== 'sharing') throw notSharing();
      const waited = current.positionReceivedAt ? (now.getTime() - current.positionReceivedAt.getTime()) / 1000 : 0;
      throw new HttpException(httpStatus.TOO_MANY_REQUESTS, 'One position every 10 seconds at most', 'too_many_positions', {
        retryAfterSeconds: Math.max(1, Math.ceil(POSITION_MIN_INTERVAL_SECONDS - waited)),
      });
    }

    if (arrived) {
      await this.record(booking, 'arrival.at_meeting_point', { kind: signal.kind, auto: true });
      if (signal.kind === 'return') await this.requestReturn(booking);
      await this.notifyOnce(booking, signal, 'at_meeting_point', 0, meeting);
    } else {
      await this.notifyProgress(booking, signal, estimate?.etaMinutes ?? null, meeting);
    }
    return this.travellerView(booking);
  }

  /** "J'arrive dans 10 / 20 / 30 min", without sharing the position (stops a sharing). */
  public async announce(
    reference: string,
    token: string | undefined,
    kind: ArrivalKind,
    minutes: number,
    note?: string | null,
  ): Promise<TravellerArrival> {
    if (!(ANNOUNCE_MINUTES as readonly number[]).includes(minutes)) {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Announce 10, 20 or 30 minutes', 'invalid_minutes');
    }
    const booking = await this.openMoment(reference, token, kind);
    const now = new Date();
    const signal = await this.upsert(booking, kind, {
      state: 'announced',
      note: note?.trim() || null,
      ...ERASED_POSITION,
      distanceM: null,
      etaMinutes: minutes,
      etaAt: after(now, minutes),
      announcedMinutes: minutes,
      atMeetingPointAt: null,
      startedAt: now,
      expiresAt: after(now, SIGNAL_MAX_MINUTES),
      notifiedSoonAt: minutes <= SOON_THRESHOLD_MINUTES ? now : null,
      notifiedArrivedAt: null,
    });
    await this.record(booking, 'arrival.announced', { kind, minutes });
    const { count } = await prisma.arrivalSignal.updateMany({
      where: { id: signal.id, OR: [{ notifiedStartAt: null }, { notifiedStartAt: { lte: new Date(now.getTime() - ANNOUNCE_PUSH_DEBOUNCE_MS) } }] },
      data: { notifiedStartAt: now },
    });
    if (count) await this.sendPush(booking, signal.kind, 'announced', minutes, await this.meetingPoint(booking, kind), signal.note);
    return this.travellerView(booking);
  }

  /** "Je suis au point de rendez-vous" (optionally with a position, used only for the distance). */
  public async atMeetingPoint(
    reference: string,
    token: string | undefined,
    kind: ArrivalKind,
    position?: { lat: number; lng: number } | null,
    note?: string | null,
  ): Promise<TravellerArrival> {
    const booking = await this.openMoment(reference, token, kind);
    const existing = await this.find(booking.id, kind);
    if (existing?.state === 'at_meeting_point') return this.travellerView(booking);
    const now = new Date();
    const meeting = await this.meetingPoint(booking, kind);
    const distanceM = position && meeting ? this.estimator(position, meeting).distanceM : null;
    const ongoing = existing && existing.state !== 'ended';
    const signal = await this.upsert(booking, kind, {
      state: 'at_meeting_point',
      // A word given now wins; else the one sent with the sharing or the announce stays.
      ...(note?.trim() ? { note: note.trim() } : {}),
      ...ERASED_POSITION,
      distanceM,
      etaMinutes: 0,
      etaAt: now,
      announcedMinutes: null,
      atMeetingPointAt: now,
      startedAt: ongoing ? existing.startedAt : now,
      expiresAt: ongoing ? existing.expiresAt : after(now, SIGNAL_MAX_MINUTES),
      ...(ongoing ? {} : { notifiedSoonAt: null, notifiedArrivedAt: null }),
    });
    await this.record(booking, 'arrival.at_meeting_point', { kind, auto: false });
    if (kind === 'return') await this.requestReturn(booking);
    await this.notifyOnce(booking, signal, 'at_meeting_point', 0, meeting);
    return this.travellerView(booking);
  }

  /** Stops sharing (or cancels an announce): the position is erased at once. */
  public async stop(reference: string, token: string | undefined, kind?: ArrivalKind): Promise<TravellerArrival> {
    const booking = await this.bookings.load(reference, token);
    await this.sweep({ reservationId: booking.id });
    const active = await prisma.arrivalSignal.findMany({
      where: { reservationId: booking.id, state: { in: ACTIVE_STATES }, ...(kind ? { kind } : {}) },
      select: { id: true, kind: true },
    });
    if (active.length) {
      const now = new Date();
      await prisma.arrivalSignal.updateMany({
        where: { id: { in: active.map(s => s.id) } },
        data: { state: 'ended', endReason: 'stopped', endedAt: now, ...ERASED_POSITION, distanceM: null, etaMinutes: null, etaAt: null },
      });
      for (const s of active) await this.record(booking, 'arrival.stopped', { kind: s.kind });
    }
    return this.travellerView(booking);
  }

  // ---------------------------------------------------------------- staff

  /** The operator's live signals (sharing, announced, at the meeting point), freshest first. */
  public async live(actor: AuthenticatedStaff): Promise<{ serverTime: string; signals: StaffSignal[] }> {
    await this.sweep({ operatorId: actor.operatorId });
    const now = new Date();
    const rows = await prisma.arrivalSignal.findMany({
      where: { operatorId: actor.operatorId, state: { in: ACTIVE_STATES }, expiresAt: { gt: now } },
      include: {
        reservation: {
          select: {
            reference: true,
            customerName: true,
            customerFirstName: true,
            customerLastName: true,
            plate: true,
            passengers: true,
            returnFlight: true,
            arrivalAt: true,
            returnAt: true,
            parking: { select: { id: true, name: true, address: true } },
          },
        },
      },
    });
    const signals = await this.staffViews(rows, now);
    const rank = (s: StaffSignal) => (s.state === 'at_meeting_point' ? 0 : s.state === 'sharing' ? 1 : 2);
    signals.sort((a, b) => rank(a) - rank(b) || (a.etaAt ?? a.startedAt).localeCompare(b.etaAt ?? b.startedAt));
    return { serverTime: now.toISOString(), signals };
  }

  /** Adds each row's live signal (arrivals: outbound, returns: return) to the planning. */
  public async attachToPlanning<P extends { arrivals: { id: string }[]; returns: { id: string }[] }>(
    actor: AuthenticatedStaff,
    planning: P,
  ): Promise<P & { arrivals: { arrivalSignal: StaffSignal | null }[]; returns: { arrivalSignal: StaffSignal | null }[] }> {
    const { signals } = await this.live(actor);
    const by = (kind: ArrivalKind, id: string) => signals.find(s => s.kind === kind && s.reservationId === id) ?? null;
    return {
      ...planning,
      arrivals: planning.arrivals.map(r => ({ ...r, arrivalSignal: by('outbound', r.id) })),
      returns: planning.returns.map(r => ({ ...r, arrivalSignal: by('return', r.id) })),
    };
  }

  /** Where the shuttle meets travellers on their return (null clears it: the airport is used). */
  public async setReturnMeetingPoint(
    parkingId: string,
    point: { lat: number; lng: number; label?: string | null; instructions?: string | null; photoUrl?: string | null } | null,
  ) {
    if (point) {
      await prisma.$executeRaw`
        UPDATE parkings SET "returnMeetingPoint" = ST_SetSRID(ST_MakePoint(${point.lng}, ${point.lat}), 4326),
          "returnMeetingLabel" = ${point.label?.trim() || null},
          "returnMeetingInstructions" = ${point.instructions?.trim() || null},
          "returnMeetingPhotoUrl" = ${point.photoUrl?.trim() || null}
        WHERE id = ${parkingId}`;
    } else {
      await prisma.$executeRaw`
        UPDATE parkings SET "returnMeetingPoint" = NULL, "returnMeetingLabel" = NULL, "returnMeetingInstructions" = NULL, "returnMeetingPhotoUrl" = NULL
        WHERE id = ${parkingId}`;
    }
    return this.returnMeetingPoint(parkingId);
  }

  public async returnMeetingPoint(parkingId: string): Promise<ReturnMeetingPointDetails | null> {
    const [row] = await prisma.$queryRaw<
      { lat: number | null; lng: number | null; label: string | null; instructions: string | null; photoUrl: string | null }[]
    >`
      SELECT ST_Y("returnMeetingPoint") AS lat, ST_X("returnMeetingPoint") AS lng, "returnMeetingLabel" AS label,
        "returnMeetingInstructions" AS instructions, "returnMeetingPhotoUrl" AS "photoUrl"
      FROM parkings WHERE id = ${parkingId}`;
    return row && row.lat !== null && row.lng !== null
      ? { lat: Number(row.lat), lng: Number(row.lng), label: row.label, instructions: row.instructions, photoUrl: row.photoUrl }
      : null;
  }

  // ---------------------------------------------------------------- retention

  /**
   * Ends the signals past their 2 hours and those whose booking moved on (vehicle dropped off,
   * handed back, cancelled), erasing their position. Run lazily on every read, and by the cron.
   */
  public async sweep(scope: { reservationId?: string; operatorId?: string } = {}): Promise<number> {
    const now = new Date();
    const where = scope.reservationId
      ? Prisma.sql`AND s."reservationId" = ${scope.reservationId}`
      : scope.operatorId
        ? Prisma.sql`AND s."operatorId" = ${scope.operatorId}`
        : Prisma.empty;
    const ended = await prisma.$queryRaw<{ id: string; operatorId: string; reservationId: string; kind: string; reason: string }[]>`
      UPDATE arrival_signals s SET
        state = 'ended',
        "endReason" = (CASE WHEN s."expiresAt" <= ${now} THEN 'expired' ELSE 'closed' END)::"ArrivalEndReason",
        "endedAt" = ${now}, lat = NULL, lng = NULL, "accuracyM" = NULL, "positionRecordedAt" = NULL,
        "distanceM" = NULL, "etaMinutes" = NULL, "etaAt" = NULL, "updatedAt" = ${now}
      FROM reservations r
      WHERE r.id = s."reservationId" AND s.state <> 'ended' ${where}
        AND (s."expiresAt" <= ${now}
          OR (s.kind = 'outbound' AND r.status <> 'upcoming')
          OR (s.kind = 'return' AND r.status IN ('returned', 'cancelled', 'no_show')))
      RETURNING s.id, s."operatorId", s."reservationId", s.kind::text AS kind, s."endReason"::text AS reason`;
    if (ended.length) {
      await prisma.auditLog.createMany({
        data: ended.map(s => ({
          operatorId: s.operatorId,
          staffId: null,
          action: 'arrival.ended',
          entityType: 'reservation',
          entityId: s.reservationId,
          details: { kind: s.kind, reason: s.reason },
        })),
      });
    }
    return ended.length;
  }

  // ---------------------------------------------------------------- internals

  private async openMoment(reference: string, token: string | undefined, kind: ArrivalKind): Promise<BookingRecord> {
    const booking = await this.bookings.load(reference, token);
    await this.sweep({ reservationId: booking.id });
    if (!canSignal(kind, booking)) throw windowClosed();
    return booking;
  }

  private find(reservationId: string, kind: ArrivalKind) {
    return prisma.arrivalSignal.findUnique({ where: { reservationId_kind: { reservationId, kind } } });
  }

  private upsert(
    booking: BookingRecord,
    kind: ArrivalKind,
    data: Omit<Prisma.ArrivalSignalUncheckedCreateInput, 'reservationId' | 'operatorId' | 'parkingId' | 'kind'>,
  ) {
    const reset = { endReason: null, endedAt: null };
    return prisma.arrivalSignal.upsert({
      where: { reservationId_kind: { reservationId: booking.id, kind } },
      create: { reservationId: booking.id, operatorId: booking.operatorId, parkingId: booking.parkingId, kind, ...data },
      update: { ...reset, ...data },
    });
  }

  private record(booking: BookingRecord, action: string, details: Prisma.InputJsonValue) {
    return this.audit.record({ id: null, operatorId: booking.operatorId }, { action, entityType: 'reservation', entityId: booking.id, details });
  }

  /** On the way back, at the meeting point: the booking waits for the shuttle (return_requested). */
  private async requestReturn(booking: BookingRecord) {
    await prisma.$transaction(async tx => {
      const current = await tx.reservation.findUniqueOrThrow({ where: { id: booking.id }, select: { status: true } });
      const from: ReservationStatus = current.status;
      // Only a traveller whose vehicle is on site waits for the shuttle; a booking already handed back stays so.
      if (!['arrived', 'shuttled_out'].includes(from) || !canTransition(from, 'return_requested')) return;
      const { count } = await tx.reservation.updateMany({ where: { id: booking.id, status: from }, data: { status: 'return_requested' } });
      if (!count) return;
      await this.audit.record(
        { id: null, operatorId: booking.operatorId },
        {
          action: 'reservation.status_changed',
          entityType: 'reservation',
          entityId: booking.id,
          details: { from, to: 'return_requested', by: 'traveller' },
        },
        tx,
      );
    });
  }

  /** First position of a session: "arrive dans N min"; then once when it drops to 10 min. */
  private async notifyProgress(booking: BookingRecord, before: ArrivalSignal, etaMinutes: number | null, meeting: MeetingPoint | null) {
    const now = new Date();
    const cooldown = new Date(now.getTime() - START_PUSH_COOLDOWN_MINUTES * 60000);
    // Not yet sent for this session, and not sent for an earlier one in the last 15 minutes.
    const start = await prisma.arrivalSignal.updateMany({
      where: {
        id: before.id,
        OR: [{ notifiedStartAt: null }, { AND: [{ notifiedStartAt: { lt: before.startedAt } }, { notifiedStartAt: { lte: cooldown } }] }],
      },
      data: { notifiedStartAt: now, ...(etaMinutes !== null && etaMinutes <= SOON_THRESHOLD_MINUTES ? { notifiedSoonAt: now } : {}) },
    });
    if (start.count) {
      await this.sendPush(booking, before.kind, 'started', etaMinutes, meeting, before.note);
      return;
    }
    if (!crossesSoonThreshold(before.etaMinutes, etaMinutes)) return;
    const soon = await prisma.arrivalSignal.updateMany({ where: { id: before.id, notifiedSoonAt: null }, data: { notifiedSoonAt: now } });
    if (soon.count) await this.sendPush(booking, before.kind, 'soon', etaMinutes, meeting, before.note);
  }

  private async notifyOnce(
    booking: BookingRecord,
    signal: ArrivalSignal,
    event: ArrivalPushEvent,
    etaMinutes: number | null,
    meeting: MeetingPoint | null,
  ) {
    const { count } = await prisma.arrivalSignal.updateMany({
      where: { id: signal.id, notifiedArrivedAt: null },
      data: { notifiedArrivedAt: new Date() },
    });
    if (count) await this.sendPush(booking, signal.kind, event, etaMinutes, meeting, signal.note);
  }

  private async sendPush(
    booking: BookingRecord,
    kind: ArrivalKind,
    event: ArrivalPushEvent,
    etaMinutes: number | null,
    meeting: MeetingPoint | null,
    note: string | null = null,
  ) {
    const message = arrivalPush({
      event,
      kind,
      customerName: booking.customerName,
      customerFirstName: booking.customerFirstName,
      customerLastName: booking.customerLastName,
      plate: booking.plate,
      parkingName: booking.parking.name,
      etaMinutes,
      meetingLabel: meeting?.label ?? null,
      note,
    });
    await this.push.notifyStaff(booking.operatorId, kind === 'outbound' ? 'arrivals' : 'returns', message, {
      data: { type: 'arrival', event, kind, reservationId: booking.id },
      collapseId: `arrival-${booking.id}-${kind}`,
    });
  }

  /** Drop-off: the parking's reception. Return: the operator's point, else the airport, else the parking. */
  public async meetingPoint(
    booking: {
      parkingId: string;
      parking: { id: string; address: string | null; listing?: { airport: { name: string; latitude: number; longitude: number } } | null };
    },
    kind: ArrivalKind,
  ): Promise<MeetingPoint | null> {
    if (kind === 'return') {
      const point = await this.returnMeetingPoint(booking.parkingId);
      if (point) return { ...point, source: 'return_point' };
      const airport = booking.parking.listing?.airport;
      if (airport)
        return { lat: airport.latitude, lng: airport.longitude, source: 'airport', label: airport.name, instructions: null, photoUrl: null };
    }
    const parking = await this.locations.locate({ id: booking.parking.id, address: booking.parking.address }, READ_GEOCODE_TIMEOUT_MS);
    return parking ? { ...parking, source: 'parking', label: null } : null;
  }

  private async travellerView(booking: BookingRecord): Promise<TravellerArrival> {
    const now = new Date();
    const fresh = await prisma.reservation.findUniqueOrThrow({ where: { id: booking.id }, select: { status: true } });
    const moment = currentMoment({ ...booking, status: fresh.status }, now);
    const signals = await prisma.arrivalSignal.findMany({ where: { reservationId: booking.id }, orderBy: { updatedAt: 'desc' } });
    const signal = (moment ? signals.find(s => s.kind === moment.kind) : signals.find(s => s.state !== 'ended')) ?? null;
    const kind = moment?.kind ?? signal?.kind;
    return {
      reference: booking.reference,
      moment: moment
        ? { kind: moment.kind, open: moment.open, opensAt: moment.opensAt.toISOString(), closesAt: moment.closesAt.toISOString() }
        : null,
      meetingPoint: kind ? await this.meetingPoint(booking, kind) : null,
      signal: signal
        ? {
            kind: signal.kind,
            state: signal.state,
            endReason: signal.endReason,
            startedAt: signal.startedAt.toISOString(),
            expiresAt: signal.expiresAt.toISOString(),
            secondsLeft: signal.state === 'ended' ? 0 : Math.max(0, Math.floor((signal.expiresAt.getTime() - now.getTime()) / 1000)),
            distanceM: signal.distanceM,
            etaMinutes: signal.etaMinutes,
            etaAt: iso(signal.etaAt),
            announcedMinutes: signal.announcedMinutes,
            atMeetingPointAt: iso(signal.atMeetingPointAt),
            positionUpdatedAt: signal.state === 'sharing' ? iso(signal.positionReceivedAt) : null,
            note: signal.note,
          }
        : null,
      rules: {
        maxMinutes: SIGNAL_MAX_MINUTES,
        arrivedWithinMeters: ARRIVED_WITHIN_METERS,
        positionIntervalSeconds: POSITION_MIN_INTERVAL_SECONDS,
        announceMinutes: ANNOUNCE_MINUTES,
      },
    };
  }

  private async staffViews(rows: SignalWithReservation[], now: Date): Promise<StaffSignal[]> {
    const meetings = new Map<string, Promise<MeetingPoint | null>>();
    const listings = new Map<string, { airport: { name: string; latitude: number; longitude: number } } | null>();
    const parkingIds = [...new Set(rows.map(r => r.parkingId))];
    if (parkingIds.length) {
      const found = await prisma.listing.findMany({ where: { parkingId: { in: parkingIds } }, include: { airport: true } });
      for (const l of found) listings.set(l.parkingId, l);
    }
    const meetingFor = (row: SignalWithReservation) => {
      const key = `${row.parkingId}|${row.kind}`;
      if (!meetings.has(key)) {
        meetings.set(
          key,
          this.meetingPoint(
            { parkingId: row.parkingId, parking: { ...row.reservation.parking, listing: listings.get(row.parkingId) ?? null } },
            row.kind,
          ),
        );
      }
      return meetings.get(key)!;
    };
    return Promise.all(
      rows.map(async row => ({
        id: row.id,
        reservationId: row.reservationId,
        reference: row.reservation.reference,
        kind: row.kind,
        state: row.state,
        customerName: row.reservation.customerName,
        customerFirstName: row.reservation.customerFirstName,
        customerLastName: row.reservation.customerLastName,
        plate: row.reservation.plate,
        passengers: row.reservation.passengers,
        returnFlight: row.reservation.returnFlight,
        scheduledAt: (row.kind === 'outbound' ? row.reservation.arrivalAt : row.reservation.returnAt).toISOString(),
        startedAt: row.startedAt.toISOString(),
        expiresAt: row.expiresAt.toISOString(),
        distanceM: row.distanceM,
        etaMinutes: row.etaMinutes,
        etaAt: iso(row.etaAt),
        announcedMinutes: row.announcedMinutes,
        atMeetingPointAt: iso(row.atMeetingPointAt),
        position: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng, accuracyM: row.accuracyM } : null,
        positionUpdatedAt: row.lat !== null ? iso(row.positionReceivedAt) : null,
        positionAgeSeconds:
          row.lat !== null && row.positionReceivedAt ? Math.max(0, Math.round((now.getTime() - row.positionReceivedAt.getTime()) / 1000)) : null,
        meetingPoint: await meetingFor(row),
        note: row.note,
      })),
    );
  }
}
