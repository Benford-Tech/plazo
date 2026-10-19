import { createHmac, timingSafeEqual } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { PRODUCT_COMPANY, PRODUCT_NAME, prospectingSettings } from '@/config';
import prisma, { Prisma, Prospect, ProspectStatus } from '@/database';
import {
  capDayStart,
  DEFAULT_DAILY_CAP,
  followUpDueAt,
  inSendingWindow,
  isClosed,
  MAX_FAILED_ATTEMPTS,
  MAX_IMPORT_ROWS,
  nextStep,
  nextWindowStart,
  PROSPECT_STATUSES,
  ProspectInput,
  prospectEmail,
  ProspectStatusName,
  PROSPECTING_TZ,
  remainingToday,
  retentionCutoff,
  RETRY_AFTER_MINUTES,
  SequenceStep,
  stepsOf,
  suppressionHash,
  templateValues,
  TemplateValues,
  validateProspect,
  validateSequence,
} from '@/domain/prospecting';
import {
  airportsOfRegion,
  effectiveRegion,
  isRegionKey,
  KNOWN_AIRPORTS,
  NO_REGION,
  RegionKey,
  regionView,
  sortedRegions,
} from '@/domain/prospect-regions';
import { addDays, dayBounds, localDate } from '@/domain/time';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { NotificationService, parseSender } from './notification.service';

/** At most this many emails per pass (each one is a call to Brevo): the rest waits for the next pass. */
const PASS_LIMIT = 25;
/** A claim older than this is considered abandoned (the function stopped mid-pass). */
const CLAIM_TIMEOUT_MINUTES = 10;
const OPEN_STATUSES: ProspectStatus[] = ['to_contact', 'contacted'];
const LIST_LIMIT = 2000;
const TAG = 'prospecting';

/** Sample values of « M'envoyer un test » when no prospect is chosen (fictional). */
const SAMPLE_VALUES: TemplateValues = {
  prénom: 'Camille',
  nom: 'Exemple',
  parking: 'Parking Exemple',
  aéroport: 'Lyon Saint-Exupéry',
  ville: 'Colombier-Saugnieu',
};

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Prospect not found', 'not_found');

export type SendOutcome = 'sent' | 'failed' | 'finished' | 'skipped';

/**
 * Prospection (Plateforme › Prospection, 18/10/2026, choix « A avec les relances de B »): the airport parkings the platform
 * owner emails, the three-step sequence and its daily cap, sending now or by the 15-minute pass, and the opt-out link.
 * Logs carry ids and counts only, never an address or a name.
 */
@Service()
export class ProspectingService {
  public notifications = Container.get(NotificationService);
  public audit = Container.get(AuditService);

  // ---- Configuration -----------------------------------------------------------------------------------------------

  /** PROSPECTING_SENDER_EMAIL / _NAME, else the sender of every other email (EMAIL_FROM). */
  public sender(): { name: string; email: string } | null {
    const env = prospectingSettings();
    if (env.senderEmail) return parseSender(env.senderName ? `${env.senderName} <${env.senderEmail}>` : env.senderEmail, PRODUCT_NAME);
    return parseSender(this.notifications.settings.emailFrom, PRODUCT_NAME);
  }

  private secret(): string {
    return process.env.SECRET_KEY || '';
  }

  /** Everything an email needs: Brevo, a sender, the site's address (the opt-out link) and the secret that signs it. */
  public configured(): boolean {
    return !!this.notifications.settings.apiKey && !!this.sender() && !!this.notifications.siteUrl('/') && !!this.secret();
  }

  private assertConfigured() {
    if (!this.configured()) {
      throw new HttpException(httpStatus.CONFLICT, 'Prospecting emails are not configured (Brevo, sender, site address)', 'prospecting_unavailable');
    }
  }

  private signature(id: string): string {
    return createHmac('sha256', this.secret()).update(`prospect-unsubscribe:${id}`).digest('base64url');
  }

  /** The opt-out token of a prospect: its id and an HMAC of it. */
  public unsubscribeToken(id: string): string {
    return `${id}.${this.signature(id)}`;
  }

  /** The prospect id of a valid token, else null (constant-time comparison). */
  public verifyToken(token: string): string | null {
    if (!this.secret() || typeof token !== 'string' || token.length > 200) return null;
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    const id = token.slice(0, dot);
    if (!/^[a-z0-9]{10,40}$/i.test(id)) return null;
    const given = Buffer.from(token.slice(dot + 1));
    const expected = Buffer.from(this.signature(id));
    return given.length === expected.length && timingSafeEqual(given, expected) ? id : null;
  }

  public unsubscribeUrl(id: string): string {
    return this.notifications.siteUrl(`/api/public/prospecting/unsubscribe/${this.unsubscribeToken(id)}`) ?? '';
  }

  // ---- Settings ----------------------------------------------------------------------------------------------------

  public async loadSettings(): Promise<{ steps: SequenceStep[]; dailyCap: number; updatedAt: string | null }> {
    const row = await prisma.prospectingSettings.findUnique({ where: { id: 'default' } });
    return {
      steps: stepsOf(row?.steps, PRODUCT_NAME),
      dailyCap: row?.dailyCap ?? DEFAULT_DAILY_CAP,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  }

  public async settingsView() {
    const settings = await this.loadSettings();
    const sender = this.sender();
    return {
      ...settings,
      sender,
      replyTo: prospectingSettings().replyTo || null,
      configured: this.configured(),
      window: { days: 'Monday-Friday', start: '09:00', end: '18:00', timeZone: PROSPECTING_TZ },
    };
  }

  /** « Modifier les mails »: the three steps and the daily cap. The follow-ups already scheduled move with the new delays. */
  public async updateSettings(actor: AuthenticatedStaff, input: { steps?: unknown; dailyCap?: unknown }) {
    const checked = validateSequence(input.steps, input.dailyCap);
    if (!checked.ok) throw new ValidationException(checked.fields);
    const steps = checked.steps as unknown as Prisma.InputJsonValue;
    await prisma.prospectingSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', steps, dailyCap: checked.dailyCap, updatedById: actor.id },
      update: { steps, dailyCap: checked.dailyCap, updatedById: actor.id },
    });
    const rescheduled = await this.reschedule(checked.steps);
    await this.record(actor, 'prospecting.settings_updated', 'prospecting_settings', 'default', {
      dailyCap: checked.dailyCap,
      steps: checked.steps.map(s => ({ step: s.step, enabled: s.enabled, delayDays: s.delayDays })),
      rescheduled,
    });
    return this.settingsView();
  }

  /** Recomputes the next follow-up of every prospect in the middle of the sequence. */
  private async reschedule(steps: SequenceStep[]): Promise<number> {
    const rows = await prisma.prospect.findMany({
      where: { status: 'contacted', stoppedAt: null, nextSendAt: { not: null }, firstContactedAt: { not: null } },
      select: { id: true, step: true, firstContactedAt: true, lastContactedAt: true },
    });
    let count = 0;
    for (const row of rows) {
      const following = nextStep(steps, row.step);
      const notBefore = new Date((row.lastContactedAt ?? row.firstContactedAt!).getTime() + 24 * 3600 * 1000);
      const nextSendAt = following ? followUpDueAt(row.firstContactedAt!, following.delayDays, notBefore) : null;
      await prisma.prospect.updateMany({ where: { id: row.id, status: 'contacted', stoppedAt: null }, data: { nextSendAt } });
      count += 1;
    }
    return count;
  }

  // ---- The list ----------------------------------------------------------------------------------------------------

  private async airportNames(codes: (string | null)[]): Promise<Map<string, string>> {
    const wanted = [...new Set(codes.filter((c): c is string => !!c))];
    if (!wanted.length) return new Map();
    const rows = await prisma.airport.findMany({ where: { code: { in: wanted } }, select: { code: true, name: true } });
    return new Map(rows.map(r => [r.code, r.name]));
  }

  private async lastErrors(ids: string[]): Promise<Map<string, string>> {
    if (!ids.length) return new Map();
    const rows = await prisma.prospectMessage.findMany({
      where: { prospectId: { in: ids }, status: 'failed' },
      orderBy: { sentAt: 'desc' },
      select: { prospectId: true, error: true },
    });
    const map = new Map<string, string>();
    for (const r of rows) if (!map.has(r.prospectId)) map.set(r.prospectId, r.error ?? 'failed');
    return map;
  }

  private view(p: Prospect, airports: Map<string, string>, steps: SequenceStep[], errors: Map<string, string> = new Map()) {
    const following = p.nextSendAt ? nextStep(steps, p.step) : null;
    return {
      id: p.id,
      email: p.email,
      companyName: p.companyName,
      contactFirstName: p.contactFirstName,
      contactLastName: p.contactLastName,
      town: p.town,
      airportCode: p.airportCode,
      airportName: p.airportCode ? (airports.get(p.airportCode) ?? null) : null,
      // The region it is filed under (chosen by hand, else its airport's) and the one chosen by hand (the form).
      region: regionView(p),
      regionOverride: p.region,
      phone: p.phone,
      notes: p.notes,
      source: p.source,
      status: p.status,
      step: p.step,
      nextStep: following?.step ?? null,
      nextSendAt: p.nextSendAt?.toISOString() ?? null,
      firstContactedAt: p.firstContactedAt?.toISOString() ?? null,
      lastContactedAt: p.lastContactedAt?.toISOString() ?? null,
      stoppedAt: p.stoppedAt?.toISOString() ?? null,
      failedAttempts: p.failedAttempts,
      lastError: p.failedAttempts > 0 ? (errors.get(p.id) ?? null) : null,
      createdAt: p.createdAt.toISOString(),
    };
  }

  public async sentToday(now = new Date()): Promise<number> {
    return prisma.prospectMessage.count({ where: { status: 'sent', sentAt: { gte: capDayStart(now) } } });
  }

  /**
   * The prospects of a region (`none`: without one): the region chosen by hand, or none chosen and an airport of the region
   * (for `none`: no airport, or one Plazo does not place).
   */
  private regionWhere(region: RegionKey | typeof NO_REGION): Prisma.ProspectWhereInput {
    if (region === NO_REGION) {
      return { region: null, OR: [{ airportCode: null }, { airportCode: { notIn: KNOWN_AIRPORTS } }] };
    }
    return { OR: [{ region }, { region: null, airportCode: { in: airportsOfRegion(region) } }] };
  }

  /**
   * The page: prospects (filtered by status, airport and region), the counts of the pills (they follow the airport and the
   * region), the airports, the regions and their counts (they follow the airport), today's counter. Not paged: the page
   * receives every prospect of the filters (up to LIST_LIMIT) and groups them by region itself.
   */
  public async list(query: { status?: unknown; airport?: unknown; region?: unknown }, now = new Date()) {
    const fields: Record<string, string> = {};
    const status = query.status === undefined || query.status === '' ? null : query.status;
    if (status !== null && !PROSPECT_STATUSES.includes(status as ProspectStatusName)) fields.status = 'invalid_status';
    const airport = query.airport === undefined || query.airport === '' ? null : query.airport;
    if (airport !== null && (typeof airport !== 'string' || !/^[A-Za-z]{3}$/.test(airport))) fields.airport = 'invalid_airport';
    const region = query.region === undefined || query.region === '' ? null : query.region;
    if (region !== null && region !== NO_REGION && !isRegionKey(region)) fields.region = 'invalid_region';
    if (Object.keys(fields).length) throw new ValidationException(fields);

    const airportWhere: Prisma.ProspectWhereInput = airport ? { airportCode: (airport as string).toUpperCase() } : {};
    const placeWhere: Prisma.ProspectWhereInput = region
      ? { AND: [airportWhere, this.regionWhere(region as RegionKey | typeof NO_REGION)] }
      : airportWhere;
    const [rows, grouped, airportGroups, regionGroups, settings, sent] = await Promise.all([
      prisma.prospect.findMany({
        where: { AND: [placeWhere, status ? { status: status as ProspectStatus } : {}] },
        orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
        take: LIST_LIMIT,
      }),
      prisma.prospect.groupBy({ by: ['status'], where: placeWhere, _count: { _all: true } }),
      prisma.prospect.groupBy({ by: ['airportCode'], _count: { _all: true } }),
      prisma.prospect.groupBy({ by: ['region', 'airportCode'], where: airportWhere, _count: { _all: true } }),
      this.loadSettings(),
      this.sentToday(now),
    ]);
    const names = await this.airportNames([...rows.map(r => r.airportCode), ...airportGroups.map(g => g.airportCode)]);
    const errors = await this.lastErrors(rows.filter(r => r.failedAttempts > 0).map(r => r.id));
    const counts = Object.fromEntries(PROSPECT_STATUSES.map(s => [s, 0])) as Record<ProspectStatusName, number>;
    for (const g of grouped) counts[g.status] = g._count._all;
    const regionCounts: Record<string, number> = Object.fromEntries([...sortedRegions().map(r => [r.key, 0]), [NO_REGION, 0]]);
    for (const g of regionGroups) regionCounts[effectiveRegion(g) ?? NO_REGION] += g._count._all;
    return {
      data: rows.map(r => this.view(r, names, settings.steps, errors)),
      counts: { all: Object.values(counts).reduce((a, b) => a + b, 0), ...counts },
      airports: airportGroups
        .filter(g => g.airportCode)
        .map(g => ({ code: g.airportCode!, name: names.get(g.airportCode!) ?? null, count: g._count._all }))
        .sort((a, b) => a.code.localeCompare(b.code)),
      // Every region, alphabetical (the form and the filter), and how many prospects each has (« none »: without one).
      regions: sortedRegions(),
      regionCounts,
      today: { sent, cap: settings.dailyCap, remaining: remainingToday(settings.dailyCap, sent) },
      window: { open: inSendingWindow(now), nextOpening: nextWindowStart(now).toISOString() },
      configured: this.configured(),
    };
  }

  private async getOrThrow(id: string): Promise<Prospect> {
    const prospect = await prisma.prospect.findUnique({ where: { id } });
    if (!prospect) throw notFound();
    return prospect;
  }

  private async viewOf(prospect: Prospect) {
    const [names, settings] = await Promise.all([this.airportNames([prospect.airportCode]), this.loadSettings()]);
    return this.view(prospect, names, settings.steps);
  }

  private async isSuppressed(email: string): Promise<boolean> {
    return !!(await prisma.prospectSuppression.findUnique({ where: { emailHash: suppressionHash(email) } }));
  }

  private async assertAddressFree(email: string, exceptId?: string) {
    if (await this.isSuppressed(email)) {
      throw new HttpException(httpStatus.CONFLICT, 'This address asked not to be contacted', 'suppressed', undefined);
    }
    const existing = await prisma.prospect.findUnique({ where: { email }, select: { id: true } });
    if (existing && existing.id !== exceptId) throw new HttpException(httpStatus.CONFLICT, 'Prospect already listed', 'prospect_exists');
  }

  // ---- Writes ------------------------------------------------------------------------------------------------------

  private record(actor: AuthenticatedStaff, action: string, entityType: string, entityId: string | undefined, details: Prisma.InputJsonValue) {
    // The admin's own operator journal (like the platform's other writes); never an address or a name.
    return this.audit.record(
      { id: actor.id, operatorId: actor.actingAs?.realOperatorId ?? actor.operatorId },
      { action, entityType, entityId, details },
    );
  }

  public async create(actor: AuthenticatedStaff, input: ProspectInput) {
    const checked = validateProspect(input);
    if (!checked.ok) throw new ValidationException(checked.fields);
    const value = checked.value as Required<typeof checked.value>;
    await this.assertAddressFree(value.email);
    const prospect = await prisma.prospect.create({ data: { ...value, source: 'manual' } });
    await this.record(actor, 'prospect.created', 'prospect', prospect.id, { source: 'manual' });
    return this.viewOf(prospect);
  }

  public async update(actor: AuthenticatedStaff, id: string, input: ProspectInput) {
    const current = await this.getOrThrow(id);
    const checked = validateProspect(input, true);
    if (!checked.ok) throw new ValidationException(checked.fields);
    const value = checked.value;
    if (value.email !== undefined && value.email !== current.email) {
      if (current.status === 'unsubscribed') throw new HttpException(httpStatus.CONFLICT, 'Unsubscribed prospect', 'unsubscribed');
      await this.assertAddressFree(value.email!, id);
    }
    const prospect = await prisma.prospect.update({ where: { id }, data: value });
    await this.record(actor, 'prospect.updated', 'prospect', id, { fields: Object.keys(value) });
    return this.viewOf(prospect);
  }

  public async remove(actor: AuthenticatedStaff, id: string) {
    await this.getOrThrow(id);
    await prisma.prospect.delete({ where: { id } });
    await this.record(actor, 'prospect.deleted', 'prospect', id, {});
    return { id };
  }

  /**
   * « Importer un CSV »: the rows the page read from the file. `dryRun` answers what would happen (the preview) without
   * writing. Each row: new, duplicate (already listed, or twice in the file), suppressed (opted out) or invalid.
   */
  public async importRows(actor: AuthenticatedStaff, rows: unknown, dryRun: boolean) {
    if (!Array.isArray(rows) || rows.length === 0) throw new ValidationException({ rows: 'required' });
    if (rows.length > MAX_IMPORT_ROWS) throw new ValidationException({ rows: 'too_many_rows' });
    const checked = rows.map(row => validateProspect((row && typeof row === 'object' ? row : {}) as ProspectInput));
    const emails = checked.flatMap(c => (c.ok ? [c.value.email!] : []));
    const [existing, suppressed] = await Promise.all([
      prisma.prospect.findMany({ where: { email: { in: emails } }, select: { email: true } }),
      prisma.prospectSuppression.findMany({ where: { emailHash: { in: emails.map(suppressionHash) } }, select: { emailHash: true } }),
    ]);
    const listed = new Set(existing.map(e => e.email));
    const optedOut = new Set(suppressed.map(s => s.emailHash));
    const seen = new Set<string>();
    const toCreate: Prisma.ProspectCreateManyInput[] = [];
    const results = checked.map((c, index) => {
      if (!c.ok) return { row: index + 1, outcome: 'invalid' as const, fields: c.fields };
      const email = c.value.email!;
      if (optedOut.has(suppressionHash(email))) return { row: index + 1, outcome: 'suppressed' as const, email };
      if (listed.has(email) || seen.has(email)) return { row: index + 1, outcome: 'duplicate' as const, email };
      seen.add(email);
      toCreate.push({ ...(c.value as Required<typeof c.value>), source: 'csv' });
      return { row: index + 1, outcome: 'new' as const, email };
    });
    let created = 0;
    if (!dryRun && toCreate.length) {
      created = (await prisma.prospect.createMany({ data: toCreate, skipDuplicates: true })).count;
      await this.record(actor, 'prospect.imported', 'prospect', undefined, { rows: rows.length, created });
      logger.info(`[Prospecting] import: ${rows.length} rows, ${created} prospects created`);
    }
    const count = (outcome: string) => results.filter(r => r.outcome === outcome).length;
    return {
      dryRun,
      results,
      counts: { new: count('new'), duplicate: count('duplicate'), suppressed: count('suppressed'), invalid: count('invalid') },
      created,
    };
  }

  /**
   * « A répondu », « Intéressé », « Pas intéressé » or « Désinscrit » (by hand, e.g. asked by reply): each stops the
   * follow-ups for good. An unsubscribed address joins the opt-out list and never changes state again.
   */
  public async setStatus(actor: AuthenticatedStaff, id: string, status: unknown) {
    if (!(['replied', 'interested', 'not_interested', 'unsubscribed'] as unknown[]).includes(status)) {
      throw new ValidationException({ status: 'invalid_status' });
    }
    const current = await this.getOrThrow(id);
    if (current.status === 'unsubscribed') throw new HttpException(httpStatus.CONFLICT, 'Unsubscribed prospect', 'unsubscribed');
    const now = new Date();
    const prospect = await prisma.$transaction(async tx => {
      if (status === 'unsubscribed') {
        await tx.prospectSuppression.upsert({
          where: { emailHash: suppressionHash(current.email) },
          create: { emailHash: suppressionHash(current.email) },
          update: {},
        });
      }
      return tx.prospect.update({
        where: { id },
        data: { status: status as ProspectStatus, nextSendAt: null, stoppedAt: current.stoppedAt ?? now },
      });
    });
    await this.record(actor, 'prospect.status_changed', 'prospect', id, { from: current.status, to: status as string });
    return this.viewOf(prospect);
  }

  /** « Arrêter les relances »: nothing more is sent; the state stays. */
  public async stop(actor: AuthenticatedStaff, id: string) {
    const current = await this.getOrThrow(id);
    const prospect = await prisma.prospect.update({ where: { id }, data: { nextSendAt: null, stoppedAt: current.stoppedAt ?? new Date() } });
    await this.record(actor, 'prospect.stopped', 'prospect', id, {});
    return this.viewOf(prospect);
  }

  // ---- Sending -----------------------------------------------------------------------------------------------------

  /**
   * « Envoyer à N prospects »: enrolls the chosen prospects still to contact (never one already in the sequence, closed
   * or opted out) and sends them the first email now, within today's cap; the others wait for the next sending window.
   * The follow-ups then leave by themselves (runDue).
   */
  public async sendNow(actor: AuthenticatedStaff, ids: unknown, now = new Date()) {
    if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string')) throw new ValidationException({ ids: 'required' });
    if (ids.length > 500) throw new ValidationException({ ids: 'too_many' });
    this.assertConfigured();
    const wanted = [...new Set(ids as string[])];
    const rows = await prisma.prospect.findMany({ where: { id: { in: wanted } }, select: { id: true, email: true, status: true, step: true } });
    const hashes = new Set(
      (
        await prisma.prospectSuppression.findMany({
          where: { emailHash: { in: rows.map(r => suppressionHash(r.email)) } },
          select: { emailHash: true },
        })
      ).map(s => s.emailHash),
    );
    const eligible = rows.filter(r => r.status === 'to_contact' && r.step === 0 && !hashes.has(suppressionHash(r.email))).map(r => r.id);
    const skipped = wanted.length - eligible.length;
    if (!eligible.length) {
      return { enrolled: 0, sent: 0, failed: 0, queued: 0, skipped, nextOpening: null };
    }
    const { steps, dailyCap } = await this.loadSettings();
    const remaining = remainingToday(dailyCap, await this.sentToday(now));
    // Beyond today's cap: the next working day's opening.
    const tomorrow = dayBounds(addDays(localDate(now, PROSPECTING_TZ), 1), PROSPECTING_TZ).start;
    const later = nextWindowStart(tomorrow);
    const nowIds = eligible.slice(0, Math.min(remaining, PASS_LIMIT));
    const queuedIds = eligible.slice(nowIds.length);
    // Over the pass limit but within the cap: the next pass (inside the window) takes them.
    const withinCap = eligible.slice(nowIds.length, remaining);
    await prisma.$transaction([
      prisma.prospect.updateMany({
        where: { id: { in: nowIds }, status: 'to_contact', step: 0 },
        data: { nextSendAt: now, stoppedAt: null, failedAttempts: 0, enrolledById: actor.id },
      }),
      prisma.prospect.updateMany({
        where: { id: { in: withinCap }, status: 'to_contact', step: 0 },
        data: { nextSendAt: nextWindowStart(now), stoppedAt: null, failedAttempts: 0, enrolledById: actor.id },
      }),
      prisma.prospect.updateMany({
        where: { id: { in: queuedIds.filter(id => !withinCap.includes(id)) }, status: 'to_contact', step: 0 },
        data: { nextSendAt: later, stoppedAt: null, failedAttempts: 0, enrolledById: actor.id },
      }),
    ]);
    const claimed = await this.claim(now, nowIds.length, nowIds);
    let sent = 0;
    let failed = 0;
    for (const id of claimed) {
      const outcome = await this.sendOne(id, now, steps);
      if (outcome === 'sent') sent += 1;
      if (outcome === 'failed') failed += 1;
    }
    const queued = eligible.length - sent - failed;
    await this.record(actor, 'prospecting.sent', 'prospect', undefined, { chosen: wanted.length, enrolled: eligible.length, sent, failed, queued });
    logger.info(`[Prospecting] send now: ${eligible.length} enrolled, ${sent} sent, ${failed} failed, ${queued} queued, ${skipped} skipped`);
    return {
      enrolled: eligible.length,
      sent,
      failed,
      queued,
      skipped,
      nextOpening: queued ? (withinCap.length ? nextWindowStart(now) : later).toISOString() : null,
    };
  }

  /**
   * The pass of the 15-minute scheduler: inside the window and under today's cap, the steps due now. Each prospect is
   * claimed first (sendingAt, FOR UPDATE SKIP LOCKED): two passes at once never send the same email twice.
   */
  public async runDue(now = new Date()) {
    if (!this.configured()) return { configured: false, window: inSendingWindow(now), sent: 0, failed: 0, finished: 0, remaining: 0 };
    if (!inSendingWindow(now)) return { configured: true, window: false, sent: 0, failed: 0, finished: 0, remaining: 0 };
    const { steps, dailyCap } = await this.loadSettings();
    const remaining = remainingToday(dailyCap, await this.sentToday(now));
    const result = { configured: true, window: true, sent: 0, failed: 0, finished: 0, remaining };
    if (!remaining) return result;
    const claimed = await this.claim(now, Math.min(remaining, PASS_LIMIT));
    for (const id of claimed) {
      const outcome = await this.sendOne(id, now, steps);
      if (outcome === 'sent') result.sent += 1;
      if (outcome === 'failed') result.failed += 1;
      if (outcome === 'finished') result.finished += 1;
    }
    result.remaining = remaining - result.sent;
    if (claimed.length) logger.info(`[Prospecting] pass: ${JSON.stringify(result)}`);
    return result;
  }

  /** Claims up to `limit` prospects due at `now` (only among `ids` when given); returns their ids. */
  private async claim(now: Date, limit: number, ids?: string[]): Promise<string[]> {
    if (limit <= 0 || (ids && !ids.length)) return [];
    const stale = new Date(now.getTime() - CLAIM_TIMEOUT_MINUTES * 60000);
    const only = ids ? Prisma.sql`AND "id" = ANY(${ids}::text[])` : Prisma.empty;
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      UPDATE "prospects" SET "sendingAt" = ${now}
      WHERE "id" IN (
        SELECT "id" FROM "prospects"
        WHERE "nextSendAt" <= ${now} AND "status" IN ('to_contact', 'contacted') AND "stoppedAt" IS NULL
          AND ("sendingAt" IS NULL OR "sendingAt" < ${stale}) ${only}
        ORDER BY "nextSendAt" ASC, "id" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id"`;
    return rows.map(r => r.id);
  }

  private async replyToFor(prospect: Prospect): Promise<string | null> {
    const env = prospectingSettings().replyTo;
    if (env) return env;
    if (!prospect.enrolledById) return null;
    const staff = await prisma.staff.findUnique({ where: { id: prospect.enrolledById }, select: { email: true } });
    return staff?.email ?? null;
  }

  private headers(prospectId: string, replyTo: string | null): Record<string, string> {
    const url = this.unsubscribeUrl(prospectId);
    const mailto = replyTo ? `, <mailto:${replyTo}?subject=${encodeURIComponent('Ne plus recevoir de messages')}>` : '';
    return { 'List-Unsubscribe': `<${url}>${mailto}`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' };
  }

  /** Sends the next step to one claimed prospect, records it and schedules the following one. */
  private async sendOne(id: string, now: Date, steps: SequenceStep[]): Promise<SendOutcome> {
    const prospect = await prisma.prospect.findUnique({ where: { id } });
    const release = () => prisma.prospect.updateMany({ where: { id, sendingAt: now }, data: { sendingAt: null } });
    if (!prospect || isClosed(prospect.status) || prospect.stoppedAt) {
      await release();
      return 'skipped';
    }
    if (await this.isSuppressed(prospect.email)) {
      await prisma.prospect.update({ where: { id }, data: { status: 'unsubscribed', nextSendAt: null, stoppedAt: now, sendingAt: null } });
      return 'skipped';
    }
    const step = nextStep(steps, prospect.step);
    if (!step) {
      await prisma.prospect.update({ where: { id }, data: { nextSendAt: null, sendingAt: null } });
      return 'finished';
    }
    const sender = this.sender()!;
    const names = await this.airportNames([prospect.airportCode]);
    const replyTo = await this.replyToFor(prospect);
    const message = prospectEmail({
      productName: PRODUCT_NAME,
      company: PRODUCT_COMPANY,
      senderName: sender.name,
      senderPhone: prospectingSettings().phone,
      step,
      values: templateValues(prospect, prospect.airportCode ? (names.get(prospect.airportCode) ?? null) : null),
      unsubscribeUrl: this.unsubscribeUrl(id),
    });
    const name = [prospect.contactFirstName, prospect.contactLastName].filter(Boolean).join(' ');
    const result = await this.notifications.emailProspect({ email: prospect.email, ...(name ? { name } : {}) }, message, {
      sender,
      replyTo,
      headers: this.headers(id, replyTo),
      tag: `${TAG}_step${step.step}`,
      about: `prospect ${id}`,
    });

    if (result.ok) {
      const firstContactedAt = prospect.firstContactedAt ?? now;
      const following = nextStep(steps, step.step);
      const nextSendAt = following ? followUpDueAt(firstContactedAt, following.delayDays, new Date(now.getTime() + 24 * 3600 * 1000)) : null;
      await prisma.$transaction(async tx => {
        await tx.prospectMessage.create({
          data: {
            prospectId: id,
            step: step.step,
            subject: message.subject.slice(0, 300),
            sentAt: now,
            providerMessageId: result.messageId,
            status: 'sent',
          },
        });
        const base = { step: step.step, firstContactedAt, lastContactedAt: now, failedAttempts: 0, sendingAt: null };
        // A reply or an opt-out recorded while the email was leaving wins: no follow-up is scheduled.
        const still = await tx.prospect.updateMany({
          where: { id, status: { in: OPEN_STATUSES }, stoppedAt: null },
          data: { ...base, status: 'contacted', nextSendAt },
        });
        if (!still.count) await tx.prospect.update({ where: { id }, data: { ...base, nextSendAt: null } });
      });
      return 'sent';
    }

    const attempts = prospect.failedAttempts + 1;
    const giveUp = attempts >= MAX_FAILED_ATTEMPTS;
    await prisma.$transaction([
      prisma.prospectMessage.create({
        data: {
          prospectId: id,
          step: step.step,
          subject: message.subject.slice(0, 300),
          sentAt: now,
          status: 'failed',
          error: result.status ? `http_${result.status}` : 'no_answer',
        },
      }),
      prisma.prospect.updateMany({
        where: { id, status: { in: OPEN_STATUSES } },
        data: {
          failedAttempts: attempts,
          sendingAt: null,
          ...(giveUp ? { nextSendAt: null, stoppedAt: now } : { nextSendAt: nextWindowStart(new Date(now.getTime() + RETRY_AFTER_MINUTES * 60000)) }),
        },
      }),
    ]);
    return 'failed';
  }

  /** « M'envoyer un test »: one step (saved, or as typed in the editor) to the admin's own address; not counted in the cap. */
  public async sendTest(actor: AuthenticatedStaff, input: { step?: unknown; prospectId?: unknown; subject?: unknown; body?: unknown }) {
    const n = input.step ?? 1;
    if (n !== 1 && n !== 2 && n !== 3) throw new ValidationException({ step: 'invalid' });
    this.assertConfigured();
    if (!actor.email) throw new HttpException(httpStatus.CONFLICT, 'No address to send the test to', 'no_email');
    const { steps } = await this.loadSettings();
    const saved = steps[n - 1];
    const subject = typeof input.subject === 'string' && input.subject.trim() ? input.subject.trim().slice(0, 150) : saved.subject;
    const body = typeof input.body === 'string' && input.body.trim() ? input.body.trim().slice(0, 5000) : saved.body;
    let values = SAMPLE_VALUES;
    if (typeof input.prospectId === 'string' && input.prospectId) {
      const prospect = await this.getOrThrow(input.prospectId);
      const names = await this.airportNames([prospect.airportCode]);
      values = templateValues(prospect, prospect.airportCode ? (names.get(prospect.airportCode) ?? null) : null);
    }
    const sender = this.sender()!;
    const message = prospectEmail({
      productName: PRODUCT_NAME,
      company: PRODUCT_COMPANY,
      senderName: sender.name,
      senderPhone: prospectingSettings().phone,
      step: { subject, body },
      values,
      unsubscribeUrl: this.notifications.siteUrl('/api/public/prospecting/unsubscribe/test') ?? '',
    });
    const result = await this.notifications.emailProspect(
      { email: actor.email },
      { ...message, subject: `[Test] ${message.subject}` },
      { sender, replyTo: null, headers: {}, tag: `${TAG}_test`, about: `staff ${actor.id}` },
    );
    if (!result.ok) throw new HttpException(httpStatus.BAD_GATEWAY, 'The test email was refused', 'email_failed');
    return { sentTo: actor.email };
  }

  // ---- Opt-out (public) --------------------------------------------------------------------------------------------

  /** The prospect behind a link, or null when the link is not valid. */
  public async unsubscribeState(token: string): Promise<{ id: string; unsubscribed: boolean } | null> {
    const id = this.verifyToken(token);
    if (!id) return null;
    const prospect = await prisma.prospect.findUnique({ where: { id }, select: { status: true } });
    // A valid link of a prospect since deleted: nothing more will be sent to it anyway.
    return { id, unsubscribed: !prospect || prospect.status === 'unsubscribed' };
  }

  /** The opt-out link (and the one-click POST of RFC 8058): never contacted again, even if re-imported. Idempotent. */
  public async unsubscribe(token: string, now = new Date()): Promise<boolean> {
    const id = this.verifyToken(token);
    if (!id) return false;
    const prospect = await prisma.prospect.findUnique({ where: { id }, select: { email: true, status: true, stoppedAt: true } });
    if (!prospect) return true;
    const emailHash = suppressionHash(prospect.email);
    await prisma.$transaction([
      prisma.prospectSuppression.upsert({ where: { emailHash }, create: { emailHash }, update: {} }),
      prisma.prospect.update({ where: { id }, data: { status: 'unsubscribed', nextSendAt: null, stoppedAt: prospect.stoppedAt ?? now } }),
    ]);
    if (prospect.status !== 'unsubscribed') logger.info(`[Prospecting] prospect ${id} unsubscribed`);
    return true;
  }

  // ---- Retention ---------------------------------------------------------------------------------------------------

  /** Deletes the prospects last contacted (or created, if never contacted) more than 3 years ago. The opt-outs stay. */
  public async purge(now = new Date()): Promise<number> {
    const cutoff = retentionCutoff(now);
    const { count } = await prisma.prospect.deleteMany({
      where: { OR: [{ lastContactedAt: { lt: cutoff } }, { lastContactedAt: null, createdAt: { lt: cutoff } }] },
    });
    return count;
  }
}
