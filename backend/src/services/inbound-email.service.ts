import { randomBytes } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { INBOUND_EMAIL_DOMAIN, inboundEmailAvailable } from '@/config';
import prisma, { InboundEmailStatus, Prisma } from '@/database';
import { IMPORT_SENDERS, parseConfirmationEmail, ParsedBooking } from '@/domain/importers';
import {
  forwardingConfirmationOf,
  InboundItem,
  InboundPayload,
  inboundSlugOf,
  newInboundSlug,
  recipientsOf,
  REQUIRED_FOR_IMPORT,
  textOf,
} from '@/domain/inbound-email';
import { can } from '@/domain/roles';
import { HttpException } from '@/utils/httpException';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
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
  /** "lys-demo-7f3a@in.plazo.fr", or null until the manager enables it. */
  address: string | null;
  lastReceivedAt: string | null;
  counts: Record<InboundEmailStatus, number>;
  /** Emails waiting for the staff (incomplete or unrecognised). */
  toCheck: number;
  /** G-B: the comparators' sender addresses, for the forwarding rule. */
  senders: { provider: string; address: string }[];
  /** G-B: Gmail's latest forwarding confirmation (7 days), its code typed back in Gmail. */
  forwarding: { provider: 'gmail'; code: string; requester: string | null; receivedAt: string } | null;
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
  receivedAt: string;
}

const TO_CHECK: InboundEmailStatus[] = ['incomplete', 'unrecognised'];

/**
 * M-A (06/10/2026): the operator's mailbox forwards the comparators' confirmations to
 * <slug>@<INBOUND_EMAIL_DOMAIN>; the Cloudflare relay (email-worker/) posts each email here; the importers read it and the booking is
 * created at once, or the email waits in "À vérifier" for the staff.
 */
@Service()
export class InboundEmailService {
  public reservations = Container.get(ReservationService);
  public audit = Container.get(AuditService);

  /** The relay's webhook: every item is handled on its own; the answer is always 200 so the relay does not resend it. */
  public async receive(payload: InboundPayload): Promise<{ received: number; imported: number; toCheck: number; ignored: number }> {
    const result = { received: 0, imported: 0, toCheck: 0, ignored: 0 };
    for (const item of payload.items ?? []) {
      result.received += 1;
      const outcome = await this.handle(item);
      if (outcome === 'ignored') result.ignored += 1;
      else if (outcome === 'imported') result.imported += 1;
      else if (TO_CHECK.includes(outcome)) result.toCheck += 1;
    }
    return result;
  }

  private async handle(item: InboundItem): Promise<InboundEmailStatus | 'ignored'> {
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
          parsed: { code: confirmation.code, requester: confirmation.requester },
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
    const parsed = text ? parseConfirmationEmail(text) : null;
    if (!parsed) {
      await prisma.inboundEmail.create({ data: { ...base, status: 'unrecognised' } });
      return 'unrecognised';
    }
    const missing = REQUIRED_FOR_IMPORT.filter(key => !parsed[key]);
    const parsedJson = parsed as unknown as Prisma.InputJsonValue;
    if (missing.length) {
      await prisma.inboundEmail.create({ data: { ...base, status: 'incomplete', provider: parsed.provider, parsed: parsedJson, missing } });
      return 'incomplete';
    }
    try {
      const created = await this.reservations.createFromImport(operator.id, parsed);
      await prisma.inboundEmail.create({
        data: {
          ...base,
          status: created.duplicate ? 'duplicate' : 'imported',
          provider: parsed.provider,
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
          ...base,
          status: 'incomplete',
          provider: parsed.provider,
          parsed: parsedJson,
          missing: [error instanceof HttpException ? error.code || 'error' : 'error'],
        },
      });
      return 'incomplete';
    }
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
    const counts: Record<InboundEmailStatus, number> = { imported: 0, duplicate: 0, incomplete: 0, unrecognised: 0, dismissed: 0, forwarding: 0 };
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

  /** The manager enables the address (or gets a new one: the old one stops working). */
  public async enableAddress(actor: AuthenticatedStaff, options: { regenerate?: boolean } = {}): Promise<InboundSettings> {
    this.require(actor, 'parking:manage');
    if (!inboundEmailAvailable()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Inbound email is not configured', 'inbound_unavailable');
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { slug: true, inboundSlug: true } });
    if (!operator.inboundSlug || options.regenerate) {
      let slug = newInboundSlug(operator.slug, () => randomBytes(3).toString('hex').slice(0, 4));
      while (await prisma.operator.findUnique({ where: { inboundSlug: slug }, select: { id: true } })) {
        slug = newInboundSlug(operator.slug, () => randomBytes(3).toString('hex').slice(0, 4));
      }
      await prisma.operator.update({ where: { id: actor.operatorId }, data: { inboundSlug: slug } });
      await this.audit.record(actor, {
        action: options.regenerate ? 'inbound.address_regenerated' : 'inbound.address_enabled',
        entityType: 'operator',
        entityId: actor.operatorId,
      });
    }
    return this.settings(actor);
  }

  /** "À vérifier": the emails waiting for the staff first, then the rest of the last 30 days. */
  public async list(actor: AuthenticatedStaff, filter: { status?: InboundEmailStatus } = {}): Promise<InboundEmailView[]> {
    this.require(actor, 'reservations:manage');
    const since = new Date(Date.now() - COUNT_WINDOW_DAYS * 86400000);
    const rows = await prisma.inboundEmail.findMany({
      where: {
        operatorId: actor.operatorId,
        // Gmail's forwarding confirmations belong to the setup wizard, not to "À vérifier".
        ...(filter.status
          ? { status: filter.status }
          : { status: { not: 'forwarding' }, OR: [{ status: { in: TO_CHECK } }, { receivedAt: { gte: since } }] }),
      },
      include: { reservation: { select: { reference: true } } },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });
    const rank = (s: InboundEmailStatus) => (TO_CHECK.includes(s) ? 0 : 1);
    rows.sort((a, b) => rank(a.status) - rank(b.status) || b.receivedAt.getTime() - a.receivedAt.getTime());
    return rows.map(r => ({
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
      receivedAt: r.receivedAt.toISOString(),
    }));
  }

  /** The staff closed an email without a booking (spam, a cancellation, a duplicate they know). */
  public async dismiss(actor: AuthenticatedStaff, id: string): Promise<InboundEmailView> {
    this.require(actor, 'reservations:manage');
    const row = await prisma.inboundEmail.findFirst({ where: { id, operatorId: actor.operatorId } });
    if (!row) throw new HttpException(httpStatus.NOT_FOUND, 'Email not found', 'not_found');
    if (TO_CHECK.includes(row.status)) {
      await prisma.inboundEmail.update({ where: { id }, data: { status: 'dismissed', textBody: null } });
      await this.audit.record(actor, { action: 'inbound.dismissed', entityType: 'inbound_email', entityId: id });
    }
    const [view] = await this.list(actor, { status: 'dismissed' }).then(list => list.filter(v => v.id === id));
    return view ?? { ...this.view(row), status: 'dismissed', textBody: null };
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

  private view(r: {
    id: string;
    status: InboundEmailStatus;
    fromAddress: string | null;
    fromName: string | null;
    subject: string | null;
    textBody: string | null;
    provider: string | null;
    parsed: Prisma.JsonValue | null;
    missing: Prisma.JsonValue | null;
    reservationId: string | null;
    receivedAt: Date;
  }): InboundEmailView {
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
      reservationReference: null,
      receivedAt: r.receivedAt.toISOString(),
    };
  }

  private require(actor: AuthenticatedStaff, permission: Parameters<typeof can>[1]) {
    if (!can(actor.role, permission)) throw new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden');
  }
}

function forwardingView(row: { parsed: Prisma.JsonValue | null; receivedAt: Date } | null): InboundSettings['forwarding'] {
  const parsed = row?.parsed as { code?: unknown; requester?: unknown } | null | undefined;
  if (!row || typeof parsed?.code !== 'string') return null;
  return {
    provider: 'gmail',
    code: parsed.code,
    requester: typeof parsed.requester === 'string' ? parsed.requester : null,
    receivedAt: row.receivedAt.toISOString(),
  };
}
