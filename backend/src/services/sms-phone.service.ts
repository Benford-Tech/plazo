import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { OperatorSmsSettings } from '@/database';
import { DEFAULT_SEND_TIME } from '@/domain/day-before-sms';
import { can } from '@/domain/roles';
import {
  daySegments,
  failureEvents,
  offlineAlert,
  PHONE_CHECK_MIN_GAP_MS,
  PHONE_CHECKS_KEPT_DAYS,
  PHONE_HISTORY_DAYS,
  PHONE_PING_SECONDS,
  PHONE_SEND_INTERVAL_MAX_SECONDS,
  PHONE_SEND_INTERVAL_MIN_SECONDS,
  PhoneCheck,
  PhoneEvent,
  PhoneState,
  phoneStateOf,
  RibbonSegment,
  stateChanges,
} from '@/domain/sms-phone';
import { addDays, dayBounds, localDate, localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { PushService } from './push.service';
import { GatewayError, SmsGatewayClient } from './sms-gateway.service';
import { SmsService, SMS_RETRY_WINDOW_MS } from './sms.service';

/** Where the phone stands now: the last check, if recent enough to be told. */
export interface PhoneNow {
  state: PhoneState;
  /** Local "YYYY-MM-DDTHH:mm" of the parking. */
  lastSeenAt: string | null;
  checkedAt: string;
}

export interface PhoneHistoryView {
  now: PhoneNow | null;
  alerts: boolean;
  /** Whether Plazo has set the app's ping (an idle phone is then seen). */
  pingSet: boolean;
  days: {
    date: string;
    segments: RibbonSegment[];
    /** SMS that did not leave, sent that day. */
    failed: number;
    /** Local "HH:mm" of that evening's day-before SMS, null when none was due. */
    reminderAt: string | null;
  }[];
  /** Newest first. */
  events: (
    | { kind: 'state'; at: string; state: PhoneState; lastSeenAt: string | null; afterMinutes: number | null }
    | { kind: 'sms_failed'; at: string; smsKind: string; status: 'failed' | 'abandoned'; count: number }
  )[];
}

/** A check older than this is not « now » any more (two missed crons). */
const NOW_MAX_AGE_MS = 40 * 60 * 1000;
const MAX_EVENTS = 40;

/**
 * The parking's SMS phone (06/11/2026, « ajoute un historique d'état du téléphone de service »): checked every 15 minutes
 * by remind-tomorrow, kept 30 days, shown as a 7-day ribbon in Parking › Réglages, and the managers are told once per
 * outage. Logs carry ids and codes only.
 */
@Service()
export class SmsPhoneService {
  public gateway = Container.get(SmsGatewayClient);
  public sms = Container.get(SmsService);
  public push = Container.get(PushService);
  public audit = Container.get(AuditService);

  /** Every gateway phone of an active operator (the crons). Never throws. */
  public async checkAll(now = new Date()): Promise<{ checked: number; offline: number; alerted: number }> {
    const result = { checked: 0, offline: 0, alerted: 0 };
    const rows = await prisma.operatorSmsSettings.findMany({
      where: {
        mode: 'gateway',
        gatewayLogin: { not: null },
        OR: [{ phoneCheckedAt: null }, { phoneCheckedAt: { lt: new Date(now.getTime() - PHONE_CHECK_MIN_GAP_MS) } }],
        operator: { status: 'active', archivedAt: null, prospectDemo: false },
      },
    });
    for (const settings of rows) {
      try {
        const outcome = await this.check(settings, now);
        if (!outcome) continue;
        result.checked += 1;
        if (outcome.state === 'offline') result.offline += 1;
        if (outcome.alerted) result.alerted += 1;
      } catch (error) {
        logger.warn(`[SMS phone] check failed for operator ${settings.operatorId}: ${error instanceof Error ? error.name : 'unknown error'}`);
      }
    }
    return result;
  }

  /** One phone: asks the app's server, records the answer, alerts once when it stops answering. Null: taken by another run. */
  public async check(settings: OperatorSmsSettings, now = new Date()): Promise<{ state: PhoneState; alerted: boolean } | null> {
    // The claim: two overlapping crons check once.
    const { count } = await prisma.operatorSmsSettings.updateMany({
      where: { id: settings.id, phoneCheckedAt: settings.phoneCheckedAt },
      data: { phoneCheckedAt: now },
    });
    if (!count) return null;
    let state: PhoneState = 'unknown';
    let lastSeenAt: Date | null = null;
    let errorCode: string | null = null;
    try {
      const credentials = this.sms.credentials(settings);
      const devices = await this.gateway.devices(credentials);
      const seen = devices.map(d => d.lastSeen).filter((d): d is Date => !!d);
      lastSeenAt = seen.length ? new Date(Math.max(...seen.map(d => d.getTime()))) : null;
      state = devices.length ? phoneStateOf(lastSeenAt, now) : 'offline';
      if (!settings.phonePingSetAt) await this.ensurePing(settings, credentials, now);
      if (!settings.phoneSpacingSetAt) await this.ensureSpacing(settings, credentials, now);
    } catch (error) {
      errorCode = error instanceof GatewayError ? error.code : error instanceof HttpException && error.code ? error.code : 'sms_gateway_error';
    }
    await prisma.smsPhoneCheck.create({ data: { operatorId: settings.operatorId, checkedAt: now, state, lastSeenAt, errorCode } });

    let alerted = false;
    if (state === 'online' && settings.phoneOfflineAlertedAt) {
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { phoneOfflineAlertedAt: null } });
    } else if (state === 'offline' && settings.phoneAlerts && !settings.phoneOfflineAlertedAt) {
      // Marked first: a failing push is not retried every 15 minutes.
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { phoneOfflineAlertedAt: now } });
      const parking = await this.primaryParking(settings.operatorId);
      const tz = parking?.timezone ?? 'Europe/Paris';
      const reminderAt = parking ? await this.reminderSoon(parking.id, tz, now) : null;
      const message = offlineAlert({ lastSeenAt, reminderAt, tz });
      await this.push.notifyStaff(settings.operatorId, 'team', message, {
        data: { type: 'sms_phone' },
        collapseId: `sms-phone-${settings.operatorId}`,
        ttl: 4 * 3600,
      });
      alerted = true;
    }
    return { state, alerted };
  }

  /** Asks the app to ping every 5 minutes when it pings less often (once per linked login). */
  private async ensurePing(settings: OperatorSmsSettings, credentials: ReturnType<SmsService['credentials']>, now: Date) {
    try {
      const interval = await this.gateway.pingInterval(credentials);
      if (interval === null || interval > PHONE_PING_SECONDS) await this.gateway.setPingInterval(credentials, PHONE_PING_SECONDS);
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { phonePingSetAt: now } });
    } catch (error) {
      logger.warn(`[SMS phone] ping not set for operator ${settings.operatorId}: ${error instanceof Error ? error.name : 'unknown error'}`);
    }
  }

  /** Asks the app to wait 30 to 60 s between two SMS when it waits less (once per linked login). */
  private async ensureSpacing(settings: OperatorSmsSettings, credentials: ReturnType<SmsService['credentials']>, now: Date) {
    try {
      const current = await this.gateway.sendInterval(credentials);
      if ((current.min ?? 0) < PHONE_SEND_INTERVAL_MIN_SECONDS || (current.max ?? 0) < PHONE_SEND_INTERVAL_MAX_SECONDS) {
        const min = Math.max(current.min ?? 0, PHONE_SEND_INTERVAL_MIN_SECONDS);
        await this.gateway.setSendInterval(credentials, min, Math.max(current.max ?? 0, PHONE_SEND_INTERVAL_MAX_SECONDS, min));
      }
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { phoneSpacingSetAt: now } });
    } catch (error) {
      logger.warn(`[SMS phone] spacing not set for operator ${settings.operatorId}: ${error instanceof Error ? error.name : 'unknown error'}`);
    }
  }

  /** Tonight's day-before SMS time, when it is due in the next 6 hours (the alert names it). */
  private async reminderSoon(parkingId: string, tz: string, now: Date): Promise<string | null> {
    const today = localDate(now, tz);
    const [usual, evening] = await Promise.all([
      prisma.reminderSettings.findUnique({ where: { parkingId } }),
      prisma.reminderEvening.findUnique({ where: { parkingId_date: { parkingId, date: today } } }),
    ]);
    if (usual && !usual.enabled) return null;
    if (evening?.paused) return null;
    const time = evening?.sendTime ?? usual?.sendTime ?? DEFAULT_SEND_TIME;
    const nowTime = localDateTime(now, tz).slice(11, 16);
    if (time <= nowTime) return null;
    const [h, m] = time.split(':').map(Number);
    const [nh, nm] = nowTime.split(':').map(Number);
    return h * 60 + m - (nh * 60 + nm) <= 6 * 60 ? time : null;
  }

  private primaryParking(operatorId: string) {
    return prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' }, select: { id: true, timezone: true } });
  }

  /** The last check, if recent: for the card and the « SMS de la veille » page. */
  public async now(operatorId: string, tz: string, now = new Date()): Promise<PhoneNow | null> {
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId }, select: { mode: true } });
    if (settings?.mode !== 'gateway') return null;
    const last = await prisma.smsPhoneCheck.findFirst({ where: { operatorId }, orderBy: { checkedAt: 'desc' } });
    if (!last || now.getTime() - last.checkedAt.getTime() > NOW_MAX_AGE_MS) return null;
    return {
      state: last.state as PhoneState,
      lastSeenAt: last.lastSeenAt ? localDateTime(last.lastSeenAt, tz) : null,
      checkedAt: localDateTime(last.checkedAt, tz),
    };
  }

  /** GET /internal/sms/phone: the 7-day ribbon and the changes. */
  public async history(actor: AuthenticatedStaff, now = new Date()): Promise<PhoneHistoryView> {
    if (!can(actor.role, 'parking:manage')) throw new HttpException(httpStatus.FORBIDDEN, 'Forbidden', 'forbidden');
    const parking = await this.primaryParking(actor.operatorId);
    const tz = parking?.timezone ?? 'Europe/Paris';
    const today = localDate(now, tz);
    const dates = Array.from({ length: PHONE_HISTORY_DAYS }, (_, i) => addDays(today, -i));
    const from = dayBounds(dates[dates.length - 1], tz).start;
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });

    const [rows, failedRows, usual, evenings] = await Promise.all([
      prisma.smsPhoneCheck.findMany({
        where: { operatorId: actor.operatorId, checkedAt: { gte: new Date(from.getTime() - 3600_000) } },
        orderBy: { checkedAt: 'asc' },
      }),
      prisma.smsOutbox.findMany({
        where: {
          operatorId: actor.operatorId,
          provider: 'gateway',
          createdAt: { gte: from },
          OR: [{ status: 'abandoned' }, { status: 'failed', createdAt: { lt: new Date(now.getTime() - SMS_RETRY_WINDOW_MS) } }],
        },
        select: { kind: true, status: true, createdAt: true, updatedAt: true },
      }),
      parking ? prisma.reminderSettings.findUnique({ where: { parkingId: parking.id } }) : null,
      parking ? prisma.reminderEvening.findMany({ where: { parkingId: parking.id, date: { in: dates } } }) : [],
    ]);
    const checks: PhoneCheck[] = rows.map(r => ({ checkedAt: r.checkedAt, state: r.state as PhoneState, lastSeenAt: r.lastSeenAt }));
    const failed = failedRows.map(r => ({ ...r, status: r.status as 'failed' | 'abandoned' }));
    const eveningOf = new Map(evenings.map(e => [e.date, e]));
    const remindersOn = !usual || usual.enabled;

    const days = dates.map(date => {
      const { start, end } = dayBounds(date, tz);
      const evening = eveningOf.get(date);
      return {
        date,
        segments: daySegments(checks, date, tz, now),
        failed: failed.filter(f => f.createdAt >= start && f.createdAt < end).length,
        reminderAt: remindersOn && !evening?.paused ? (evening?.sendTime ?? usual?.sendTime ?? DEFAULT_SEND_TIME) : null,
      };
    });
    const events: PhoneEvent[] = [...stateChanges(checks).filter(e => e.at >= from), ...failureEvents(failed)];
    events.sort((a, b) => b.at.getTime() - a.at.getTime());
    return {
      now: await this.now(actor.operatorId, tz, now),
      alerts: settings?.phoneAlerts ?? true,
      pingSet: !!settings?.phonePingSetAt,
      days,
      events: events.slice(0, MAX_EVENTS).map(e =>
        e.kind === 'state'
          ? {
              kind: 'state' as const,
              at: localDateTime(e.at, tz),
              state: e.state,
              lastSeenAt: e.lastSeenAt ? localDateTime(e.lastSeenAt, tz) : null,
              afterMinutes: e.afterMs === null ? null : Math.round(e.afterMs / 60000),
            }
          : { kind: 'sms_failed' as const, at: localDateTime(e.at, tz), smsKind: e.smsKind, status: e.status, count: e.count },
      ),
    };
  }

  /** PUT /internal/sms/phone/alerts: the managers' alert on or off. */
  public async setAlerts(actor: AuthenticatedStaff, enabled: boolean): Promise<{ alerts: boolean }> {
    if (!can(actor.role, 'parking:manage')) throw new HttpException(httpStatus.FORBIDDEN, 'Forbidden', 'forbidden');
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });
    if (!settings || settings.mode !== 'gateway') throw new HttpException(httpStatus.CONFLICT, 'SMS phone not linked', 'sms_not_configured');
    await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { phoneAlerts: enabled } });
    await this.audit.record(actor, { action: 'sms.phone_alerts', entityType: 'operator', entityId: actor.operatorId, details: { enabled } });
    return { alerts: enabled };
  }

  /** Nightly: checks older than 30 days. */
  public async purge(now = new Date()): Promise<number> {
    const { count } = await prisma.smsPhoneCheck.deleteMany({
      where: { checkedAt: { lt: new Date(now.getTime() - PHONE_CHECKS_KEPT_DAYS * 86400000) } },
    });
    return count;
  }
}
