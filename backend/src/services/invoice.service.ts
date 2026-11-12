import { createHash } from 'crypto';
import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import prisma, { Invoice, Prisma } from '@/database';
import { EmailMessage } from '@/domain/booking-messages';
import {
  BillingInput,
  BillingSettings,
  billingMissing,
  buildInvoicePdf,
  euros,
  frDate,
  frDateTime,
  InvoiceCustomer,
  InvoiceDocument,
  InvoiceLine,
  invoiceLines,
  InvoiceLogo,
  invoiceNumber,
  InvoiceSeller,
  readBillingInput,
} from '@/domain/invoice';
import { PaidBy, paidBy } from '@/domain/payment-method';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { toBuffer } from './contract-template.service';
import { NotificationService } from './notification.service';
import { PhotoStorageService } from './photo-storage.service';
import { PublicBookingService } from './public-booking.service';
import { PushService } from './push.service';
import { STAFF_VISIBLE } from './reservation.service';

/**
 * 06/11/2026 (« une facture au nom du parking avec son logo », direction A): the parking's invoicing details, and the
 * invoices it issues to its customers from a booking's sheet. An invoice is numbered without gaps (per operator, kind
 * and year, under a lock on the operator's row), frozen as issued (its PDF is kept), and cancelled by a credit note.
 */

const BILLING_SELECT = {
  name: true,
  logoKey: true,
  billingLegalName: true,
  billingAddress: true,
  billingSiret: true,
  billingVatNumber: true,
  billingVatExempt: true,
  billingVatRateBp: true,
  billingMention: true,
  billingPrefix: true,
} satisfies Prisma.OperatorSelect;

type OperatorBilling = Prisma.OperatorGetPayload<{ select: typeof BILLING_SELECT }>;

const settingsOf = (o: OperatorBilling): BillingSettings => ({
  legalName: o.billingLegalName,
  address: o.billingAddress,
  siret: o.billingSiret,
  vatNumber: o.billingVatNumber,
  vatExempt: o.billingVatExempt,
  vatRateBp: o.billingVatRateBp,
  mention: o.billingMention,
  prefix: o.billingPrefix,
});

const BOOKING_SELECT = {
  id: true,
  reference: true,
  status: true,
  channel: true,
  paymentMethod: true,
  priceCents: true,
  customerName: true,
  customerEmail: true,
  plate: true,
  arrivalAt: true,
  returnAt: true,
  handover: true,
  anonymizedAt: true,
  operatorId: true,
  invoiceRequestedAt: true,
  invoiceRequestCompany: true,
  invoiceRequestAddress: true,
  parking: { select: { name: true, address: true, timezone: true } },
  extras: { where: { status: 'done' }, select: { label: true, priceCents: true }, orderBy: { doneAt: 'asc' } },
  surcharges: { select: { label: true, amountCents: true }, orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ReservationSelect;

type BookingForInvoice = Prisma.ReservationGetPayload<{ select: typeof BOOKING_SELECT }>;

export interface InvoiceView {
  id: string;
  kind: 'invoice' | 'credit_note';
  number: string;
  issuedAt: string;
  totalTtcCents: number;
  customer: InvoiceCustomer;
  /** The parking's trade name, as on the invoice. */
  issuer: string;
  sentAt: string | null;
  sentTo: string | null;
  creditOf: string | null;
  creditedBy: string | null;
}

export type InvoiceRefusal = 'billing_incomplete' | 'no_price' | 'reservation_cancelled' | 'invoice_exists' | 'anonymized';

/** 07/11/2026: what the traveller asked for from « Ma réservation » (null when nothing is asked or it is answered). */
export interface InvoiceRequestView {
  at: string;
  company: string | null;
  address: string | null;
}

export interface ReservationInvoices {
  billing: { complete: boolean; missing: string[] };
  canCreate: boolean;
  refusal: InvoiceRefusal | null;
  customerEmail: string | null;
  /** A request of the traveller still waiting for its invoice. */
  request: InvoiceRequestView | null;
  invoices: InvoiceView[];
}

/** 07/11/2026 (« Le client peut retrouver ses factures dans Plazo », A + C): the traveller's side. */
export type TravellerInvoiceRefusal = 'reservation_cancelled' | 'no_price' | 'invoice_exists' | 'already_requested' | 'anonymized';

export interface TravellerInvoiceView {
  id: string;
  kind: 'invoice' | 'credit_note';
  number: string;
  issuedAt: string;
  totalTtcCents: number;
  issuer: string;
  creditOf: string | null;
  creditedBy: string | null;
}

export interface TravellerInvoices {
  invoices: TravellerInvoiceView[];
  request: InvoiceRequestView | null;
  canRequest: boolean;
  refusal: TravellerInvoiceRefusal | null;
}

export interface InvoiceFile {
  bytes: Buffer;
  fileName: string;
}

const MAX_COMPANY = 120;
const MAX_ADDRESS = 300;

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

const fileNameOf = (kind: 'invoice' | 'credit_note', number: string | null) =>
  `${kind === 'credit_note' ? 'Avoir' : 'Facture'}-${number ?? 'apercu'}.pdf`;

@Service()
export class InvoiceService {
  public audit = Container.get(AuditService);
  public notifications = Container.get(NotificationService);
  public storage = Container.get(PhotoStorageService);
  public push = Container.get(PushService);
  private get bookings() {
    return Container.get(PublicBookingService);
  }

  // ── Settings ───────────────────────────────────────────────────────────────────────────────────

  /** GET /internal/billing/settings */
  public async settings(operatorId: string) {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: operatorId }, select: BILLING_SELECT });
    const parking = await this.primaryParking(operatorId);
    const s = settingsOf(operator);
    const missing = billingMissing(s, parking?.address ?? null);
    return {
      tradeName: operator.name,
      legalName: s.legalName,
      address: s.address,
      parkingAddress: parking?.address ?? null,
      siret: s.siret,
      vatNumber: s.vatNumber,
      vatExempt: s.vatExempt,
      vatRatePercent: s.vatRateBp / 100,
      mention: s.mention,
      prefix: s.prefix,
      hasLogo: !!operator.logoKey,
      complete: missing.length === 0,
      missing,
      issuedCount: await prisma.invoice.count({ where: { operatorId } }),
    };
  }

  /** PUT /internal/billing/settings: fields absent stay as they are. */
  public async updateSettings(actor: AuthenticatedStaff, body: unknown) {
    const { changes, errors } = readBillingInput((body ?? {}) as BillingInput);
    if (Object.keys(errors).length) throw new ValidationException(errors);
    await prisma.operator.update({
      where: { id: actor.operatorId },
      data: {
        ...('legalName' in changes ? { billingLegalName: changes.legalName } : {}),
        ...('address' in changes ? { billingAddress: changes.address } : {}),
        ...('siret' in changes ? { billingSiret: changes.siret } : {}),
        ...('vatNumber' in changes ? { billingVatNumber: changes.vatNumber } : {}),
        ...('vatExempt' in changes ? { billingVatExempt: changes.vatExempt } : {}),
        ...('vatRateBp' in changes ? { billingVatRateBp: changes.vatRateBp } : {}),
        ...('mention' in changes ? { billingMention: changes.mention } : {}),
        ...('prefix' in changes ? { billingPrefix: changes.prefix } : {}),
      },
    });
    await this.audit.record(actor, {
      action: 'billing.updated',
      entityType: 'operator',
      entityId: actor.operatorId,
      details: { fields: Object.keys(changes) },
    });
    return this.settings(actor.operatorId);
  }

  // ── A booking's invoices ───────────────────────────────────────────────────────────────────────

  /** GET /internal/reservations/:id/invoices */
  public async forReservation(actor: AuthenticatedStaff, reservationId: string): Promise<ReservationInvoices> {
    const booking = await this.booking(actor, reservationId);
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: BILLING_SELECT });
    const missing = billingMissing(settingsOf(operator), booking.parking.address);
    const invoices = await this.invoicesOf(actor.operatorId, reservationId);
    const refusal = this.refusal(booking, missing, invoices);
    return {
      billing: { complete: missing.length === 0, missing },
      canCreate: refusal === null,
      refusal,
      customerEmail: booking.customerEmail,
      request: this.pendingRequest(booking, invoices),
      invoices,
    };
  }

  /** GET /internal/reservations/:id/invoices/preview: the invoice as it would be issued, marked « aperçu », not kept. */
  public async preview(actor: AuthenticatedStaff, reservationId: string, query: Record<string, unknown>): Promise<InvoiceFile> {
    const booking = await this.booking(actor, reservationId);
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: BILLING_SELECT });
    const missing = billingMissing(settingsOf(operator), booking.parking.address);
    const refusal = this.refusal(booking, missing, []);
    if (refusal) throw this.refused(refusal, missing);
    const customer = this.customerOf(booking, query);
    const doc = this.documentOf(booking, operator, customer, { kind: 'invoice', number: null, issuedAt: new Date(), creditOfNumber: null });
    const pdf = await buildInvoicePdf(doc, await this.logoOf(operator.logoKey));
    return { bytes: Buffer.from(pdf), fileName: fileNameOf('invoice', null) };
  }

  /** POST /internal/reservations/:id/invoices { customerCompany?, customerAddress? } */
  public async create(actor: AuthenticatedStaff, reservationId: string, body: unknown): Promise<ReservationInvoices> {
    const booking = await this.booking(actor, reservationId);
    const input = { ...((body ?? {}) as Record<string, unknown>) };
    // 07/11/2026: what the traveller asked for fills what the team left out (Plazo Pro sends neither).
    const asked = this.pendingRequest(booking, await this.invoicesOf(actor.operatorId, reservationId));
    if (asked) {
      if (input.customerCompany === undefined) input.customerCompany = asked.company;
      if (input.customerAddress === undefined) input.customerAddress = asked.address;
    }
    const customer = this.customerOf(booking, input);
    // The logo is read before the transaction (a network call), the rest under the operator's lock.
    const logoKey = (await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { logoKey: true } })).logoKey;
    const logo = await this.logoOf(logoKey);
    const created = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM operators WHERE id = ${actor.operatorId} FOR UPDATE`;
      const operator = await tx.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: BILLING_SELECT });
      const missing = billingMissing(settingsOf(operator), booking.parking.address);
      const current = await tx.invoice.findMany({
        where: { operatorId: actor.operatorId, reservationId, kind: 'invoice', creditNote: null },
        select: { id: true },
      });
      const refusal = this.refusal(
        booking,
        missing,
        current.map(() => ({ kind: 'invoice', creditedBy: null })),
      );
      if (refusal) throw this.refused(refusal, missing);
      const issuedAt = new Date();
      const year = Number(frDate(issuedAt, booking.parking.timezone).slice(-4));
      const sequence = await this.nextSequence(tx, actor.operatorId, 'invoice', year);
      const number = invoiceNumber('invoice', operator.billingPrefix, year, sequence);
      const doc = this.documentOf(booking, operator, customer, { kind: 'invoice', number, issuedAt, creditOfNumber: null });
      const pdf = await buildInvoicePdf(doc, logo);
      return tx.invoice.create({
        data: {
          operatorId: actor.operatorId,
          reservationId,
          kind: 'invoice',
          year,
          sequence,
          number,
          issuedAt,
          seller: doc.seller as unknown as Prisma.InputJsonValue,
          customer: doc.customer as unknown as Prisma.InputJsonValue,
          lines: doc.lines as unknown as Prisma.InputJsonValue,
          vatRateBp: doc.vatRateBp,
          totalHtCents: doc.totalHtCents,
          vatCents: doc.vatCents,
          totalTtcCents: doc.totalTtcCents,
          paidBy: doc.paidBy,
          pdf: Buffer.from(pdf),
          pdfSha256: sha256(pdf),
          createdById: actor.id,
        },
      });
    });
    await this.audit.record(actor, {
      action: 'invoice.created',
      entityType: 'reservation',
      entityId: reservationId,
      details: { number: created.number, totalTtcCents: created.totalTtcCents },
    });
    if (asked) await this.answerRequest(actor, created);
    return this.forReservation(actor, reservationId);
  }

  /** The traveller asked for it: the invoice goes to them by e-mail (when there is an address) and by push. */
  private async answerRequest(actor: AuthenticatedStaff, invoice: Invoice) {
    const seller = invoice.seller as unknown as InvoiceSeller;
    const customer = invoice.customer as unknown as InvoiceCustomer;
    if (customer.email) {
      try {
        const sent = await this.notifications.emailTraveller(
          { email: customer.email, name: customer.name },
          'invoice',
          `invoice ${invoice.number}`,
          invoiceEmail(seller.tradeName, customer.name, 'invoice', invoice.number, invoice.totalTtcCents),
          [{ name: fileNameOf('invoice', invoice.number), content: Buffer.from(invoice.pdf) }],
        );
        if (sent) {
          await prisma.invoice.update({ where: { id: invoice.id }, data: { sentAt: new Date(), sentTo: customer.email } });
          await this.audit.record(actor, {
            action: 'invoice.sent',
            entityType: 'reservation',
            entityId: invoice.reservationId ?? undefined,
            details: { number: invoice.number, requested: true },
          });
        }
      } catch (error) {
        logger.warn(`[Invoices] Requested invoice not e-mailed: ${error instanceof Error ? error.name : 'unknown error'}`);
      }
    }
    if (invoice.reservationId) {
      await this.push
        .notifyTravellers([invoice.reservationId], invoiceReadyPush(seller.tradeName, invoice.number, invoice.totalTtcCents), {
          data: { type: 'booking', event: 'invoice_ready', reservationId: invoice.reservationId },
          collapseId: `invoice-${invoice.reservationId}`,
        })
        .catch(() => 0);
    }
  }

  // ── The traveller (x-booking-token) ────────────────────────────────────────────────────────────

  /** GET /public/bookings/:reference/invoices */
  public async travellerList(reference: string, token: string | undefined): Promise<TravellerInvoices> {
    const record = await this.bookings.load(reference, token);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { id: record.id }, select: BOOKING_SELECT });
    const invoices = await this.invoicesOf(booking.operatorId, booking.id);
    const refusal = this.travellerRefusal(booking, invoices);
    return {
      invoices: invoices.map(i => ({
        id: i.id,
        kind: i.kind,
        number: i.number,
        issuedAt: i.issuedAt,
        totalTtcCents: i.totalTtcCents,
        issuer: i.issuer,
        creditOf: i.creditOf,
        creditedBy: i.creditedBy,
      })),
      request: this.pendingRequest(booking, invoices),
      canRequest: refusal === null,
      refusal,
    };
  }

  /** GET /public/bookings/:reference/invoices/:id/pdf: an invoice or credit note of this booking, as issued. */
  public async travellerFile(reference: string, token: string | undefined, invoiceId: string): Promise<InvoiceFile> {
    const booking = await this.bookings.load(reference, token);
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, reservationId: booking.id } });
    if (!invoice) throw new HttpException(httpStatus.NOT_FOUND, 'Invoice not found', 'not_found');
    return { bytes: Buffer.from(invoice.pdf), fileName: fileNameOf(invoice.kind, invoice.number) };
  }

  /** POST /public/bookings/:reference/invoices/request { company?, address? }: the team is told; once per booking. */
  public async travellerRequest(reference: string, token: string | undefined, body: unknown): Promise<TravellerInvoices> {
    const record = await this.bookings.load(reference, token);
    const booking = await prisma.reservation.findFirstOrThrow({ where: { id: record.id }, select: BOOKING_SELECT });
    const input = (body ?? {}) as Record<string, unknown>;
    const read = (key: string, max: number) => {
      const v = input[key];
      if (v == null || v === '') return null;
      if (typeof v !== 'string') throw new ValidationException({ [key]: 'invalid' });
      const t = v.replace(/\r/g, '').trim();
      if (t.length > max) throw new ValidationException({ [key]: 'too_long' });
      return t || null;
    };
    const company = read('company', MAX_COMPANY);
    const address = read('address', MAX_ADDRESS);
    const refusal = this.travellerRefusal(booking, await this.invoicesOf(booking.operatorId, booking.id));
    if (refusal) throw this.travellerRefused(refusal);
    // Only the first request counts (two taps, two tabs): the row says whether this one was first.
    const { count } = await prisma.reservation.updateMany({
      where: { id: booking.id, invoiceRequestedAt: null },
      data: { invoiceRequestedAt: new Date(), invoiceRequestCompany: company, invoiceRequestAddress: address },
    });
    if (!count) throw this.travellerRefused('already_requested');
    await this.audit.record(
      { id: null, operatorId: booking.operatorId },
      { action: 'invoice.requested', entityType: 'reservation', entityId: booking.id, details: { by: 'traveller' } },
    );
    await this.push
      .notifyStaff(booking.operatorId, 'bookingChanges', invoiceRequestedPush(booking.customerName, booking.reference), {
        data: { type: 'booking', event: 'invoice_requested', reservationId: booking.id },
        collapseId: `invoice-request-${booking.id}`,
        event: 'booking_change',
      })
      .catch(() => 0);
    return this.travellerList(reference, token);
  }

  /** 07/11/2026: the bookings whose traveller waits for an invoice (the dashboard's « Facture demandée »). */
  public async pendingRequests(operatorId: string, take = 10) {
    return prisma.reservation.findMany({
      where: {
        operatorId,
        AND: [STAFF_VISIBLE],
        invoiceRequestedAt: { not: null },
        status: { not: 'cancelled' },
        anonymizedAt: null,
        invoices: { none: { kind: 'invoice', creditNote: null } },
      },
      orderBy: { invoiceRequestedAt: 'asc' },
      take,
      select: { id: true, reference: true, customerName: true, plate: true, invoiceRequestedAt: true },
    });
  }

  /** POST /internal/invoices/:id/credit-note: cancels an invoice (its own series « A-… », negative amounts). */
  public async creditNote(actor: AuthenticatedStaff, invoiceId: string): Promise<ReservationInvoices | { invoice: InvoiceView }> {
    const invoice = await this.invoice(actor, invoiceId);
    if (invoice.kind !== 'invoice') throw new HttpException(httpStatus.BAD_REQUEST, 'A credit note cannot be cancelled', 'not_invoice');
    const logoKey = (await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { logoKey: true } })).logoKey;
    const logo = await this.logoOf(logoKey);
    const booking = invoice.reservationId
      ? await prisma.reservation.findFirst({ where: { id: invoice.reservationId }, select: BOOKING_SELECT })
      : null;
    const timeZone = booking?.parking.timezone ?? 'Europe/Paris';
    const credit = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM operators WHERE id = ${actor.operatorId} FOR UPDATE`;
      if (await tx.invoice.findUnique({ where: { creditOfId: invoice.id }, select: { id: true } })) {
        throw new HttpException(httpStatus.CONFLICT, 'This invoice already has a credit note', 'already_credited');
      }
      const operator = await tx.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: BILLING_SELECT });
      const issuedAt = new Date();
      const year = Number(frDate(issuedAt, timeZone).slice(-4));
      const sequence = await this.nextSequence(tx, actor.operatorId, 'credit_note', year);
      const number = invoiceNumber('credit_note', operator.billingPrefix, year, sequence);
      const lines = (invoice.lines as unknown as InvoiceLine[]).map(l => ({
        ...l,
        unitHtCents: -l.unitHtCents,
        totalHtCents: -l.totalHtCents,
        totalTtcCents: -l.totalTtcCents,
      }));
      const doc: InvoiceDocument = {
        kind: 'credit_note',
        number,
        issuedOn: frDate(issuedAt, timeZone),
        reference: booking?.reference ?? '—',
        plate: booking?.plate || null,
        creditOfNumber: invoice.number,
        seller: invoice.seller as unknown as InvoiceSeller,
        customer: invoice.customer as unknown as InvoiceCustomer,
        lines,
        vatRateBp: invoice.vatRateBp,
        totalHtCents: -invoice.totalHtCents,
        vatCents: -invoice.vatCents,
        totalTtcCents: -invoice.totalTtcCents,
        paidBy: null,
      };
      const pdf = await buildInvoicePdf(doc, logo);
      return tx.invoice.create({
        data: {
          operatorId: actor.operatorId,
          reservationId: invoice.reservationId,
          kind: 'credit_note',
          year,
          sequence,
          number,
          issuedAt,
          creditOfId: invoice.id,
          seller: invoice.seller as Prisma.InputJsonValue,
          customer: invoice.customer as Prisma.InputJsonValue,
          lines: lines as unknown as Prisma.InputJsonValue,
          vatRateBp: invoice.vatRateBp,
          totalHtCents: doc.totalHtCents,
          vatCents: doc.vatCents,
          totalTtcCents: doc.totalTtcCents,
          pdf: Buffer.from(pdf),
          pdfSha256: sha256(pdf),
          createdById: actor.id,
        },
      });
    });
    await this.audit.record(actor, {
      action: 'invoice.credit_note',
      entityType: 'reservation',
      entityId: invoice.reservationId ?? undefined,
      details: { number: credit.number, creditOf: invoice.number },
    });
    if (invoice.reservationId) return this.forReservation(actor, invoice.reservationId);
    return { invoice: (await this.views([credit]))[0] };
  }

  /** POST /internal/invoices/:id/send { email? }: the PDF by e-mail, to the booking's address unless another is given. */
  public async send(actor: AuthenticatedStaff, invoiceId: string, body: unknown): Promise<{ sentAt: string; sentTo: string }> {
    const invoice = await this.invoice(actor, invoiceId);
    const raw = (body as { email?: unknown } | null)?.email;
    if (raw != null && typeof raw !== 'string') throw new ValidationException({ email: 'invalid' });
    const customer = invoice.customer as unknown as InvoiceCustomer;
    const email = (typeof raw === 'string' && raw.trim()) || customer.email;
    if (!email) throw new HttpException(httpStatus.CONFLICT, 'No e-mail address for this customer', 'no_email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationException({ email: 'invalid' });
    const seller = invoice.seller as unknown as InvoiceSeller;
    const sent = await this.notifications.emailTraveller(
      { email, name: customer.name },
      'invoice',
      `invoice ${invoice.number}`,
      invoiceEmail(seller.tradeName, customer.name, invoice.kind, invoice.number, invoice.totalTtcCents),
      [{ name: fileNameOf(invoice.kind, invoice.number), content: Buffer.from(invoice.pdf) }],
    );
    if (!sent) throw new HttpException(httpStatus.BAD_GATEWAY, 'The e-mail could not be sent', 'email_failed');
    const updated = await prisma.invoice.update({ where: { id: invoice.id }, data: { sentAt: new Date(), sentTo: email } });
    await this.audit.record(actor, {
      action: 'invoice.sent',
      entityType: 'reservation',
      entityId: invoice.reservationId ?? undefined,
      details: { number: invoice.number },
    });
    return { sentAt: updated.sentAt!.toISOString(), sentTo: email };
  }

  /** GET /internal/invoices/:id/pdf: the PDF as issued. */
  public async file(actor: AuthenticatedStaff, invoiceId: string): Promise<InvoiceFile> {
    const invoice = await this.invoice(actor, invoiceId);
    return { bytes: Buffer.from(invoice.pdf), fileName: fileNameOf(invoice.kind, invoice.number) };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────────────────────

  private async booking(actor: AuthenticatedStaff, reservationId: string): Promise<BookingForInvoice> {
    const booking = await prisma.reservation.findFirst({
      where: { id: reservationId, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] },
      select: BOOKING_SELECT,
    });
    if (!booking) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    return booking;
  }

  private async invoice(actor: AuthenticatedStaff, invoiceId: string): Promise<Invoice> {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, operatorId: actor.operatorId } });
    if (!invoice) throw new HttpException(httpStatus.NOT_FOUND, 'Invoice not found', 'not_found');
    return invoice;
  }

  private async primaryParking(operatorId: string) {
    return prisma.parking.findFirst({ where: { operatorId }, orderBy: { createdAt: 'asc' }, select: { address: true } });
  }

  private refusal(booking: BookingForInvoice, missing: string[], invoices: { kind: string; creditedBy: string | null }[]): InvoiceRefusal | null {
    if (missing.length) return 'billing_incomplete';
    if (booking.anonymizedAt) return 'anonymized';
    if (booking.status === 'cancelled') return 'reservation_cancelled';
    if (booking.priceCents == null || booking.priceCents <= 0) return 'no_price';
    if (invoices.some(i => i.kind === 'invoice' && !i.creditedBy)) return 'invoice_exists';
    return null;
  }

  /** The traveller's request, while no invoice stands for the booking (a credit note reopens it). */
  private pendingRequest(booking: BookingForInvoice, invoices: { kind: string; creditedBy: string | null }[]): InvoiceRequestView | null {
    if (!booking.invoiceRequestedAt || booking.anonymizedAt || booking.status === 'cancelled') return null;
    if (invoices.some(i => i.kind === 'invoice' && !i.creditedBy)) return null;
    return {
      at: booking.invoiceRequestedAt.toISOString(),
      company: booking.invoiceRequestCompany,
      address: booking.invoiceRequestAddress,
    };
  }

  private travellerRefusal(booking: BookingForInvoice, invoices: { kind: string; creditedBy: string | null }[]): TravellerInvoiceRefusal | null {
    if (booking.anonymizedAt) return 'anonymized';
    if (booking.status === 'cancelled') return 'reservation_cancelled';
    if (invoices.some(i => i.kind === 'invoice' && !i.creditedBy)) return 'invoice_exists';
    if (booking.priceCents == null || booking.priceCents <= 0) return 'no_price';
    if (booking.invoiceRequestedAt) return 'already_requested';
    return null;
  }

  private travellerRefused(refusal: TravellerInvoiceRefusal): HttpException {
    const messages: Record<TravellerInvoiceRefusal, string> = {
      anonymized: 'This booking has been anonymized',
      reservation_cancelled: 'A cancelled booking is not invoiced',
      invoice_exists: 'This booking already has an invoice',
      no_price: 'This booking has no price',
      already_requested: 'An invoice has already been asked for',
    };
    return new HttpException(httpStatus.CONFLICT, messages[refusal], refusal);
  }

  private refused(refusal: InvoiceRefusal, missing: string[]): HttpException {
    const messages: Record<InvoiceRefusal, string> = {
      billing_incomplete: 'The invoicing details are incomplete',
      anonymized: 'This booking has been anonymized',
      reservation_cancelled: 'A cancelled booking is not invoiced',
      no_price: 'This booking has no price',
      invoice_exists: 'This booking already has an invoice',
    };
    return new HttpException(httpStatus.CONFLICT, messages[refusal], refusal, refusal === 'billing_incomplete' ? { missing } : undefined);
  }

  private customerOf(booking: BookingForInvoice, input: Record<string, unknown>): InvoiceCustomer {
    const read = (key: string, max: number) => {
      const v = input[key];
      if (v == null || v === '') return null;
      if (typeof v !== 'string') throw new ValidationException({ [key]: 'invalid' });
      const t = v.replace(/\r/g, '').trim();
      if (t.length > max) throw new ValidationException({ [key]: 'too_long' });
      return t || null;
    };
    return {
      name: booking.customerName,
      email: booking.customerEmail || null,
      company: read('customerCompany', MAX_COMPANY),
      address: read('customerAddress', MAX_ADDRESS),
    };
  }

  private documentOf(
    booking: BookingForInvoice,
    operator: OperatorBilling,
    customer: InvoiceCustomer,
    issue: { kind: 'invoice' | 'credit_note'; number: string | null; issuedAt: Date; creditOfNumber: string | null },
  ): InvoiceDocument {
    const tz = booking.parking.timezone;
    const s = settingsOf(operator);
    const vatRateBp = s.vatExempt ? 0 : s.vatRateBp;
    const stay = `${booking.handover === 'valet' ? 'Stationnement avec voiturier' : 'Stationnement avec navette'} · ${booking.parking.name}`;
    const detail = `Du ${frDateTime(booking.arrivalAt, tz)} au ${frDateTime(booking.returnAt, tz)}${booking.plate ? ` · véhicule ${booking.plate}` : ''}`;
    const items = [
      { label: stay, detail, totalTtcCents: booking.priceCents ?? 0 },
      ...booking.extras.map(e => ({ label: e.label, detail: 'Service additionnel', totalTtcCents: e.priceCents })),
      ...booking.surcharges.map(x => ({ label: x.label, detail: 'Supplément', totalTtcCents: x.amountCents })),
    ];
    const totals = invoiceLines(items, vatRateBp);
    const seller: InvoiceSeller = {
      tradeName: operator.name,
      legalName: s.legalName!,
      address: (s.address?.trim() || booking.parking.address || '').trim(),
      siret: s.siret!,
      vatNumber: s.vatExempt ? s.vatNumber || null : s.vatNumber,
      vatExempt: s.vatExempt,
      mention: s.mention,
    };
    return {
      kind: issue.kind,
      number: issue.number,
      issuedOn: frDate(issue.issuedAt, tz),
      reference: booking.reference,
      plate: booking.plate || null,
      creditOfNumber: issue.creditOfNumber,
      seller,
      customer,
      vatRateBp,
      ...totals,
      paidBy: paidBy(booking) as PaidBy | null,
    };
  }

  private async nextSequence(tx: Prisma.TransactionClient, operatorId: string, kind: 'invoice' | 'credit_note', year: number) {
    const last = await tx.invoice.aggregate({ where: { operatorId, kind, year }, _max: { sequence: true } });
    return (last._max.sequence ?? 0) + 1;
  }

  private async logoOf(key: string | null): Promise<InvoiceLogo | null> {
    if (!key) return null;
    try {
      const logo = await this.storage.get(key);
      if (!logo) return null;
      return { bytes: await toBuffer(logo.stream), contentType: logo.contentType };
    } catch (error) {
      logger.warn(`[Invoices] Logo not read: ${error instanceof Error ? error.name : 'unknown error'}`);
      return null;
    }
  }

  private async invoicesOf(operatorId: string, reservationId: string): Promise<InvoiceView[]> {
    const rows = await prisma.invoice.findMany({
      where: { operatorId, reservationId },
      orderBy: [{ issuedAt: 'desc' }, { sequence: 'desc' }],
      omit: { pdf: true },
    });
    return this.views(rows);
  }

  private async views(rows: Omit<Invoice, 'pdf'>[]): Promise<InvoiceView[]> {
    const ids = rows.map(r => r.id);
    const credits = await prisma.invoice.findMany({ where: { creditOfId: { in: ids } }, select: { creditOfId: true, number: true } });
    const creditOfIds = rows.map(r => r.creditOfId).filter((v): v is string => !!v);
    const originals = await prisma.invoice.findMany({ where: { id: { in: creditOfIds } }, select: { id: true, number: true } });
    return rows.map(r => ({
      id: r.id,
      kind: r.kind,
      number: r.number,
      issuedAt: r.issuedAt.toISOString(),
      totalTtcCents: r.totalTtcCents,
      customer: r.customer as unknown as InvoiceCustomer,
      issuer: (r.seller as unknown as InvoiceSeller).tradeName,
      sentAt: r.sentAt?.toISOString() ?? null,
      sentTo: r.sentTo,
      creditOf: r.creditOfId ? (originals.find(o => o.id === r.creditOfId)?.number ?? null) : null,
      creditedBy: credits.find(c => c.creditOfId === r.id)?.number ?? null,
    }));
  }
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** The e-mail that carries the PDF, in the parking's name. */
export function invoiceEmail(
  tradeName: string,
  customerName: string,
  kind: 'invoice' | 'credit_note',
  number: string,
  totalTtcCents: number,
): EmailMessage {
  const what = kind === 'credit_note' ? 'votre avoir' : 'votre facture';
  const subject = `${kind === 'credit_note' ? 'Votre avoir' : 'Votre facture'} ${number} · ${tradeName}`;
  const first = customerName.split(' ')[0] || customerName;
  const text = [
    `Bonjour ${first},`,
    '',
    `Vous trouverez ${what} ${number} de ${euros(totalTtcCents)} en pièce jointe.`,
    '',
    `Merci d'avoir choisi ${tradeName}.`,
    tradeName,
  ].join('\n');
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#1a1d1a">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<div style="background:#ffffff;border-radius:14px;padding:24px">
<p style="margin:0 0 12px;font-size:15px">Bonjour ${escapeHtml(first)},</p>
<p style="margin:0 0 12px;font-size:15px;line-height:1.5">Vous trouverez ${what} <b>${escapeHtml(number)}</b> de <b>${escapeHtml(euros(totalTtcCents))}</b> en pièce jointe.</p>
<p style="margin:0;font-size:15px;line-height:1.5">Merci d'avoir choisi ${escapeHtml(tradeName)}.<br>${escapeHtml(tradeName)}</p>
</div></div></body></html>`;
  return { subject, html, text };
}

/** To the traveller, once the invoice they asked for is issued. */
export function invoiceReadyPush(tradeName: string, number: string, totalTtcCents: number) {
  return { title: 'Votre facture est prête', body: `${tradeName} · ${number} · ${euros(totalTtcCents)}` };
}

/** To the team, when a traveller asks for an invoice. */
export function invoiceRequestedPush(customerName: string, reference: string) {
  return { title: 'Facture demandée', body: `${customerName} · réservation ${reference}` };
}
