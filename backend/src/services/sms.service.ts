import { createHash } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PRODUCT_NAME, SECRET_KEY, SMS_DAILY_LIMIT, smsGatewayEncryptionKey } from '@/config';
import prisma, { OperatorSmsSettings, SmsMode, SmsOutbox } from '@/database';
import { manageToken } from '@/domain/booking';
import { confirmationSms, reminderSms } from '@/domain/booking-messages';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { smsRecipient } from '@/domain/phone';
import { landedSms } from '@/domain/return-messages';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { decryptSecret, encryptSecret, SecretBoxError } from '@/utils/secret-box';
import { AuditService } from './audit.service';
import { NotificationService } from './notification.service';
import { GatewayCredentials, GatewayError, GatewayState, SMS_GATEWAY_CLOUD_URL, SmsGatewayClient } from './sms-gateway.service';

/** An SMS is retried (and kept waiting at the gateway) for this long, then abandoned. */
export const SMS_RETRY_WINDOW_MS = 2 * 60 * 60 * 1000;
/** A queued SMS older than this means the phone is not picking them up: the planning warns. */
export const SMS_STALE_AFTER_MS = 10 * 60 * 1000;
/** Outbox rows (recipient number, no text) are purged after this many days. */
export const SMS_OUTBOX_RETENTION_DAYS = 30;
/** The queue of an operator is checked at the gateway at most this often when read lazily. */
const QUEUE_CHECK_EVERY_MS = 60 * 1000;
/** Gateway calls per queue refresh (one serverless invocation). */
const MAX_GATEWAY_CALLS_PER_RUN = 25;
const MAX_ATTEMPTS = 6;

export const SMS_KINDS = ['booking_confirmed', 'booking_reminder', 'flight_landed', 'test'] as const;
export type SmsKind = (typeof SMS_KINDS)[number];

export interface TravellerSms {
  reservationId: string | null;
  kind: SmsKind;
  /** The traveller's number as typed; only French mobiles get an SMS (see domain/phone.ts). */
  to: string;
  text: string;
}

export type SendOutcome = 'sent' | 'queued' | 'failed' | 'skipped';

export interface SmsSettingsView {
  mode: SmsMode;
  /** The "Plazo envoie pour moi" channel exists only while Brevo is configured server-side. */
  brevoAvailable: boolean;
  gateway: { baseUrl: string | null; login: string; senderPhone: string | null; linkedAt: string | null } | null;
}

export interface SmsStatusView {
  mode: SmsMode;
  brevoAvailable: boolean;
  linkedAt: string | null;
  lastSentAt: string | null;
  senderPhone: string | null;
  month: { sent: number; failed: number };
  /** SMS handed to the phone and not sent yet (or waiting for a retry). */
  pending: number;
  /** A pending SMS older than 10 minutes: the phone is off or offline. */
  pendingStale: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
}

export interface UpdateSmsSettingsInput {
  mode: SmsMode;
  login?: string;
  password?: string;
  senderPhone?: string;
  baseUrl?: string | null;
}

const monthKeyOf = (date: Date) => date.toISOString().slice(0, 7);
const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * The SMS to travellers, routed per operator: their own Android phone ("SMS Gateway for Android",
 * free), Brevo through the platform, or none. Gateway sends go through sms_outbox (no text, only
 * its hash) and are retried for 2 hours when the phone is offline. Logs carry ids and codes only.
 */
@Service()
export class SmsService {
  public gateway = Container.get(SmsGatewayClient);
  public notifications = Container.get(NotificationService);
  public audit = Container.get(AuditService);

  // ---- Routing ------------------------------------------------------------------------------------

  /** Every SMS to a traveller goes through here. Never throws: a notification never fails the action. */
  public async sendTravellerSms(operatorId: string, sms: TravellerSms): Promise<SendOutcome> {
    const about = sms.reservationId ? `reservation ${sms.reservationId}` : `operator ${operatorId}`;
    try {
      const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId } });
      const mode = settings?.mode ?? 'none';
      if (mode === 'none') {
        logger.info(`[SMS] No SMS channel for operator ${operatorId}: ${sms.kind} not sent for ${about}`);
        return 'skipped';
      }
      const recipient = smsRecipient(sms.to);
      if (!recipient) {
        logger.info(`[SMS] No mobile number: ${sms.kind} not sent for ${about}`);
        return 'skipped';
      }
      if (mode === 'brevo') return this.sendViaBrevo(operatorId, sms, recipient, about);
      const row = await prisma.smsOutbox.create({
        data: { operatorId, reservationId: sms.reservationId, kind: sms.kind, to: recipient, bodyHash: hash(sms.text), provider: 'gateway' },
      });
      return this.attemptGateway(settings!, row, sms.text);
    } catch (error) {
      logger.error(`[SMS] ${sms.kind} failed for ${about}: ${error instanceof Error ? error.name : 'unknown error'}`);
      return 'failed';
    }
  }

  private async sendViaBrevo(operatorId: string, sms: TravellerSms, recipient: string, about: string): Promise<SendOutcome> {
    if ((sms.kind === 'booking_confirmed' || sms.kind === 'booking_reminder') && !(await this.brevoBudgetLeft(about))) return 'skipped';
    const ok = await this.notifications.smsViaBrevo(recipient, sms.kind, about, sms.text);
    await prisma.smsOutbox.create({
      data: {
        operatorId,
        reservationId: sms.reservationId,
        kind: sms.kind,
        to: recipient,
        bodyHash: hash(sms.text),
        provider: 'brevo',
        status: ok ? 'sent' : 'failed',
        attempts: 1,
        lastError: ok ? null : 'brevo_failed',
      },
    });
    await this.bumpMonth(
      operatorId,
      ok ? 'monthSent' : 'monthFailed',
      ok ? { lastSentAt: new Date() } : { lastError: 'brevo_failed', lastErrorAt: new Date() },
    );
    return ok ? 'sent' : 'failed';
  }

  /** Confirmation SMS through Brevo per rolling 24 hours at most (bookings are free to make: a cap on the bill). */
  private async brevoBudgetLeft(about: string): Promise<boolean> {
    const today = await prisma.smsOutbox.count({
      where: { provider: 'brevo', kind: { in: ['booking_confirmed', 'booking_reminder'] }, createdAt: { gt: new Date(Date.now() - 86400000) } },
    });
    if (today < SMS_DAILY_LIMIT) return true;
    logger.warn(`[SMS] Daily Brevo SMS budget (${SMS_DAILY_LIMIT}) reached: booking_confirmed not sent for ${about}`);
    return false;
  }

  // ---- Gateway sends and retries ------------------------------------------------------------------

  private credentials(settings: OperatorSmsSettings): GatewayCredentials {
    if (!settings.gatewayLogin || !settings.gatewayPasswordEncrypted)
      throw new HttpException(httpStatus.CONFLICT, 'SMS not configured', 'sms_not_configured');
    try {
      return {
        baseUrl: settings.gatewayBaseUrl,
        login: settings.gatewayLogin,
        password: decryptSecret(settings.gatewayPasswordEncrypted, smsGatewayEncryptionKey()),
      };
    } catch (error) {
      const code = error instanceof SecretBoxError && error.code === 'key_missing' ? 'sms_encryption_key_missing' : 'sms_password_unreadable';
      throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'SMS gateway password cannot be read', code);
    }
  }

  /** One POST to the gateway for an outbox row. Updates the row and the operator's counters; returns the outcome. */
  private async attemptGateway(settings: OperatorSmsSettings, row: SmsOutbox, text: string): Promise<SendOutcome> {
    const ttl = Math.max(5, Math.floor((row.createdAt.getTime() + SMS_RETRY_WINDOW_MS - Date.now()) / 1000));
    try {
      const credentials = this.credentials(settings);
      const message = await this.gateway.send(credentials, row.to, text, ttl);
      const sentNow = message.state === 'Sent' || message.state === 'Delivered';
      await prisma.smsOutbox.update({
        where: { id: row.id },
        data: {
          providerMessageId: message.id,
          attempts: { increment: 1 },
          status: sentNow ? this.statusOf(message.state) : 'queued',
          lastError: null,
        },
      });
      if (sentNow) await this.bumpMonth(settings.operatorId, 'monthSent', { lastSentAt: new Date(), lastError: null, lastErrorAt: null });
      else await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { lastError: null, lastErrorAt: null } });
      logger.info(`[SMS] ${row.kind} handed to the gateway for outbox ${row.id} (${message.state})`);
      return sentNow ? 'sent' : 'queued';
    } catch (error) {
      const code = error instanceof GatewayError ? error.code : error instanceof HttpException && error.code ? error.code : 'sms_gateway_error';
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { attempts: { increment: 1 }, status: 'failed', lastError: code } });
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { lastError: code, lastErrorAt: new Date() } });
      logger.warn(`[SMS] ${row.kind} failed at the gateway for outbox ${row.id}: ${code}`);
      return 'failed';
    }
  }

  private statusOf(state: GatewayState): SmsOutbox['status'] {
    if (state === 'Delivered') return 'delivered';
    if (state === 'Sent') return 'sent';
    if (state === 'Failed' || state === 'Cancelled' || state === 'Cancelling') return 'failed';
    return 'queued';
  }

  /**
   * Checks the operator's waiting SMS at the gateway and retries the failed ones (the text is
   * rebuilt from the booking: it is never stored). Throttled to once a minute unless forced.
   */
  public async refreshQueue(operatorId: string, options: { force?: boolean } = {}): Promise<{ checked: number; sent: number; abandoned: number }> {
    const result = { checked: 0, sent: 0, abandoned: 0 };
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId } });
    const now = new Date();
    if (!options.force && settings?.queueCheckedAt && now.getTime() - settings.queueCheckedAt.getTime() < QUEUE_CHECK_EVERY_MS) return result;
    if (settings) await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { queueCheckedAt: now } });

    // Too old: abandoned, whatever their state (the gateway's TTL drops them too).
    const tooOld = await prisma.smsOutbox.findMany({
      where: {
        operatorId,
        provider: 'gateway',
        status: { in: ['queued', 'failed'] },
        createdAt: { lt: new Date(now.getTime() - SMS_RETRY_WINDOW_MS) },
      },
      select: { id: true },
    });
    if (tooOld.length) {
      await prisma.smsOutbox.updateMany({ where: { id: { in: tooOld.map(r => r.id) } }, data: { status: 'abandoned' } });
      for (let i = 0; i < tooOld.length; i += 1) await this.bumpMonth(operatorId, 'monthFailed');
      result.abandoned = tooOld.length;
      logger.warn(`[SMS] ${tooOld.length} SMS abandoned after 2 h for operator ${operatorId}`);
    }
    if (!settings || settings.mode !== 'gateway') return result;

    const rows = await prisma.smsOutbox.findMany({
      where: { operatorId, provider: 'gateway', status: { in: ['queued', 'failed'] } },
      orderBy: { createdAt: 'asc' },
      take: MAX_GATEWAY_CALLS_PER_RUN,
    });
    for (const row of rows) {
      result.checked += 1;
      if (row.status === 'queued' && row.providerMessageId) {
        const outcome = await this.pollGateway(settings, row);
        if (outcome === 'sent') result.sent += 1;
      } else if (row.attempts < MAX_ATTEMPTS) {
        const text = await this.renderBody(row);
        if (text === null) {
          await prisma.smsOutbox.update({ where: { id: row.id }, data: { status: 'abandoned', lastError: 'sms_body_unavailable' } });
          await this.bumpMonth(operatorId, 'monthFailed');
          result.abandoned += 1;
          continue;
        }
        if ((await this.attemptGateway(settings, row, text)) === 'sent') result.sent += 1;
      }
    }
    return result;
  }

  private async pollGateway(settings: OperatorSmsSettings, row: SmsOutbox): Promise<SendOutcome> {
    try {
      const message = await this.gateway.state(this.credentials(settings), row.providerMessageId!);
      const status = this.statusOf(message.state);
      if (status === 'queued') return 'queued';
      await prisma.smsOutbox.update({ where: { id: row.id }, data: { status, lastError: status === 'failed' ? 'sms_gateway_failed' : null } });
      if (status === 'failed') {
        await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { lastError: 'sms_gateway_failed', lastErrorAt: new Date() } });
        return 'failed';
      }
      await this.bumpMonth(settings.operatorId, 'monthSent', { lastSentAt: new Date(), lastError: null, lastErrorAt: null });
      return 'sent';
    } catch (error) {
      const code = error instanceof GatewayError ? error.code : error instanceof HttpException && error.code ? error.code : 'sms_gateway_error';
      await prisma.operatorSmsSettings.update({ where: { id: settings.id }, data: { lastError: code, lastErrorAt: new Date() } });
      return 'queued';
    }
  }

  /** The text of an SMS to retry, rebuilt from the booking (texts are never stored). Null when it cannot be. */
  private async renderBody(row: SmsOutbox): Promise<string | null> {
    if (row.kind === 'test') return this.testText();
    if (!row.reservationId) return null;
    const booking = await prisma.reservation.findUnique({ where: { id: row.reservationId }, include: WITH_LISTING });
    if (!booking?.parking.listing || booking.status === 'cancelled') return null;
    const publicBooking = toPublicBooking(booking);
    const url = SECRET_KEY ? this.notifications.manageUrl(booking.reference, manageToken(booking.id, SECRET_KEY, booking.manageTokenVersion)) : null;
    if (row.kind === 'booking_confirmed') return confirmationSms(PRODUCT_NAME, publicBooking, url);
    if (row.kind === 'booking_reminder') return reminderSms(PRODUCT_NAME, publicBooking, url);
    if (row.kind === 'flight_landed') {
      const [point] = await prisma.$queryRaw<{ label: string | null; instructions: string | null }[]>`
        SELECT "returnMeetingLabel" AS label, "returnMeetingInstructions" AS instructions FROM parkings WHERE id = ${booking.parkingId}`;
      return landedSms({
        productName: PRODUCT_NAME,
        parkingName: booking.parking.listing.title,
        meetingLabel: point?.label ?? booking.parking.listing.airport.name,
        instructions: point?.instructions ?? null,
        phone: booking.parking.listing.contactPhone,
        manageUrl: url,
      });
    }
    return null;
  }

  private testText(): string {
    return `${PRODUCT_NAME} : SMS de test. Votre téléphone est bien relié, les voyageurs recevront vos SMS depuis ce numéro.`;
  }

  /** Every operator's queue, for the crons. */
  public async refreshAll(): Promise<{ operators: number; checked: number; sent: number; abandoned: number }> {
    const operators = await prisma.smsOutbox.findMany({
      where: { provider: 'gateway', status: { in: ['queued', 'failed'] } },
      distinct: ['operatorId'],
      select: { operatorId: true },
    });
    const total = { operators: operators.length, checked: 0, sent: 0, abandoned: 0 };
    for (const { operatorId } of operators) {
      const r = await this.refreshQueue(operatorId, { force: true });
      total.checked += r.checked;
      total.sent += r.sent;
      total.abandoned += r.abandoned;
    }
    return total;
  }

  /** Retention of the recipients' numbers: outbox rows older than 30 days are deleted (nightly). */
  public async purgeOld(): Promise<number> {
    const { count } = await prisma.smsOutbox.deleteMany({
      where: { createdAt: { lt: new Date(Date.now() - SMS_OUTBOX_RETENTION_DAYS * 86400000) } },
    });
    return count;
  }

  /** Whether the planning should warn: a gateway SMS waiting for more than 10 minutes. */
  public async pendingWarning(operatorId: string): Promise<{ pending: number } | null> {
    const stale = await prisma.smsOutbox.count({
      where: { operatorId, provider: 'gateway', status: { in: ['queued', 'failed'] }, createdAt: { lt: new Date(Date.now() - SMS_STALE_AFTER_MS) } },
    });
    if (!stale) return null;
    const pending = await prisma.smsOutbox.count({ where: { operatorId, provider: 'gateway', status: { in: ['queued', 'failed'] } } });
    return { pending };
  }

  private async bumpMonth(
    operatorId: string,
    field: 'monthSent' | 'monthFailed',
    extra: Partial<Pick<OperatorSmsSettings, 'lastSentAt' | 'lastError' | 'lastErrorAt'>> = {},
  ) {
    const key = monthKeyOf(new Date());
    const current = await prisma.operatorSmsSettings.findUnique({ where: { operatorId }, select: { id: true, monthKey: true } });
    if (!current) return;
    const reset = current.monthKey !== key;
    await prisma.operatorSmsSettings.update({
      where: { id: current.id },
      data: reset
        ? { monthKey: key, monthSent: field === 'monthSent' ? 1 : 0, monthFailed: field === 'monthFailed' ? 1 : 0, ...extra }
        : { [field]: { increment: 1 }, ...extra },
    });
  }

  // ---- Settings (pro space, manager) ------------------------------------------------------------------

  private brevoAvailable(): boolean {
    return !!this.notifications.settings.apiKey;
  }

  private view(settings: OperatorSmsSettings | null): SmsSettingsView {
    const linked = settings?.mode === 'gateway' && !!settings.gatewayLogin;
    return {
      mode: settings?.mode ?? 'none',
      brevoAvailable: this.brevoAvailable(),
      gateway: linked
        ? {
            baseUrl: settings!.gatewayBaseUrl,
            login: settings!.gatewayLogin!,
            senderPhone: settings!.senderPhone,
            linkedAt: settings!.linkedAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  public async settings(actor: AuthenticatedStaff): Promise<SmsSettingsView> {
    return this.view(await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } }));
  }

  public async update(actor: AuthenticatedStaff, input: UpdateSmsSettingsInput): Promise<SmsSettingsView> {
    const existing = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });
    let data: Partial<OperatorSmsSettings>;
    if (input.mode === 'gateway') {
      const login = input.login?.trim() ?? '';
      const senderPhone = input.senderPhone?.trim() ?? '';
      const password = input.password ?? '';
      const fields: Record<string, string> = {};
      if (!login) fields.login = 'required';
      if (!senderPhone) fields.senderPhone = 'required';
      if (!password && !(existing?.gatewayLogin === login && existing.gatewayPasswordEncrypted)) fields.password = 'required';
      if (Object.keys(fields).length) throw new ValidationException(fields);
      const key = smsGatewayEncryptionKey();
      if (!key) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'SMS_GATEWAY_ENCRYPTION_KEY is not set', 'sms_encryption_key_missing');
      let encrypted = existing?.gatewayPasswordEncrypted ?? null;
      if (password) {
        try {
          encrypted = encryptSecret(password, key);
        } catch {
          throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'SMS_GATEWAY_ENCRYPTION_KEY is invalid', 'sms_encryption_key_invalid');
        }
      }
      const baseUrl = input.baseUrl?.trim().replace(/\/+$/, '') || null;
      data = {
        mode: 'gateway',
        gatewayBaseUrl: baseUrl === SMS_GATEWAY_CLOUD_URL ? null : baseUrl,
        gatewayLogin: login,
        gatewayPasswordEncrypted: encrypted,
        senderPhone,
        linkedAt: existing?.mode === 'gateway' && existing.linkedAt ? existing.linkedAt : new Date(),
        lastError: null,
        lastErrorAt: null,
      };
    } else {
      if (input.mode === 'brevo' && !this.brevoAvailable())
        throw new HttpException(httpStatus.CONFLICT, 'Brevo is not configured', 'brevo_unavailable');
      // Leaving the gateway: its credentials are not kept.
      data = {
        mode: input.mode,
        gatewayBaseUrl: null,
        gatewayLogin: null,
        gatewayPasswordEncrypted: null,
        senderPhone: null,
        linkedAt: null,
        lastError: null,
        lastErrorAt: null,
      };
    }
    const saved = await prisma.operatorSmsSettings.upsert({
      where: { operatorId: actor.operatorId },
      create: { operatorId: actor.operatorId, ...data },
      update: data,
    });
    await this.audit.record(actor, { action: 'sms.settings', entityType: 'operator', entityId: actor.operatorId, details: { mode: saved.mode } });
    return this.view(saved);
  }

  public async disable(actor: AuthenticatedStaff): Promise<SmsSettingsView> {
    return this.update(actor, { mode: 'none' });
  }

  /** A test SMS through the operator's channel. Throws the gateway's code when it refuses it. */
  public async test(actor: AuthenticatedStaff, to: string): Promise<{ outcome: SendOutcome }> {
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });
    if (!settings || settings.mode === 'none') throw new HttpException(httpStatus.CONFLICT, 'SMS not configured', 'sms_not_configured');
    const recipient = smsRecipient(to);
    if (!recipient) throw new ValidationException({ to: 'invalid_phone' });
    if (settings.mode === 'gateway') this.credentials(settings); // key and password readable, before anything is queued
    const outcome = await this.sendTravellerSms(actor.operatorId, { reservationId: null, kind: 'test', to: recipient, text: this.testText() });
    if (outcome === 'failed') {
      const fresh = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId }, select: { lastError: true } });
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Test SMS failed', fresh?.lastError ?? 'sms_gateway_error');
    }
    return { outcome };
  }

  public async status(actor: AuthenticatedStaff): Promise<SmsStatusView> {
    await this.refreshQueue(actor.operatorId).catch(error =>
      logger.warn(`[SMS] Queue refresh failed for operator ${actor.operatorId}: ${error?.name ?? 'error'}`),
    );
    const settings = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId } });
    const pending = await prisma.smsOutbox.count({
      where: { operatorId: actor.operatorId, provider: 'gateway', status: { in: ['queued', 'failed'] } },
    });
    const stale = pending ? (await this.pendingWarning(actor.operatorId)) !== null : false;
    const sameMonth = settings?.monthKey === monthKeyOf(new Date());
    return {
      mode: settings?.mode ?? 'none',
      brevoAvailable: this.brevoAvailable(),
      linkedAt: settings?.linkedAt?.toISOString() ?? null,
      lastSentAt: settings?.lastSentAt?.toISOString() ?? null,
      senderPhone: settings?.mode === 'gateway' ? (settings.senderPhone ?? null) : null,
      month: { sent: sameMonth ? settings!.monthSent : 0, failed: sameMonth ? settings!.monthFailed : 0 },
      pending,
      pendingStale: stale,
      lastError: settings?.lastError ?? null,
      lastErrorAt: settings?.lastErrorAt?.toISOString() ?? null,
    };
  }
}
