import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PRODUCT_NAME, SECRET_KEY } from '@/config';
import prisma, { ReminderSettings, ReservationChannel, SmsMode, SmsOutbox } from '@/database';
import { MANAGE_TOKEN_LENGTH, manageToken } from '@/domain/booking';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import {
  BOARD_EVENINGS_AFTER,
  BOARD_EVENINGS_BEFORE,
  DEFAULT_SEND_TIME,
  defaultTemplate,
  EveningRule,
  eveningOf,
  inQuietHours,
  missedEvening,
  NotDueReason,
  reminderDueAt,
  renderTemplate,
  SEND_TIMES,
  shortTemplate,
  TEMPLATE_VARIABLES,
  templateContextOf,
  TemplateValues,
  unknownVariables,
  valuesOf,
} from '@/domain/day-before-sms';
import { smsRecipient } from '@/domain/phone';
import { can } from '@/domain/roles';
import { addDays, dayBounds, localDate, localDateTime } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { SendOutcome, SmsService, SMS_RETRY_WINDOW_MS } from './sms.service';

/** What happens to one booking's day-before SMS, as the pro space shows it. */
export type ReminderRowStatus =
  'planned' | 'sent' | 'waiting' | 'failed' | 'excluded' | 'disabled' | 'no_mobile' | 'foreign' | 'no_channel' | 'not_sent' | NotDueReason;

export interface ReminderRow {
  reservationId: string;
  reference: string;
  /** Local "YYYY-MM-DDTHH:mm" of the drop-off. */
  arrivalAt: string;
  customerName: string;
  customerPhone: string;
  channel: ReservationChannel;
  channelDetail: string | null;
  status: ReminderRowStatus;
  /** Local "YYYY-MM-DDTHH:mm": when it leaves (planned) or left (sent, waiting, failed). */
  at: string | null;
  /** First name of the staff member who left it out. */
  excludedBy: string | null;
}

export interface EveningView {
  /** Local date of the evening; its departures are the next day. */
  date: string;
  departuresDate: string;
  when: 'past' | 'tonight' | 'future';
  sendTime: string;
  /** Another time than the usual one, chosen for this evening. */
  timeChanged: boolean;
  paused: boolean;
  /** "Envoyer maintenant": tonight, or yesterday's evening for today's remaining drop-offs. */
  canSendNow: boolean;
  counts: { departures: number; planned: number; sent: number; waiting: number; failed: number; withoutSms: number };
}

export interface ReminderBoard {
  parkingId: string;
  today: string;
  settings: {
    enabled: boolean;
    sendTime: string;
    template: string;
    /** False while the parking uses Plazo's text. */
    custom: boolean;
    updatedAt: string | null;
    updatedBy: string | null;
  };
  defaults: { template: string; short: string };
  sendTimes: readonly string[];
  variables: readonly string[];
  channel: { mode: SmsMode; repliesReachParking: boolean };
  /** {lien} gives the booking's page (the parking is on the site). */
  linkAvailable: boolean;
  evenings: EveningView[];
  evening: EveningView & { rows: ReminderRow[] };
  /** Values of the preview: the evening's first planned booking, else an example. */
  sample: { customerName: string; values: TemplateValues };
  can: { edit: boolean; manage: boolean };
}

export interface UpdateReminderSettingsInput {
  enabled?: boolean;
  sendTime?: string;
  template?: string | null;
}

export interface UpdateEveningInput {
  sendTime?: string | null;
  paused?: boolean;
}

/** Statuses kept out of the lists: not a drop-off. */
const HIDDEN_STATUSES = ['pending_payment', 'cancelled'] as const;
/** How far ahead an evening may be changed. */
const EVENING_HORIZON_DAYS = 60;

type Usual = Pick<ReminderSettings, 'enabled' | 'sendTime' | 'template'>;
const USUAL: Usual = { enabled: true, sendTime: DEFAULT_SEND_TIME, template: null };

/**
 * The day-before SMS (« SMS de la veille », S-A + S-B, 06/10/2026). Each parking chooses the usual
 * time and the text; an evening may be moved or paused, a booking left out. The reminder (SMS, plus
 * the email and the app's push as in B) leaves once per booking, from `dispatchDue`, which an
 * external scheduler calls every 15 minutes (Vercel Hobby only runs a daily cron, kept as a fallback).
 */
@Service()
export class ReminderService {
  public notifications = Container.get(NotificationService);
  public sms = Container.get(SmsService);
  public push = Container.get(PushService);

  // ---- Sending --------------------------------------------------------------------------------

  /** Every reminder due now, once each. Nothing leaves during the quiet hours (22:00-07:00, local). */
  public async dispatchDue(now = new Date()): Promise<{ checked: number; sent: number; failed: number }> {
    const parkings = await prisma.parking.findMany({ select: { id: true, timezone: true, reminderSettings: true } });
    let checked = 0;
    let sent = 0;
    let failed = 0;
    for (const parking of parkings) {
      const usual = parking.reminderSettings ?? USUAL;
      if (!usual.enabled || inQuietHours(now, parking.timezone)) continue;
      const today = localDate(now, parking.timezone);
      const rows = await prisma.reservation.findMany({
        where: {
          parkingId: parking.id,
          status: 'upcoming',
          reminderSentAt: null,
          reminderExcludedAt: null,
          arrivalAt: { gt: now, lt: dayBounds(addDays(today, 1), parking.timezone).end },
        },
        select: { id: true, arrivalAt: true, createdAt: true },
      });
      if (!rows.length) continue;
      const rules = await this.rules(parking.id, usual, [addDays(today, -1), today]);
      for (const row of rows) {
        checked += 1;
        const due = reminderDueAt({ ...row, timeZone: parking.timezone, evening: rules.get(eveningOf(row.arrivalAt, parking.timezone))! });
        if (!('at' in due) || now < due.at || missedEvening(due.at, row.arrivalAt, now, parking.timezone)) continue;
        const outcome = await this.send(row.id, now);
        if (outcome === 'sent') sent += 1;
        else if (outcome === 'failed') failed += 1;
      }
    }
    return { checked, sent, failed };
  }

  /**
   * One booking's reminder: claimed first, so it never leaves twice. A failure never fails the caller, but it is
   * reported ('failed'), so that the cron can answer 500 when nothing left at all (08/10/2026: cron-job.org alerts).
   */
  private async send(id: string, now: Date): Promise<'sent' | 'failed' | 'taken'> {
    const { count } = await prisma.reservation.updateMany({
      where: { id, status: 'upcoming', reminderSentAt: null, reminderExcludedAt: null },
      data: { reminderSentAt: now },
    });
    if (!count) return 'taken';
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id }, include: WITH_LISTING });
    const token = SECRET_KEY ? manageToken(record.id, SECRET_KEY, record.manageTokenVersion) : null;
    const firstName = record.customerName.trim().split(/\s+/)[0];
    const parkingName = record.parking.listing?.title ?? record.parking.name;
    try {
      if (record.parking.listing) await this.notifications.bookingReminder(toPublicBooking(record, now), token);
      await this.sms.sendTravellerSms(record.operatorId, {
        reservationId: record.id,
        kind: 'booking_reminder',
        to: record.customerPhone,
        text: await this.sms.reminderText(record, this.sms.bookingLink(record)),
      });
      await this.push.notifyTravellers(
        [record.id],
        {
          title: `À demain, ${firstName} !`,
          body: `Dépôt prévu ${localDateTime(record.arrivalAt, record.parking.timezone).slice(11)} à ${parkingName}.`,
        },
        { data: { type: 'booking', event: 'reminder', reservationId: record.id }, collapseId: `reminder-${record.id}` },
      );
    } catch (error) {
      logger.warn(`[Reminders] Reminder for ${record.reference} failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      return 'failed';
    }
    return 'sent';
  }

  /** "Envoyer maintenant": the evening's bookings not reminded yet, whatever its time or pause. */
  public async sendEveningNow(actor: AuthenticatedStaff, parkingId: string, date: string, now = new Date()): Promise<ReminderBoard> {
    const parking = await this.parkingOf(actor, parkingId);
    const today = localDate(now, parking.timezone);
    if (date !== today && date !== addDays(today, -1))
      throw new HttpException(httpStatus.CONFLICT, 'Only tonight can be sent now', 'reminder_not_tonight');
    const rows = await prisma.reservation.findMany({
      where: {
        parkingId,
        status: 'upcoming',
        reminderSentAt: null,
        reminderExcludedAt: null,
        arrivalAt: { gt: now, ...this.departures(addDays(date, 1), parking.timezone) },
      },
      select: { id: true },
    });
    let sent = 0;
    for (const row of rows) if (await this.send(row.id, now)) sent += 1;
    logger.info(`[Reminders] ${sent} reminders sent now for parking ${parkingId}, evening ${date}`);
    return this.board(actor, parkingId, date, now);
  }

  // ---- The pro space --------------------------------------------------------------------------

  public async board(actor: AuthenticatedStaff, parkingId: string, eveningDate?: string, now = new Date()): Promise<ReminderBoard> {
    const parking = await this.parkingOf(actor, parkingId);
    const tz = parking.timezone;
    const today = localDate(now, tz);
    const first = addDays(today, -BOARD_EVENINGS_BEFORE);
    const dates = Array.from({ length: BOARD_EVENINGS_BEFORE + 1 + BOARD_EVENINGS_AFTER }, (_, i) => addDays(first, i));
    const selected = eveningDate ?? today;
    if (!dates.includes(selected)) dates.push(selected);

    const [usualRow, sms] = await Promise.all([
      prisma.reminderSettings.findUnique({ where: { parkingId } }),
      prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId }, select: { mode: true } }),
    ]);
    const usual = usualRow ?? USUAL;
    const rules = await this.rules(parkingId, usual, dates);
    const mode = sms?.mode ?? 'none';
    const reservations = await prisma.reservation.findMany({
      where: {
        parkingId,
        status: { notIn: [...HIDDEN_STATUSES] },
        OR: [...new Set(dates)].map(date => ({ arrivalAt: this.departures(addDays(date, 1), tz) })),
      },
      orderBy: { arrivalAt: 'asc' },
    });
    const outbox = await this.latestOutbox(reservations.map(r => r.id));
    const excluders = await this.firstNames(reservations.map(r => r.reminderExcludedById).filter((id): id is string => !!id));

    const rowsByEvening = new Map<string, ReminderRow[]>();
    for (const r of reservations) {
      const date = eveningOf(r.arrivalAt, tz);
      const { status, at } = this.statusOf(r, { usual, rule: rules.get(date)!, mode, outbox: outbox.get(r.id) ?? null, now, tz });
      const row: ReminderRow = {
        reservationId: r.id,
        reference: r.reference,
        arrivalAt: localDateTime(r.arrivalAt, tz),
        customerName: r.customerName,
        customerPhone: r.customerPhone,
        channel: r.channel,
        channelDetail: r.channelDetail,
        status,
        at: at ? localDateTime(at, tz) : null,
        excludedBy: r.reminderExcludedById ? (excluders.get(r.reminderExcludedById) ?? null) : null,
      };
      rowsByEvening.set(date, [...(rowsByEvening.get(date) ?? []), row]);
    }
    const eveningView = (date: string): EveningView => {
      const rule = rules.get(date)!;
      const rows = rowsByEvening.get(date) ?? [];
      const count = (...statuses: ReminderRowStatus[]) => rows.filter(row => statuses.includes(row.status)).length;
      const pendingNow = reservations.some(
        r => eveningOf(r.arrivalAt, tz) === date && r.status === 'upcoming' && !r.reminderSentAt && !r.reminderExcludedAt && r.arrivalAt > now,
      );
      return {
        date,
        departuresDate: addDays(date, 1),
        when: date < today ? 'past' : date === today ? 'tonight' : 'future',
        sendTime: rule.sendTime,
        timeChanged: rule.sendTime !== usual.sendTime,
        paused: rule.paused,
        canSendNow: (date === today || date === addDays(today, -1)) && pendingNow,
        counts: {
          departures: rows.length,
          planned: count('planned'),
          sent: count('sent'),
          waiting: count('waiting'),
          failed: count('failed'),
          withoutSms: rows.length - count('planned', 'sent', 'waiting', 'failed'),
        },
      };
    };

    const context = templateContextOf(PRODUCT_NAME, { ...parking, listing: parking.listing }, mode === 'gateway');
    const defaults = { template: defaultTemplate(context), short: shortTemplate(context) };
    const linkAvailable = !!SECRET_KEY && !!parking.listing && !!this.notifications.manageUrl('R', 'x');
    const selectedRows = rowsByEvening.get(selected) ?? [];
    const example = selectedRows.find(row => row.status === 'planned') ?? null;
    const exampleRecord = example ? reservations.find(r => r.id === example.reservationId)! : null;
    const sampleSource = exampleRecord ?? {
      customerName: 'Camille Martin',
      arrivalAt: new Date(`${addDays(selected, 1)}T08:30:00Z`),
      plate: 'AB-123-CD',
      reference: 'R7KQ2M',
    };
    const sampleLink = linkAvailable ? this.notifications.manageUrl(sampleSource.reference, 'X'.repeat(MANAGE_TOKEN_LENGTH)) : null;
    // The example's 08:30 is written in UTC so that it reads 08:30 whatever the parking's zone.
    const sampleValues = exampleRecord ? valuesOf(exampleRecord, tz, sampleLink) : valuesOf(sampleSource, 'UTC', sampleLink);
    const updatedBy = usualRow?.updatedById ? ((await this.firstNames([usualRow.updatedById])).get(usualRow.updatedById) ?? null) : null;

    return {
      parkingId,
      today,
      settings: {
        enabled: usual.enabled,
        sendTime: usual.sendTime,
        template: usual.template ?? defaults.template,
        custom: usual.template !== null,
        updatedAt: usualRow ? usualRow.updatedAt.toISOString() : null,
        updatedBy,
      },
      defaults,
      sendTimes: SEND_TIMES,
      variables: TEMPLATE_VARIABLES,
      channel: { mode, repliesReachParking: mode === 'gateway' },
      linkAvailable,
      evenings: dates.slice(0, BOARD_EVENINGS_BEFORE + 1 + BOARD_EVENINGS_AFTER).map(eveningView),
      evening: { ...eveningView(selected), rows: selectedRows },
      sample: { customerName: sampleSource.customerName, values: sampleValues },
      can: { edit: can(actor.role, 'parking:manage'), manage: can(actor.role, 'reservations:manage') },
    };
  }

  public async updateSettings(actor: AuthenticatedStaff, parkingId: string, input: UpdateReminderSettingsInput): Promise<ReminderBoard> {
    const parking = await this.parkingOf(actor, parkingId);
    const data: Partial<Usual> = {};
    if (input.enabled !== undefined) data.enabled = input.enabled;
    if (input.sendTime !== undefined) data.sendTime = input.sendTime;
    if (input.template !== undefined) {
      const template = input.template?.trim() ?? '';
      if (template && unknownVariables(template).length) throw new ValidationException({ template: 'unknown_variable' });
      const sms = await prisma.operatorSmsSettings.findUnique({ where: { operatorId: actor.operatorId }, select: { mode: true } });
      const plazoText = defaultTemplate(templateContextOf(PRODUCT_NAME, parking, sms?.mode === 'gateway'));
      // Plazo's text, or nothing: back to Plazo's (it follows the parking's details).
      data.template = !template || template === plazoText ? null : template;
    }
    await prisma.reminderSettings.upsert({
      where: { parkingId },
      create: { parkingId, ...data, updatedById: actor.id },
      update: { ...data, updatedById: actor.id },
    });
    return this.board(actor, parkingId);
  }

  public async updateEvening(actor: AuthenticatedStaff, parkingId: string, date: string, input: UpdateEveningInput, now = new Date()) {
    const parking = await this.parkingOf(actor, parkingId);
    const today = localDate(now, parking.timezone);
    if (date < today || date > addDays(today, EVENING_HORIZON_DAYS)) throw new ValidationException({ date: 'out_of_range' });
    const usual = (await prisma.reminderSettings.findUnique({ where: { parkingId } })) ?? USUAL;
    const current = await prisma.reminderEvening.findUnique({ where: { parkingId_date: { parkingId, date } } });
    const sendTime = input.sendTime !== undefined ? input.sendTime : (current?.sendTime ?? null);
    const paused = input.paused ?? current?.paused ?? false;
    const differs = (sendTime !== null && sendTime !== usual.sendTime) || paused;
    if (!differs) await prisma.reminderEvening.deleteMany({ where: { parkingId, date } });
    else {
      const data = { sendTime: sendTime === usual.sendTime ? null : sendTime, paused, updatedById: actor.id };
      await prisma.reminderEvening.upsert({ where: { parkingId_date: { parkingId, date } }, create: { parkingId, date, ...data }, update: data });
    }
    return this.board(actor, parkingId, date, now);
  }

  /** "Ne pas envoyer" / "Rétablir" on one booking, before its reminder left. */
  public async setExcluded(actor: AuthenticatedStaff, reservationId: string, excluded: boolean): Promise<{ excluded: boolean }> {
    const reservation = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId } });
    if (!reservation) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    if (reservation.reminderSentAt) throw new HttpException(httpStatus.CONFLICT, 'The reminder already left', 'reminder_already_sent');
    await prisma.reservation.update({
      where: { id: reservationId },
      data: excluded ? { reminderExcludedAt: new Date(), reminderExcludedById: actor.id } : { reminderExcludedAt: null, reminderExcludedById: null },
    });
    return { excluded };
  }

  /** "M'envoyer un test": the text (saved, or being written) with the preview's values, to the staff member's phone. */
  public async sendTest(
    actor: AuthenticatedStaff,
    parkingId: string,
    input: { to?: string; template?: string },
  ): Promise<{ outcome: SendOutcome; to: string }> {
    const board = await this.board(actor, parkingId);
    const template = input.template?.trim() || board.settings.template;
    if (unknownVariables(template).length) throw new ValidationException({ template: 'unknown_variable' });
    const to = smsRecipient(input.to ?? actor.phone ?? '');
    if (!to) throw new ValidationException({ to: input.to ? 'invalid_phone' : 'required' });
    if (board.channel.mode === 'none') throw new HttpException(httpStatus.CONFLICT, 'SMS not configured', 'sms_not_configured');
    const outcome = await this.sms.sendTravellerSms(actor.operatorId, {
      reservationId: null,
      kind: 'reminder_test',
      to,
      text: renderTemplate(template, board.sample.values),
    });
    if (outcome === 'failed') throw new HttpException(httpStatus.BAD_GATEWAY, 'Test SMS failed', 'sms_gateway_error');
    return { outcome, to };
  }

  // ---- Helpers --------------------------------------------------------------------------------

  /** The rule of each evening: the usual time, unless the evening was moved or paused. */
  private async rules(parkingId: string, usual: Usual, dates: string[]): Promise<Map<string, EveningRule>> {
    const evenings = await prisma.reminderEvening.findMany({ where: { parkingId, date: { in: dates } } });
    const byDate = new Map(evenings.map(e => [e.date, e]));
    return new Map(
      dates.map(date => {
        const evening = byDate.get(date);
        return [date, { sendTime: evening?.sendTime ?? usual.sendTime, paused: evening?.paused ?? false }];
      }),
    );
  }

  private statusOf(
    r: { status: string; customerPhone: string; arrivalAt: Date; createdAt: Date; reminderSentAt: Date | null; reminderExcludedAt: Date | null },
    ctx: { usual: Usual; rule: EveningRule; mode: SmsMode; outbox: SmsOutbox | null; now: Date; tz: string },
  ): { status: ReminderRowStatus; at: Date | null } {
    const phoneIssue = (): ReminderRowStatus | null => {
      if (smsRecipient(r.customerPhone)) return null;
      const digits = r.customerPhone.replace(/[\s.()-]/g, '');
      return /^(\+|00)(?!33)/.test(digits) ? 'foreign' : 'no_mobile';
    };
    if (r.reminderSentAt) {
      const row = ctx.outbox;
      if (row) {
        if (row.status === 'sent' || row.status === 'delivered') return { status: 'sent', at: r.reminderSentAt };
        if (row.status === 'abandoned') return { status: 'failed', at: r.reminderSentAt };
        if (row.status === 'failed' && (row.provider !== 'gateway' || ctx.now.getTime() - row.createdAt.getTime() > SMS_RETRY_WINDOW_MS))
          return { status: 'failed', at: r.reminderSentAt };
        return { status: 'waiting', at: r.reminderSentAt };
      }
      return { status: phoneIssue() ?? (ctx.mode === 'none' ? 'no_channel' : 'not_sent'), at: null };
    }
    if (r.reminderExcludedAt) return { status: 'excluded', at: null };
    const issue = phoneIssue();
    if (issue) return { status: issue, at: null };
    if (ctx.mode === 'none') return { status: 'no_channel', at: null };
    if (!ctx.usual.enabled) return { status: 'disabled', at: null };
    const due = reminderDueAt({ arrivalAt: r.arrivalAt, createdAt: r.createdAt, timeZone: ctx.tz, evening: ctx.rule });
    if ('reason' in due) return { status: due.reason, at: null };
    if (r.status !== 'upcoming' || r.arrivalAt <= ctx.now || missedEvening(due.at, r.arrivalAt, ctx.now, ctx.tz))
      return { status: 'not_sent', at: null };
    return { status: 'planned', at: due.at };
  }

  private async latestOutbox(reservationIds: string[]): Promise<Map<string, SmsOutbox>> {
    if (!reservationIds.length) return new Map();
    const rows = await prisma.smsOutbox.findMany({
      where: { reservationId: { in: reservationIds }, kind: 'booking_reminder' },
      orderBy: { createdAt: 'desc' },
    });
    const latest = new Map<string, SmsOutbox>();
    for (const row of rows) if (row.reservationId && !latest.has(row.reservationId)) latest.set(row.reservationId, row);
    return latest;
  }

  private async firstNames(staffIds: string[]): Promise<Map<string, string>> {
    if (!staffIds.length) return new Map();
    const staff = await prisma.staff.findMany({ where: { id: { in: [...new Set(staffIds)] } }, select: { id: true, firstName: true, name: true } });
    return new Map(staff.map(s => [s.id, s.firstName || s.name.split(' ')[0]]));
  }

  /** The drop-offs of a local day, as a Prisma range. */
  private departures(day: string, timeZone: string) {
    const { start, end } = dayBounds(day, timeZone);
    return { gte: start, lt: end };
  }

  private async parkingOf(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({
      where: { id: parkingId, operatorId: actor.operatorId },
      include: { listing: { select: { title: true, contactPhone: true, shuttleMinutes: true } } },
    });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }
}
