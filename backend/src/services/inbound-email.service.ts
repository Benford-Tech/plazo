import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { INBOUND_EMAIL_DOMAIN, inboundEmailAvailable } from '@/config';
import prisma, { InboundEmailStatus, Prisma } from '@/database';
import { MIN_CONFIDENCE, ReadingMeta, toParsedBooking } from '@/domain/email-reading';
import { IMPORT_SENDERS, parseConfirmationEmail, ParsedBooking } from '@/domain/importers';
import { isCancellationOrChange } from '@/domain/importers/common';
import {
  alloparkConfirmationPage,
  alloparkLinks,
  alloparkPageAddresses,
  alloparkPageUrls,
  alloparkReferenceOf,
} from '@/domain/importers/allopark-page';
import {
  forwardingConfirmationOf,
  InboundItem,
  InboundPayload,
  inboundSlugOf,
  ownRecipientsOf,
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
  /** 10/10/2026: the last re-analysis asked by the staff; null when the email was only analysed at its reception. */
  analysedAt: string | null;
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

/**
 * 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): an email without booking can be analysed again, the same way
 * as at its reception; a second analysis of the same email within 30 s is refused (a double click never pays Claude
 * twice).
 */
const REANALYSIS_GAP_MS = 30_000;
export type ReanalysisOutcome = 'imported' | 'duplicate' | 'incomplete' | 'unrecognised';
export interface Reanalysis {
  email: InboundEmailView;
  outcome: ReanalysisOutcome;
}

/** What the analysis reads: the stored email, or the one just received. */
interface AnalysisInput {
  operatorId: string;
  text: string;
  fromAddress: string | null;
  fromName: string | null;
  subject: string | null;
  /** The email's allopark.com links (alloparkLinks) and own recipients (ownRecipientsOf). */
  links: string[];
  recipients: string[];
  /** A re-analysis: what the stored row says, so that the new analysis never knows less than the one before. */
  previous?: { parsed: ParsedBooking | null; missing: string[]; reading: ReadingMeta | null };
}

interface Analysis {
  status: ReanalysisOutcome;
  provider: string | null;
  parsed: ParsedBooking | null;
  missing: string[];
  reading: ReadingMeta | null;
  reservationId: string | null;
}

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
    // 10/10/2026: what a re-analysis needs that the text lost (the raw HTML is not stored); kept only while the email
    // waits for its booking.
    const forReanalysis = { recipients: ownRecipientsOf(item, INBOUND_EMAIL_DOMAIN), links: linksOf(item) };
    const analysis = await this.analyse({ ...base, ...forReanalysis, text });
    await prisma.inboundEmail.create({
      data: {
        ...base,
        ...(analysis.reservationId ? {} : forReanalysis),
        status: analysis.status,
        ...(analysis.reading ? { reading: analysis.reading as unknown as Prisma.InputJsonValue } : {}),
        ...(analysis.provider ? { provider: analysis.provider } : {}),
        ...(analysis.parsed ? { parsed: analysis.parsed as unknown as Prisma.InputJsonValue } : {}),
        ...(analysis.missing.length ? { missing: analysis.missing } : {}),
        ...(analysis.reservationId ? { reservationId: analysis.reservationId } : {}),
      },
    });
    return analysis.status;
  }

  /**
   * What an email says, and the booking it makes when it is complete: the importers, Allopark's booking page, then
   * Claude for what is still missing, then createFromImport. Shared by the reception and the re-analysis
   * (10/10/2026, « pouvoir relancer l'analyse d'un mail »); nothing is stored here but the booking.
   */
  private async analyse(input: AnalysisInput): Promise<Analysis> {
    const { operatorId, text, fromAddress, fromName, subject } = input;
    // 10/10/2026: a subject that announces a cancellation or a change (« Annulation de votre réservation AL-… ») is no
    // new booking either, whatever the text says.
    let parsed = text && !isCancellationOrChange(subject ?? '') ? parseConfirmationEmail(text) : null;
    // 10/10/2026: Allopark's emails leave « Vos informations » blank (plate, phone, name…); the booking page they link to
    // shows them, so it is opened before Claude is asked anything. Also for an Allopark email the importer did not
    // recognise (« Allopark » only in the sender, the reference only in the subject): the page then gives the booking.
    // Never for a cancellation or a change.
    const sender = [fromName, fromAddress].filter(Boolean).join(' ');
    const allopark = !parsed || parsed.provider === 'Allopark' ? alloparkReferenceOf({ text, subject, from: sender }) : null;
    if (allopark && (!parsed || missingForImport(parsed).length)) {
      parsed = await this.withAlloparkPage(operatorId, parsed, parsed?.externalReference ?? allopark, input);
    }
    // L-A (08/10/2026): what no importer knows, Claude reads; its answer is kept on the row for the inbox. Since
    // 09/10/2026 Claude also completes a confirmation an importer recognised but could not read in full (a comparator
    // that changed its layout, a detail in a part of the email the importer does not look at): the importer's fields
    // stay, Claude only fills the gaps.
    let reading: ReadingMeta | null = null;
    let unsure = false;
    const gaps = parsed ? missingForImport(parsed) : [];
    if ((!parsed || gaps.length) && text && this.reader.available()) {
      const timezone = await this.timezoneOf(operatorId);
      const result = await this.reader.read({ from: fromAddress, fromName, subject, text, timezone });
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
    // A re-analysis never knows less than the analysis before it: when Claude does not answer this time (no key, a
    // timeout, a refusal) or Allopark's page no longer does, the fields read then fill what is still blank; nothing of
    // it stays once Claude reads the email as something else than a booking.
    const before = input.previous?.parsed;
    if (before && (!reading || reading.kind === 'booking')) {
      const own = parsed;
      const merged = own ? fillGaps(own, before) : { ...before };
      const kept = !own || (Object.keys(merged) as (keyof ParsedBooking)[]).some(key => key !== 'provider' && !isSet(own[key]) && isSet(merged[key]));
      // The fields of an unsure reading stay unsure.
      if (input.previous!.missing.includes('confidence') && (!own || missingForImport(own).some(key => isSet(merged[key])))) unsure = true;
      // Claude's former reading stays with the fields it gave.
      if (kept && !reading) reading = input.previous!.reading;
      parsed = merged;
    }
    // A cancellation, a modification or another kind of mail: shown with Claude's summary, nothing done by itself.
    if (!parsed) return { status: 'unrecognised', provider: null, parsed: null, missing: [], reading, reservationId: null };
    const booking = parsed;
    const missing: string[] = missingForImport(booking);
    // An unsure reading waits for a human eye even when every field is there.
    if (unsure) missing.push('confidence');
    const found = { provider: booking.provider, parsed: booking, reading };
    if (missing.length) return { ...found, status: 'incomplete', missing, reservationId: null };
    try {
      const created = await this.reservations.createFromImport(operatorId, booking);
      return { ...found, status: created.duplicate ? 'duplicate' : 'imported', missing: [], reservationId: created.reservation.id };
    } catch (error) {
      // Dates the importer misread, a stay too long…: the staff read the email themselves.
      logger.warn(`[Inbound] Email for ${operatorId} not imported: ${error instanceof Error ? error.message : String(error)}`);
      return { ...found, status: 'incomplete', missing: [error instanceof HttpException ? error.code || 'error' : 'error'], reservationId: null };
    }
  }

  /**
   * An Allopark email completed by its booking page: the email's link, else the page of each candidate address (its
   * own recipients, the forwarded message's header, its sender, the Gmail boxes that forward to Plazo, the managers:
   * alloparkPageAddresses), read for the fields the email left blank; the page's form names the customer, where the
   * email only greets them (« Bonjour Jean Dupont, »). An email no importer recognised (`found` null) takes the page's
   * booking as it is. Unchanged when no page answers for this booking. Logged without any address, link or name
   * (10/10/2026): the reference, the link found or not, the pages tried, the fields filled.
   */
  private async withAlloparkPage(
    operatorId: string,
    found: ParsedBooking | null,
    reference: string,
    email: AnalysisInput,
  ): Promise<ParsedBooking | null> {
    const [requesters, managers] = await Promise.all([this.forwardingRequesters(operatorId), this.managerAddresses(operatorId)]);
    const addresses = alloparkPageAddresses(
      { recipients: email.recipients, text: email.text, from: email.fromAddress, requesters, managers },
      INBOUND_EMAIL_DOMAIN,
    );
    const urls = alloparkPageUrls({ links: email.links, reference, addresses, excludeDomain: INBOUND_EMAIL_DOMAIN });
    const label = `[Allopark] ${reference.trim().toUpperCase()}`;
    const linked = !!alloparkConfirmationPage(email.links, reference);
    logger.info(
      `${label}: ${found ? 'importer' : 'no importer'}, ${email.links.length} allopark.com link(s), confirmation link ${linked ? 'yes' : 'no'}, ${urls.length} page(s) to try`,
    );
    if (!urls.length) {
      logger.warn(`${label}: no booking page to open (no confirmation link, no candidate address)`);
      return found;
    }
    const page = await this.alloparkPage.booking(urls, reference);
    if (!page) {
      logger.warn(`${label}: no booking found on ${urls.length} page(s)`);
      return found;
    }
    const completed = found ? fillGaps(found, page) : { ...page };
    if (found && (page.customerFirstName || page.customerLastName)) {
      for (const key of NAME_KEYS) {
        if (page[key]) completed[key] = page[key];
        else delete completed[key];
      }
    }
    const filled = (Object.keys(completed) as (keyof ParsedBooking)[]).filter(key => key !== 'provider' && completed[key] !== found?.[key]);
    const still = missingForImport(completed);
    logger.info(`${label}: ${filled.length} field(s) filled from the booking page${still.length ? `, still missing: ${still.join(', ')}` : ''}`);
    return completed;
  }

  /** 10/10/2026: the addresses of the operator's active managers (the parking's mailbox is often theirs), oldest first. */
  private async managerAddresses(operatorId: string): Promise<string[]> {
    const managers = await prisma.staff.findMany({
      where: { operatorId, role: 'manager', isActive: true },
      orderBy: { createdAt: 'asc' },
      select: { email: true },
      take: 5,
    });
    return managers.map(m => m.email);
  }

  /** The Gmail addresses that asked to forward to the operator's Plazo address, newest first. */
  private async forwardingRequesters(operatorId: string): Promise<string[]> {
    const rows = await prisma.inboundEmail.findMany({
      where: { operatorId, status: 'forwarding' },
      orderBy: { receivedAt: 'desc' },
      select: { parsed: true },
      take: 20,
    });
    const requesters = rows.map(r => (r.parsed as { requester?: unknown } | null)?.requester);
    return [...new Set(requesters.filter((r): r is string => typeof r === 'string' && !!r.trim()).map(r => r.trim().toLowerCase()))];
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

  /**
   * 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): an email waiting or set aside is analysed again as at its
   * reception (importers, Allopark's booking page, Claude, the booking); typically an email received before the
   * Allopark page was read, or while Claude was unavailable. Refused for an email with a booking (409
   * `already_imported`), without its text (purged after 30 days: 409 `text_gone`) or analysed less than 30 s ago (409
   * `analysis_running`). A handled or archived email keeps its status unless the booking is made: a re-analysis never
   * moves an email back to « À traiter » by itself; nor does it forget a field read before (Claude or Allopark's page
   * not answering this time).
   */
  public async reanalyse(actor: AuthenticatedStaff, id: string): Promise<Reanalysis> {
    this.require(actor, 'reservations:manage');
    const row = await this.find(actor, id);
    if (row.reservationId || row.status === 'imported' || row.status === 'duplicate') {
      throw new HttpException(httpStatus.CONFLICT, 'This email already has its booking', 'already_imported');
    }
    if (!row.textBody) throw new HttpException(httpStatus.CONFLICT, 'The text of this email is no longer kept', 'text_gone');
    // The claim is atomic: of two clicks, one analyses, the other is refused.
    const now = new Date();
    const claimed = await prisma.inboundEmail.updateMany({
      where: {
        id,
        operatorId: actor.operatorId,
        reservationId: null,
        OR: [{ analysedAt: null }, { analysedAt: { lte: new Date(now.getTime() - REANALYSIS_GAP_MS) } }],
      },
      data: { analysedAt: now },
    });
    if (!claimed.count) throw new HttpException(httpStatus.CONFLICT, 'This email is being analysed', 'analysis_running');
    let analysis: Analysis;
    try {
      analysis = await this.analyse({
        operatorId: actor.operatorId,
        text: row.textBody,
        fromAddress: row.fromAddress,
        fromName: row.fromName,
        subject: row.subject,
        links: row.links,
        recipients: row.recipients,
        previous: { parsed: storedParsed(row.parsed), missing: missingOf(row.missing), reading: readingOf(row.reading) },
      });
    } catch (error) {
      // An unexpected failure frees the email for another try at once.
      await prisma.inboundEmail.updateMany({ where: { id, analysedAt: now }, data: { analysedAt: row.analysedAt } }).catch(() => undefined);
      throw error;
    }
    const linked = analysis.status === 'imported' || analysis.status === 'duplicate';
    // Claude's new reading when it answered; none for a booking made without it; else the former one stays.
    const reading = analysis.reading ? { reading: analysis.reading as unknown as Prisma.InputJsonValue } : linked ? { reading: Prisma.DbNull } : {};
    // The row as it is now, locked until written: a colleague may have handled, archived or attached it (« Compléter »)
    // while the analysis ran; a handled or archived email keeps that state, an attached one its booking.
    const written = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM inbound_emails WHERE id = ${id} FOR UPDATE`;
      const current = await tx.inboundEmail.findUnique({ where: { id }, select: { status: true, reservationId: true } });
      if (!current || current.reservationId) return { current, status: null };
      const status: InboundEmailStatus = linked || TO_CHECK.includes(current.status) ? analysis.status : current.status;
      await tx.inboundEmail.update({
        where: { id },
        data: {
          status,
          provider: analysis.provider,
          parsed: analysis.parsed ? (analysis.parsed as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
          missing: analysis.missing.length ? analysis.missing : Prisma.DbNull,
          reservationId: analysis.reservationId,
          // Of no use once the email has its booking (RGPD: minimised as in attach()).
          ...(linked ? { recipients: [], links: [] } : {}),
          ...reading,
        },
      });
      return { current, status };
    });
    if (!written.current) throw new HttpException(httpStatus.NOT_FOUND, 'Email not found', 'not_found');
    const details = {
      from: written.current.status,
      to: written.status ?? written.current.status,
      outcome: analysis.status,
      ...(analysis.reservationId ? { reservationId: analysis.reservationId } : {}),
    };
    // Traced even when refused: the analysis may have made a booking before the email was attached by hand.
    await this.audit.record(actor, { action: 'inbound.reanalysed', entityType: 'inbound_email', entityId: id, details });
    if (!written.status) throw new HttpException(httpStatus.CONFLICT, 'This email already has its booking', 'already_imported');
    const updated = await prisma.inboundEmail.findUniqueOrThrow({ where: { id }, include: { reservation: { select: { reference: true } } } });
    return { email: this.view(updated), outcome: analysis.status };
  }

  /** Links an email to the booking the staff typed from it (the "Compléter" flow). */
  public async attach(actor: AuthenticatedStaff, id: string, reservationId: string): Promise<void> {
    this.require(actor, 'reservations:manage');
    const row = await prisma.inboundEmail.findFirst({ where: { id, operatorId: actor.operatorId }, select: { id: true } });
    const booking = await prisma.reservation.findFirst({ where: { id: reservationId, operatorId: actor.operatorId }, select: { id: true } });
    if (!row || !booking) throw new HttpException(httpStatus.NOT_FOUND, 'Not found', 'not_found');
    await prisma.inboundEmail.update({ where: { id }, data: { status: 'imported', reservationId, textBody: null, recipients: [], links: [] } });
  }

  /** Nightly: the text (with the recipients and links kept for a re-analysis) after 30 days, the rows after 90. */
  public async purge(now = new Date()): Promise<{ textsCleared: number; rowsDeleted: number }> {
    const { count: textsCleared } = await prisma.inboundEmail.updateMany({
      where: {
        receivedAt: { lt: new Date(now.getTime() - TEXT_RETENTION_DAYS * 86400000) },
        OR: [{ textBody: { not: null } }, { recipients: { isEmpty: false } }, { links: { isEmpty: false } }],
      },
      data: { textBody: null, recipients: [], links: [] },
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
      analysedAt: r.analysedAt?.toISOString() ?? null,
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
  recipients: string[];
  links: string[];
  analysedAt: Date | null;
  reservationId: string | null;
  receivedAt: Date;
  reservation: { reference: string } | null;
};

/** The booking fields as stored (null for an email nothing was read from, or a Gmail confirmation's code). */
function storedParsed(value: Prisma.JsonValue | null): ParsedBooking | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return typeof (value as Record<string, unknown>).provider === 'string' ? (value as unknown as ParsedBooking) : null;
}

function missingOf(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
}

const isSet = (value: unknown) => value !== undefined && value !== null && value !== '';

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

/**
 * The email's allopark.com links: those parseRawEmail read from the whole bodies (10/10/2026), else those of the
 * payload's bodies (the former JSON payload); kept by the rules of alloparkLinks either way (confirmation pages whole
 * and first, the others without their query, 10 at most).
 */
function linksOf(item: InboundItem): string[] {
  if (Array.isArray(item.Links)) return alloparkLinks(null, item.Links.filter((link): link is string => typeof link === 'string').join('\n'));
  return alloparkLinks(item.RawHtmlBody, item.RawTextBody);
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
