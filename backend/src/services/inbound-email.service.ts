import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { INBOUND_EMAIL_DOMAIN, inboundEmailAvailable } from '@/config';
import prisma, { InboundEmailStatus, Prisma } from '@/database';
import { MIN_CONFIDENCE, ReadingMeta, toParsedBooking } from '@/domain/email-reading';
import { IMPORT_SENDERS, parseConfirmationEmail, ParsedBooking } from '@/domain/importers';
import { alloparkPageUrls } from '@/domain/importers/allopark-page';
import {
  forwardingConfirmationOf,
  InboundItem,
  InboundPayload,
  inboundSlugOf,
  recipientsOf,
  REQUIRED_FOR_IMPORT,
  textOf,
} from '@/domain/inbound-email';
import { fullName } from '@/domain/staff-name';
import { can } from '@/domain/roles';
import { HttpException } from '@/utils/httpException';
import { allocateInboundSlug } from './inbound-slug';
import { AlloparkPageService } from './allopark-page.service';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { EmailReadingService } from './email-reading.service';
import { ReservationService } from './reservation.service';

/** The email's text is kept this long for "À vérifier", then cleared; the row itself goes after 90 days. */
const TEXT_RETENTION_DAYS = 30;
const ROW_RETENTION_DAYS = 90;
/** What the settings block counts: the last 30 days. */
const COUNT_WINDOW_DAYS = 30;
const TEXT_MAX_CHARS = 20000;
/** Gmail's confirmation code is shown in the setup wizard this long. */
const FORWARDING_SHOWN_DAYS = 7;
/** "Ce que Plazo a reçu" in the wizard's last step. */
const RECENT_SHOWN = 5;

export interface InboundSettings {
  /** False when the platform has no inbound domain or secret: the block explains it. */
  available: boolean;
  /** "lys-demo-7f3a@plazo.fr": every operator has one from its creation (08/10/2026); null only when the platform has no domain. */
  address: string | null;
  lastReceivedAt: string | null;
  counts: Record<InboundEmailStatus, number>;
  /** Emails waiting for the staff (incomplete or unrecognised). */
  toCheck: number;
  /** G-B: the comparators' sender addresses, for the forwarding rule. */
  senders: { provider: string; address: string }[];
  /** G-B: Gmail's latest forwarding confirmation (7 days): its code typed back in Gmail, or its acceptance link. */
  forwarding: { provider: 'gmail'; code: string | null; link: string | null; requester: string | null; receivedAt: string } | null;
  /** G-B: the last emails received, newest first, for the wizard's check step. */
  recent: InboundRecent[];
}

export interface InboundRecent {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  provider: string | null;
  reservationReference: string | null;
  receivedAt: string;
}

export interface InboundEmailView {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  textBody: string | null;
  provider: string | null;
  parsed: ParsedBooking | null;
  missing: string[];
  reservationId: string | null;
  reservationReference: string | null;
  /** L-A (08/10/2026): what Claude made of the email; null when it was not read. */
  reading: ReadingMeta | null;
  receivedAt: string;
}

const TO_CHECK: InboundEmailStatus[] = ['incomplete', 'unrecognised'];

/**
 * M-A « Boîte de réception » (08/10/2026): the three tabs of the inbox. `todo` = waiting for the staff (every row);
 * `done` = imported, duplicate, handled (or the deprecated dismissed) of the last 30 days; `archived` = the last 90 days.
 * Gmail's forwarding confirmations are never listed.
 */
export type InboundView = 'todo' | 'done' | 'archived';
export const INBOUND_VIEWS: InboundView[] = ['todo', 'done', 'archived'];
const DONE_STATUSES: InboundEmailStatus[] = ['imported', 'duplicate', 'handled', 'dismissed'];
/** T-A: « Marquer comme traité » applies to these; `imported` stays imported, `archived` refuses, `forwarding` is unknown. */
const HANDLEABLE: InboundEmailStatus[] = ['incomplete', 'unrecognised', 'duplicate', 'dismissed'];
const DONE_WINDOW_DAYS = COUNT_WINDOW_DAYS;

/** The tab a status lives in (forwarding confirmations are in none: the caller gets an empty list). */
function viewOfStatus(status: InboundEmailStatus): InboundView {
  if (TO_CHECK.includes(status)) return 'todo';
  return status === 'archived' ? 'archived' : 'done';
}
const ARCHIVED_WINDOW_DAYS = ROW_RETENTION_DAYS;
const LIST_MAX = 100;

export interface InboundEmailList {
  data: InboundEmailView[];
  counts: Record<InboundView, number>;
}

/**
 * M-A (06/10/2026): the operator's mailbox forwards the comparators' confirmations to
 * <slug>@<INBOUND_EMAIL_DOMAIN>; the Cloudflare relay (email-worker/) posts each email here; the importers read it and the booking is
 * created at once, or the email waits in "À vérifier" for the staff.
 */
@Service()
export class InboundEmailService {
  public reservations = Container.get(ReservationService);
  public audit = Container.get(AuditService);
  public reader = Container.get(EmailReadingService);
  public alloparkPage = Container.get(AlloparkPageService);

  /** The relay's webhook: every item is handled on its own; the answer is always 200 so the relay does not resend it. */
  public async receive(payload: InboundPayload): Promise<{ received: number; imported: number; toCheck: number; ignored: number }> {
    const result = { received: 0, imported: 0, toCheck: 0, ignored: 0 };
    for (const item of payload.items ?? []) {
      result.received += 1;
      const outcome = await this.receiveItem(item);
      if (outcome === 'ignored') result.ignored += 1;
      else if (outcome === 'imported') result.imported += 1;
      else if (TO_CHECK.includes(outcome)) result.toCheck += 1;
    }
    return result;
  }

  /** One email of the relay's payload: stored with what became of it. */
  private async receiveItem(item: InboundItem): Promise<InboundEmailStatus | 'ignored'> {
    const slug = inboundSlugOf(recipientsOf(item), INBOUND_EMAIL_DOMAIN);
    if (!slug) return 'ignored';
    const operator = await prisma.operator.findUnique({ where: { inboundSlug: slug }, select: { id: true, status: true } });
    if (!operator || operator.status !== 'active') return 'ignored';
    const text = textOf(item).slice(0, TEXT_MAX_CHARS);
    const fromAddress = item.From?.Address?.trim().toLowerCase().slice(0, 200) || null;
    // G-B: Gmail asks the Plazo address to confirm the forwarding; the code is shown in the setup wizard.
    const confirmation = forwardingConfirmationOf({ from: fromAddress, subject: item.Subject ?? null, text });
    if (confirmation) {
      await prisma.inboundEmail.create({
        data: {
          operatorId: operator.id,
          status: 'forwarding',
          fromAddress,
          fromName: item.From?.Name?.trim().slice(0, 120) || null,
          subject: item.Subject?.trim().slice(0, 200) || null,
          provider: confirmation.provider,
          parsed: { code: confirmation.code, link: confirmation.link, requester: confirmation.requester },
        },
      });
      return 'forwarding';
    }
    const base = {
      operatorId: operator.id,
      fromAddress,
      fromName: item.From?.Name?.trim().slice(0, 120) || null,
      subject: item.Subject?.trim().slice(0, 200) || null,
      textBody: text || null,
    };
    let parsed = text ? parseConfirmationEmail(text) : null;
    // 10/10/2026: Allopark's emails leave « Vos informations » blank (plate, phone, name…); the booking page they link to
    // shows them, so it is opened before Claude is asked anything.
    if (parsed?.provider === 'Allopark' && parsed.externalReference && missingForImport(parsed).length) {
      parsed = await this.withAlloparkPage(parsed, parsed.externalReference, item);
    }
    // L-A (08/10/2026): what no importer knows, Claude reads; its answer is kept on the row for the inbox. Since
    // 09/10/2026 Claude also completes a confirmation an importer recognised but could not read in full (a comparator
    // that changed its layout, a detail in a part of the email the importer does not look at): the importer's fields
    // stay, Claude only fills the gaps.
    let reading: ReadingMeta | null = null;
    let unsure = false;
    const gaps = parsed ? missingForImport(parsed) : [];
    if ((!parsed || gaps.length) && text && this.reader.available()) {
      const timezone = await this.timezoneOf(operator.id);
      const result = await this.reader.read({ from: fromAddress, fromName: base.fromName, subject: base.subject, text, timezone });
      if (result) {
        const { kind, provider, confidence, summary } = result.reading;
        reading = { kind, provider, confidence, summary, model: result.model };
        if (kind === 'booking') {
          const read = toParsedBooking(result.reading);
          const filled = parsed ? fillGaps(parsed, read) : read;
          // An unsure reading only matters for what it brought.
          unsure = confidence < MIN_CONFIDENCE && (!parsed || gaps.some(key => filled[key] !== undefined));
          parsed = filled;
        }
      }
    }
    const withReading = { ...base, ...(reading ? { reading: reading as unknown as Prisma.InputJsonValue } : {}) };
    if (!parsed) {
      // A cancellation, a modification or another kind of mail: shown with Claude's summary, nothing done by itself.
      await prisma.inboundEmail.create({ data: { ...withReading, status: 'unrecognised' } });
      return 'unrecognised';
    }
    const booking = parsed;
    const missing: string[] = missingForImport(booking);
    // An unsure reading waits for a human eye even when every field is there.
    if (unsure) missing.push('confidence');
    const parsedJson = booking as unknown as Prisma.InputJsonValue;
    if (missing.length) {
      await prisma.inboundEmail.create({ data: { ...withReading, status: 'incomplete', provider: booking.provider, parsed: parsedJson, missing } });
      return 'incomplete';
    }
    try {
      const created = await this.reservations.createFromImport(operator.id, booking);
      await prisma.inboundEmail.create({
        data: {
          ...withReading,
          status: created.duplicate ? 'duplicate' : 'imported',
          provider: booking.provider,
          parsed: parsedJson,
          reservationId: created.reservation.id,
        },
      });
      return created.duplicate ? 'duplicate' : 'imported';
    } catch (error) {
      // Dates the importer misread, a stay too long…: the staff read the email themselves.
      logger.warn(`[Inbound] Email for ${operator.id} not imported: ${error instanceof Error ? error.message : String(error)}`);
      await prisma.inboundEmail.create({
        data: {
          ...withReading,
          status: 'incomplete',
          provider: booking.provider,
          parsed: parsedJson,
          missing: [error instanceof HttpException ? error.code || 'error' : 'error'],
        },
      });
      return 'incomplete';
    }
  }

  /**
   * An Allopark email completed by its booking page: the email's link (else the page of each address it was sent to,
   * the parking's mailbox), read for the fields the email left blank; the page's form names the customer, where the
   * email only greets them (« Bonjour Jean Dupont, »). Unchanged when no page answers for this booking.
   */
  private async withAlloparkPage(found: ParsedBooking, reference: string, item: InboundItem): Promise<ParsedBooking> {
    const urls = alloparkPageUrls({
      html: item.RawHtmlBody,
      text: item.RawTextBody,
      reference,
      addresses: [...(item.To ?? []), ...(item.Cc ?? [])].map(address => address?.Address ?? ''),
      excludeDomain: INBOUND_EMAIL_DOMAIN,
    });
    const page = urls.length ? await this.alloparkPage.booking(urls, reference) : null;
    if (!page) return found;
    const completed = fillGaps(found, page);
    if (page.customerFirstName || page.customerLastName) {
      for (const key of NAME_KEYS) {
        if (page[key]) completed[key] = page[key];
        else delete completed[key];
      }
    }
    return completed;
  }

  /** The timezone Claude expresses the local times in: the operator's first parking's. */
  private async timezoneOf(operatorId: string): Promise<string> {
    const parking = await prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' }, select: { timezone: true } });
    return parking?.timezone ?? 'Europe/Paris';
  }

  public async settings(actor: AuthenticatedStaff): Promise<InboundSettings> {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { inboundSlug: true } });
    const since = new Date(Date.now() - COUNT_WINDOW_DAYS * 86400000);
    const [grouped, last, toCheck, forwarding, recent] = await Promise.all([
      prisma.inboundEmail.groupBy({ by: ['status'], where: { operatorId: actor.operatorId, receivedAt: { gte: since } }, _count: { _all: true } }),
      prisma.inboundEmail.findFirst({ where: { operatorId: actor.operatorId }, orderBy: { receivedAt: 'desc' }, select: { receivedAt: true } }),
      prisma.inboundEmail.count({ where: { operatorId: actor.operatorId, status: { in: TO_CHECK } } }),
      prisma.inboundEmail.findFirst({
        where: { operatorId: actor.operatorId, status: 'forwarding', receivedAt: { gte: new Date(Date.now() - FORWARDING_SHOWN_DAYS * 86400000) } },
        orderBy: { receivedAt: 'desc' },
        select: { parsed: true, receivedAt: true },
      }),
      prisma.inboundEmail.findMany({
        where: { operatorId: actor.operatorId },
        include: { reservation: { select: { reference: true } } },
        orderBy: { receivedAt: 'desc' },
        take: RECENT_SHOWN,
      }),
    ]);
    const counts = Object.fromEntries(Object.values(InboundEmailStatus).map(status => [status, 0])) as Record<InboundEmailStatus, number>;
    for (const g of grouped) counts[g.status] = g._count._all;
    const available = inboundEmailAvailable();
    return {
      available,
      address: available && operator.inboundSlug ? `${operator.inboundSlug}@${INBOUND_EMAIL_DOMAIN}` : null,
      lastReceivedAt: last?.receivedAt.toISOString() ?? null,
      counts,
      toCheck,
      senders: IMPORT_SENDERS,
      forwarding: forwardingView(forwarding),
      recent: recent.map(r => ({
        id: r.id,
        status: r.status,
        fromAddress: r.fromAddress,
        fromName: r.fromName,
        subject: r.subject,
        provider: r.provider,
        reservationReference: r.reservation?.reference ?? null,
        receivedAt: r.receivedAt.toISOString(),
      })),
    };
  }

  /**
   * The manager asks for a new address (the old one stops working). Without `regenerate`, the address is simply
   * returned: every operator has one from its creation (08/10/2026); only an operator created before gets it here.
   */
  public async enableAddress(actor: AuthenticatedStaff, options: { regenerate?: boolean } = {}): Promise<InboundSettings> {
    this.require(actor, 'parking:manage');
    if (!inboundEmailAvailable()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Inbound email is not configured', 'inbound_unavailable');
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { slug: true, inboundSlug: true } });
    if (!operator.inboundSlug || options.regenerate) {
      const slug = await allocateInboundSlug(prisma, operator.slug);
      await prisma.operator.update({ where: { id: actor.operatorId }, data: { inboundSlug: slug } });
      await this.audit.record(actor, {
        action: options.regenerate ? 'inbound.address_regenerated' : 'inbound.address_enabled',
        entityType: 'operator',
        entityId: actor.operatorId,
      });
    }
    return this.settings(actor);
  }

  /**
   * The inbox (M-A, 08/10/2026): one tab (`view`, `todo` by default) newest first, with the three tabs' counts;
   * `status` narrows the tab's rows to one status (the older filter).
   */
  public async list(actor: AuthenticatedStaff, filter: { view?: InboundView; status?: InboundEmailStatus } = {}): Promise<InboundEmailList> {
    this.require(actor, 'reservations:manage');
    // A bare ?status= looks in the tab that holds it (an "imported" filter would find nothing in « À traiter »).
    const view = filter.view ?? (filter.status ? viewOfStatus(filter.status) : 'todo');
    const now = Date.now();
    const scope: Record<InboundView, Prisma.InboundEmailWhereInput> = {
      todo: { status: { in: TO_CHECK } },
      done: { status: { in: DONE_STATUSES }, receivedAt: { gte: new Date(now - DONE_WINDOW_DAYS * 86400000) } },
      archived: { status: 'archived', receivedAt: { gte: new Date(now - ARCHIVED_WINDOW_DAYS * 86400000) } },
    };
    const where = (v: InboundView): Prisma.InboundEmailWhereInput => ({ operatorId: actor.operatorId, ...scope[v] });
    // Gmail's forwarding confirmations belong to the setup wizard, never to the inbox.
    const listed: Prisma.InboundEmailWhereInput | null =
      filter.status === 'forwarding' ? null : filter.status ? { AND: [where(view), { status: filter.status }] } : where(view);
    const [rows, todo, done, archived] = await Promise.all([
      listed
        ? prisma.inboundEmail.findMany({
            where: listed,
            include: { reservation: { select: { reference: true } } },
            orderBy: { receivedAt: 'desc' },
            take: LIST_MAX,
          })
        : [],
      prisma.inboundEmail.count({ where: where('todo') }),
      prisma.inboundEmail.count({ where: where('done') }),
      prisma.inboundEmail.count({ where: where('archived') }),
    ]);
    return { data: rows.map(r => this.view(r)), counts: { todo, done, archived } };
  }

  /**
   * T-A « Marquer comme traité »: the email was dealt with, with or without a booking. `imported` stays as it is
   * (a booking is its proof); an archived email refuses (409 `archived`); the text stays until the purge.
   */
  public async handle(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id);
    if (row.status === 'archived') throw new HttpException(httpStatus.CONFLICT, 'This email is archived', 'archived');
    if (HANDLEABLE.includes(row.status)) {
      await prisma.inboundEmail.update({ where: { id }, data: { status: 'handled' } });
      await this.audit.record(actor, { action: 'inbound.handled', entityType: 'inbound_email', entityId: id });
      return this.view({ ...row, status: 'handled' });
    }
    return this.view(row);
  }

  /** Deprecated alias of handle() (« Classer sans suite » until the 08/10/2026). */
  public async dismiss(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    return this.handle(actor, id);
  }

  /** T-A « Archiver »: out of the inbox, still readable in « Archivés » until the purge; not a forwarding confirmation (409). */
  public async archive(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id, { includeForwarding: true });
    if (row.status === 'forwarding') throw new HttpException(httpStatus.CONFLICT, 'A forwarding confirmation cannot be archived', 'forwarding');
    if (row.status !== 'archived') {
      await prisma.inboundEmail.update({ where: { id }, data: { status: 'archived' } });
      await this.audit.record(actor, { action: 'inbound.archived', entityType: 'inbound_email', entityId: id });
    }
    return this.view({ ...row, status: 'archived' });
  }

  /** Links an email to the booking the staff typed from it (the "Compléter" flow). */
  public async attach(actor: AuthenticatedStaff, id: string, reservationId: string): Promise<void> {
    this.require(actor, 'reservations:manage');
    const row = await prisma.inboundEmail.findFirst({ where: { id, operatorId: actor.operatorId }, select: { id: true } });
    const booking = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId }, select: { id: true } });
    if (!row || !booking) throw new HttpException(httpStatus.NOT_FOUND, 'Not found', 'not_found');
    await prisma.inboundEmail.update({ where: { id }, data: { status: 'imported', reservationId, textBody: null } });
  }

  /** Nightly: the text after 30 days, the rows after 90. */
  public async purge(now = new Date()): Promise<{ textsCleared: number; rowsDeleted: number }> {
    const { count: textsCleared } = await prisma.inboundEmail.updateMany({
      where: { receivedAt: { lt: new Date(now.getTime() - TEXT_RETENTION_DAYS * 86400000) }, textBody: { not: null } },
      data: { textBody: null },
    });
    const { count: rowsDeleted } = await prisma.inboundEmail.deleteMany({
      where: { receivedAt: { lt: new Date(now.getTime() - ROW_RETENTION_DAYS * 86400000) } },
    });
    return { textsCleared, rowsDeleted };
  }

  /** Emails waiting for the staff, for the dashboard. */
  public async toCheckCount(operatorId: string): Promise<number> {
    return prisma.inboundEmail.count({ where: { operatorId, status: { in: TO_CHECK } } });
  }

  /** The operator's email with its booking's reference; a forwarding confirmation is unknown to the inbox unless asked for. */
  private async find(actor: AuthenticatedStaff, id: string, options: { includeForwarding?: boolean } = {}): Promise<InboundRow> {
    const row = await prisma.inboundEmail.findFirst({
      where: { id, operatorId: actor.operatorId, ...(options.includeForwarding ? {} : { status: { not: 'forwarding' } }) },
      include: { reservation: { select: { reference: true } } },
    });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'Email not found', 'not_found');
    return row;
  }

  private view(r: InboundRow): InboundEmailView {
    return {
      id: r.id,
      status: r.status,
      fromAddress: r.fromAddress,
      fromName: r.fromName,
      subject: r.subject,
      textBody: r.textBody,
      provider: r.provider,
      parsed: (r.parsed as unknown as ParsedBooking | null) ?? null,
      missing: Array.isArray(r.missing) ? (r.missing as string[]) : [],
      reservationId: r.reservationId,
      reservationReference: r.reservation?.reference ?? null,
      reading: readingOf(r.reading),
      receivedAt: r.receivedAt.toISOString(),
    };
  }

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
  }
}

type InboundRow = {
  id: string;
  status: InboundEmailStatus;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  textBody: string | null;
  provider: string | null;
  parsed: Prisma.JsonValue | null;
  missing: Prisma.JsonValue | null;
  reading: Prisma.JsonValue | null;
  reservationId: string | null;
  receivedAt: Date;
  reservation: { reference: string } | null;
};

/** The reading as stored, or null for a row written before L-A or never read. */
function readingOf(value: Prisma.JsonValue | null): ReadingMeta | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  if (typeof v.kind !== 'string') return null;
  return {
    kind: v.kind as ReadingMeta['kind'],
    provider: typeof v.provider === 'string' ? v.provider : null,
    confidence: typeof v.confidence === 'number' ? v.confidence : 0,
    summary: typeof v.summary === 'string' ? v.summary : '',
    model: typeof v.model === 'string' ? v.model : '',
  };
}

function forwardingView(row: { parsed: Prisma.JsonValue | null; receivedAt: Date } | null): InboundSettings['forwarding'] {
  const parsed = row?.parsed as { code?: unknown; link?: unknown; requester?: unknown } | null | undefined;
  const code = typeof parsed?.code === 'string' ? parsed.code : null;
  const link = typeof parsed?.link === 'string' ? parsed.link : null;
  if (!row || (!code && !link)) return null;
  return {
    provider: 'gmail',
    code,
    link,
    requester: typeof parsed?.requester === 'string' ? parsed.requester : null,
    receivedAt: row.receivedAt.toISOString(),
  };
}

/** The fields a booking still lacks before it can be created without staff. */
function missingForImport(booking: ParsedBooking): (typeof REQUIRED_FOR_IMPORT)[number][] {
  return REQUIRED_FOR_IMPORT.filter(key => !booking[key]);
}

const NAME_KEYS: readonly ('customerName' | 'customerFirstName' | 'customerLastName')[] = ['customerName', 'customerFirstName', 'customerLastName'];

/** An importer's reading completed by Claude's: every field the importer found stays, Claude's fill the empty ones. */
export function fillGaps(found: ParsedBooking, read: ParsedBooking): ParsedBooking {
  const filled: ParsedBooking = { ...found };
  for (const [key, value] of Object.entries(read) as [keyof ParsedBooking, ParsedBooking[keyof ParsedBooking]][]) {
    if (key === 'provider' || (NAME_KEYS as readonly string[]).includes(key) || value === undefined || value === null || value === '') continue;
    if (filled[key] === undefined || filled[key] === null || filled[key] === '') (filled as unknown as Record<string, unknown>)[key] = value;
  }
  // The name goes as a whole (09/10/2026): Claude's when the importer read none; Claude's first and last name apart
  // only when they rebuild the importer's name ("Claire Durand" read as one field by ParkMundo).
  const importerName = !!(found.customerName || found.customerFirstName || found.customerLastName);
  if (!importerName) {
    for (const key of NAME_KEYS) if (read[key]) filled[key] = read[key];
  } else if (found.customerName && !found.customerFirstName && !found.customerLastName && read.customerFirstName && read.customerLastName) {
    const same = (a: string) => a.trim().replace(/\s+/g, ' ').toLocaleLowerCase('fr');
    if (same(fullName(read.customerFirstName, read.customerLastName)) === same(found.customerName)) {
      filled.customerFirstName = read.customerFirstName;
      filled.customerLastName = read.customerLastName;
    }
  }
  return filled;
}
