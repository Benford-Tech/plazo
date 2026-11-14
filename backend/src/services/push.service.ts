import { Container, Service } from 'typedi';
import { oneSignalSettings, oneSignalTravellerSettings } from '@/config';
import prisma, { Prisma, ReservationChannel } from '@/database';
import { PushMessage } from '@/domain/arrival-messages';
import type { ImportChange } from '@/domain/import-change';
import { bookingCancelledPush, bookingChangedPush, newBookingPush } from '@/domain/reservation-messages';
import { NotificationEvent, channelsOf } from '@/domain/staff-notifications';
import { localDateTime } from '@/domain/time';
import { NOTIFIED_STAFF_SELECT, NotifiedRow, StaffNotificationService } from './staff-notification.service';
import { logger } from '@/utils/logger';

export const ONESIGNAL_NOTIFICATIONS_URL = 'https://api.onesignal.com/notifications?c=push';
/** OneSignal accepts at most this many subscription ids per call. */
const MAX_SUBSCRIPTIONS_PER_CALL = 2000;

/**
 * What a staff member subscribed to: travellers' arrivals, returns, the shuttles' trips (N-A), the platform's messages
 * (E-A), a push per new booking (`bookings` = bookingNotify immediate) or the hourly digest (`bookingDigest` = hourly).
 * 10/10/2026 (relecture): `bookingChanges` = whoever hears of bookings at all (immediate or hourly), for a booking Plazo
 * changed by itself. 13/10/2026: `team` = the managers, always (a request to join the team waits for one of them).
 */
export type PushAudience =
  | 'arrivals'
  | 'returns'
  | 'shuttles'
  | 'platform'
  | 'bookings'
  | 'bookingDigest'
  | 'bookingChanges'
  | 'team'
  // 27/10/2026: the valets (role or today's post) and the managers, for « Course à prendre ».
  | 'valets'
  // 02/11/2026: a mail waiting in the inbox (« Mail à vérifier »), whoever asked for it.
  | 'inbox'
  // 12/11/2026: a traveller wrote to Plazo's WhatsApp number.
  | 'whatsapp';

/** 02/11/2026: the event of « Mes notifications » each audience belongs to (the bell and the browsers follow it). */
const AUDIENCE_EVENT: Record<PushAudience, NotificationEvent> = {
  arrivals: 'arrival',
  returns: 'return',
  shuttles: 'shuttle',
  platform: 'platform',
  bookings: 'booking_new',
  bookingDigest: 'booking_new',
  bookingChanges: 'booking_change',
  team: 'team',
  valets: 'valet',
  inbox: 'inbox',
  whatsapp: 'whatsapp',
};

/** The older audience rule of the phones, on a member already read (`wantsAudience` in SQL). */
function inAudience(s: NotifiedRow, audience: PushAudience): boolean {
  switch (audience) {
    case 'arrivals':
      return s.notifyArrivals;
    case 'returns':
      return s.notifyReturns;
    case 'shuttles':
      return s.notifyShuttles;
    case 'platform':
      return s.notifyPlatform;
    case 'bookings':
      return s.bookingNotify === 'immediate';
    case 'bookingDigest':
      return s.bookingNotify === 'hourly';
    case 'bookingChanges':
      return s.bookingNotify === 'immediate' || s.bookingNotify === 'hourly';
    case 'team':
      return s.role === 'manager';
    case 'valets':
      return s.role === 'valet' || s.role === 'manager' || s.post === 'valet';
    case 'inbox':
    case 'whatsapp':
      return true;
  }
}

/** Travellers reachable by a platform broadcast: a booking not cancelled, whose return is at most a day past. */
const currentTravellers = (now: Date): Prisma.TravellerDeviceWhereInput => ({
  reservation: { status: { notIn: ['cancelled', 'no_show'] }, returnAt: { gte: new Date(now.getTime() - 86400000) } },
});

export interface PushOptions {
  data?: Record<string, string>;
  /** A newer push replaces an older one with the same id on the phone. */
  collapseId?: string;
  /** Opened when the notification is tapped (platform broadcasts). */
  url?: string;
  /** Staff: not notified about their own action (the driver who started the trip). */
  excludeStaffId?: string;
  /** Seconds OneSignal keeps the push for an offline phone (default one hour: an arrival is useless later). */
  ttl?: number;
  /** 02/11/2026: the event of « Mes notifications » when it is not the audience's (a service ordered). */
  event?: NotificationEvent;
  /** The phones only: the hourly digest repeats bookings the bell and the browsers already had one by one. */
  phoneOnly?: boolean;
}

type Settings = { appId: string; restApiKey: string };

const wantsAudience = (audience: PushAudience): Prisma.StaffWhereInput =>
  audience === 'arrivals'
    ? { notifyArrivals: true }
    : audience === 'returns'
      ? { notifyReturns: true }
      : audience === 'shuttles'
        ? { notifyShuttles: true }
        : audience === 'bookings'
          ? { bookingNotify: 'immediate' }
          : audience === 'bookingDigest'
            ? { bookingNotify: 'hourly' }
            : audience === 'bookingChanges'
              ? { bookingNotify: { in: ['immediate', 'hourly'] } }
              : audience === 'team'
                ? { role: 'manager' }
                : audience === 'valets'
                  ? { OR: [{ role: { in: ['valet', 'manager'] } }, { post: 'valet' }] }
                  : audience === 'inbox' || audience === 'whatsapp'
                    ? { id: '__none__' }
                    : { notifyPlatform: true };

/**
 * Push notifications through the OneSignal REST API: to the staff's phones (StaffDevice), and to
 * the travellers' (TravellerDevice, the traveller app). Off (a no-op) unless the OneSignal values
 * are set. A push never fails the action that caused it: errors are caught and logged without the
 * message (it names a traveller).
 */
@Service()
export class PushService {
  public timeoutMs = 5000;
  public bell = Container.get(StaffNotificationService);

  public enabled(): boolean {
    return oneSignalSettings() !== null;
  }

  /** The traveller app's OneSignal (its own, else the staff's). */
  public travellerEnabled(): boolean {
    return oneSignalTravellerSettings() !== null;
  }

  /**
   * "Nouvelle réservation" to the team members on `immediate` (06/10/2026): bookings made on the site or imported, never
   * the one a colleague just typed. Those on `hourly` hear of it in the digest (BookingDigestService).
   */
  public async notifyNewBooking(
    booking: {
      id: string;
      operatorId: string;
      customerName: string;
      customerFirstName?: string | null;
      customerLastName?: string | null;
      plate: string;
      passengers: number;
      channel: ReservationChannel;
      channelDetail: string | null;
      arrivalAt: Date;
      returnAt: Date;
      createdById?: string | null;
    },
    timezone: string,
  ): Promise<number> {
    const arrival = localDateTime(booking.arrivalAt, timezone);
    const returnDay = localDateTime(booking.returnAt, timezone);
    const dayMonth = (local: string) => `${local.slice(8, 10)}/${local.slice(5, 7)}`;
    return this.notifyStaff(
      booking.operatorId,
      'bookings',
      newBookingPush({ ...booking, arrival: `${dayMonth(arrival)} ${arrival.slice(11, 16)}`, returnDay: dayMonth(returnDay) }),
      {
        excludeStaffId: booking.createdById ?? undefined,
        data: { type: 'booking', event: 'created', reservationId: booking.id },
        collapseId: `booking-${booking.id}`,
      },
    );
  }

  /**
   * 10/10/2026 (« C'est une modification »): « Réservation modifiée · Allopark » when Plazo applies a comparator's change
   * of a booking by itself (the reference and what changed). 10/10/2026 (relecture): to the team members on `immediate`
   * and on `hourly` alike (a manager's default): the hourly digest only counts the bookings received, and nobody would
   * hear that Plazo changed one; never to those on `never`.
   */
  public async notifyBookingChanged(
    booking: {
      id: string;
      operatorId: string;
      reference: string;
      externalReference: string | null;
      channel: ReservationChannel;
      channelDetail: string | null;
    },
    changes: ImportChange[],
  ): Promise<number> {
    return this.notifyStaff(
      booking.operatorId,
      'bookingChanges',
      bookingChangedPush({
        reference: booking.externalReference ?? booking.reference,
        channel: booking.channel,
        channelDetail: booking.channelDetail,
        changes,
      }),
      { data: { type: 'booking', event: 'changed', reservationId: booking.id }, collapseId: `booking-changed-${booking.id}` },
    );
  }

  /** 21/10/2026: the team hears that Plazo cancelled a booking on its comparator's notice (same audience as a change). */
  public async notifyBookingCancelled(
    booking: {
      id: string;
      operatorId: string;
      reference: string;
      externalReference: string | null;
      channel: ReservationChannel;
      channelDetail: string | null;
    },
    arrival: string,
  ): Promise<number> {
    return this.notifyStaff(
      booking.operatorId,
      'bookingChanges',
      bookingCancelledPush({
        reference: booking.externalReference ?? booking.reference,
        channel: booking.channel,
        channelDetail: booking.channelDetail,
        arrival,
      }),
      { data: { type: 'booking', event: 'cancelled', reservationId: booking.id }, collapseId: `booking-changed-${booking.id}` },
    );
  }

  /** Subscription ids of the operator's active staff who want this kind of notification. */
  public async subscriptionsFor(operatorId: string, audience: PushAudience, excludeStaffId?: string): Promise<string[]> {
    const devices = await prisma.staffDevice.findMany({
      where: { staff: { operatorId, isActive: true, ...wantsAudience(audience), ...(excludeStaffId ? { id: { not: excludeStaffId } } : {}) } },
      select: { subscriptionId: true },
    });
    return devices.map(d => d.subscriptionId);
  }

  // ---------------------------------------------------------------- platform broadcasts (E-A)

  /** Phones of the active staff of every active operator (or of one operator) who accept the platform's messages. */
  public async staffBroadcastIds(operatorId?: string): Promise<string[]> {
    const devices = await prisma.staffDevice.findMany({
      where: { staff: { isActive: true, notifyPlatform: true, operator: { status: 'active', ...(operatorId ? { id: operatorId } : {}) } } },
      select: { subscriptionId: true },
    });
    return devices.map(d => d.subscriptionId);
  }

  /** Phones of the travellers with a current booking (the traveller app). */
  public async travellerBroadcastIds(now = new Date()): Promise<string[]> {
    const devices = await prisma.travellerDevice.findMany({ where: currentTravellers(now), select: { subscriptionId: true } });
    return devices.map(d => d.subscriptionId);
  }

  /** Sends to the given staff phones; returns how many got it (0 without OneSignal). */
  public async broadcastStaff(ids: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalSettings();
    if (!settings) return 0;
    try {
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] staff broadcast failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** Sends to the given traveller phones; returns how many got it (0 without OneSignal). */
  public async broadcastTravellers(ids: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalTravellerSettings();
    if (!settings) return 0;
    try {
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] traveller broadcast failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /**
   * Sends a notification to the operator's staff: their phones (OneSignal, the older audiences), and since 02/11/2026
   * the bell and their browsers, each by « Mes notifications ». Returns the number of phones reached (0 without
   * OneSignal: the bell and the browsers still get it).
   */
  public async notifyStaff(operatorId: string, audience: PushAudience, message: PushMessage, options: PushOptions = {}): Promise<number> {
    const event = options.event ?? AUDIENCE_EVENT[audience];
    let staff: (NotifiedRow & { devices: { subscriptionId: string }[] })[];
    try {
      staff = await prisma.staff.findMany({
        where: { operatorId, isActive: true, ...(options.excludeStaffId ? { id: { not: options.excludeStaffId } } : {}) },
        select: { ...NOTIFIED_STAFF_SELECT, devices: { select: { subscriptionId: true } } },
      });
    } catch (error) {
      logger.warn(`[Push] could not read the team of operator ${operatorId}: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
    if (!options.phoneOnly) {
      await this.bell.deliver(
        operatorId,
        event,
        message,
        { bell: this.bell.pick(staff, event, 'bell'), browser: this.bell.pick(staff, event, 'browser') },
        options.data,
      );
    }
    const settings = oneSignalSettings();
    if (!settings) return 0;
    try {
      const ids = staff.filter(s => inAudience(s, audience) && channelsOf(s, event).phone).flatMap(s => s.devices.map(d => d.subscriptionId));
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] could not notify operator ${operatorId}: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** 02/11/2026: a platform message in the bell (and the browsers) of every active staff member who wants it. */
  public async bellPlatform(message: PushMessage, operatorId?: string | null): Promise<void> {
    try {
      const staff = await prisma.staff.findMany({
        where: { isActive: true, operator: { status: 'active', ...(operatorId ? { id: operatorId } : {}) } },
        select: { ...NOTIFIED_STAFF_SELECT, operatorId: true },
      });
      const byOperator = new Map<string, NotifiedRow[]>();
      for (const s of staff) byOperator.set(s.operatorId, [...(byOperator.get(s.operatorId) ?? []), s]);
      for (const [id, members] of byOperator) {
        await this.bell.deliver(
          id,
          'platform',
          message,
          { bell: this.bell.pick(members, 'platform', 'bell'), browser: this.bell.pick(members, 'platform', 'browser') },
          { type: 'platform' },
        );
      }
    } catch (error) {
      logger.warn(`[Bell] platform message not recorded: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  /** 02/11/2026: « M'envoyer une notification de test » to every phone of this member (0 without OneSignal). */
  public async testPhones(staffId: string, message: PushMessage): Promise<number> {
    const settings = oneSignalSettings();
    if (!settings) return 0;
    const devices = await prisma.staffDevice.findMany({ where: { staffId }, select: { subscriptionId: true } });
    const ids = devices.map(d => d.subscriptionId);
    try {
      await this.sendAll(settings, ids, message, { data: { type: 'test' }, ttl: 600 });
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] test push failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  /** Sends a push to the phones registered on these bookings (the traveller app). Returns the number of recipients. */
  public async notifyTravellers(reservationIds: string[], message: PushMessage, options: PushOptions = {}): Promise<number> {
    const settings = oneSignalTravellerSettings();
    if (!settings || !reservationIds.length) return 0;
    try {
      const devices = await prisma.travellerDevice.findMany({ where: { reservationId: { in: reservationIds } }, select: { subscriptionId: true } });
      const ids = devices.map(d => d.subscriptionId);
      await this.sendAll(settings, ids, message, options);
      return ids.length;
    } catch (error) {
      logger.warn(`[Push] could not notify travellers: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 0;
    }
  }

  private async sendAll(settings: Settings, ids: string[], message: PushMessage, options: PushOptions) {
    for (let i = 0; i < ids.length; i += MAX_SUBSCRIPTIONS_PER_CALL) {
      await this.send(settings, ids.slice(i, i + MAX_SUBSCRIPTIONS_PER_CALL), message, options);
    }
  }

  private async send(settings: Settings, subscriptionIds: string[], message: PushMessage, options: PushOptions) {
    if (!subscriptionIds.length) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(ONESIGNAL_NOTIFICATIONS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Key ${settings.restApiKey}` },
        body: JSON.stringify({
          app_id: settings.appId,
          target_channel: 'push',
          include_subscription_ids: subscriptionIds,
          // OneSignal requires an English entry: the apps are French only.
          headings: { en: message.title, fr: message.title },
          contents: { en: message.body, fr: message.body },
          data: options.data ?? {},
          ...(options.url ? { url: options.url } : {}),
          ...(options.collapseId ? { collapse_id: options.collapseId } : {}),
          // An arrival or shuttle push is useless an hour later; a digest asks for longer.
          ttl: options.ttl ?? 3600,
          priority: 10,
        }),
        signal: controller.signal,
      });
      if (!res.ok) logger.warn(`[Push] OneSignal answered ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
