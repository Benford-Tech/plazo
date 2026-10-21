import httpStatus from 'http-status';
import Stripe from 'stripe';
import { Container, Service } from 'typedi';
import prisma, { ExtraKind, Operator, Prisma, Reservation, ReservationExtra } from '@/database';
import {
  ACTIVE_EXTRA_STATUSES,
  CLOSED_BOOKING_STATUSES,
  EXTRA_KINDS,
  MAX_EXTRA_PRICE_CENTS,
  MAX_LEAD_HOURS,
  MIN_EXTRA_PRICE_CENTS,
  checkBookingExtras,
  enabledOffersFrom,
  offerList,
  extraDonePush,
  extraOrderedPush,
  extraRefundedPush,
  orderDeadline,
  orderRefusal,
  OrderRefusal,
} from '@/domain/extras';
import { payoutDueAt } from '@/domain/payout';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { ValidationException } from '@/middlewares/validation.middleware';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { PaymentService } from './payment.service';
import { PublicBookingService } from './public-booking.service';
import { PushService } from './push.service';
import { STAFF_VISIBLE } from './reservation.service';
import { StripeService } from './stripe.service';

type Tx = Prisma.TransactionClient;
type Client = Tx | typeof prisma;
// Interactive transactions that call Stripe while holding a row lock (as for the bookings).
const STRIPE_TX = { timeout: 30000, maxWait: 10000 };

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Service not found', 'not_found');
const unavailable = () => new HttpException(httpStatus.CONFLICT, 'Online payment is not available', 'online_booking_unavailable');

/** A service as the parking offers it (settings) or as the traveller can order it. */
export type ExtraOffer = { kind: ExtraKind; label: string; description: string; priceCents: number };

export type ExtraOrderView = {
  id: string;
  kind: ExtraKind;
  label: string;
  priceCents: number;
  status: ReservationExtra['status'];
  withBooking: boolean;
  paidAt: string | null;
  doneAt: string | null;
  refusedAt: string | null;
  refusedReason: string | null;
  refundedAt: string | null;
};

export type ExtraPayment = { clientSecret: string; paymentIntentId: string; amountCents: number; currency: string };

function stripeErrorName(error: unknown): string {
  if (error && typeof error === 'object' && 'type' in error && typeof (error as { type: unknown }).type === 'string') {
    return (error as { type: string }).type;
  }
  return error instanceof Error ? error.name : 'unknown error';
}

const chargeOf = (intent: Stripe.PaymentIntent) =>
  typeof intent.latest_charge === 'string' ? intent.latest_charge : (intent.latest_charge?.id ?? null);

function orderView(e: ReservationExtra): ExtraOrderView {
  return {
    id: e.id,
    kind: e.kind,
    label: e.label,
    priceCents: e.priceCents,
    status: e.status,
    withBooking: e.withBooking,
    paidAt: e.paidAt?.toISOString() ?? null,
    doneAt: e.doneAt?.toISOString() ?? null,
    refusedAt: e.refusedAt?.toISOString() ?? null,
    refusedReason: e.refusedReason,
    refundedAt: e.refundedAt?.toISOString() ?? null,
  };
}

/** Orders a traveller or the team sees: paid ones (never a payment left half-way). */
const SHOWN = { status: { in: ['ordered', 'done', 'refused', 'refunded'] as ReservationExtra['status'][] } };

/**
 * Services for the car (21/10/2026): the parking's offer and prices, the traveller's orders in the Plazo app (with the
 * booking, or later in their own payment sheet), the team's « Fait » / « Pas possible », the refunds and the payouts.
 * The money goes like the booking's: Plazo takes it, keeps its commission, and transfers the operator's share on the
 * booking's payout date, once the service is done.
 */
@Service()
export class ExtraService {
  public audit = Container.get(AuditService);
  public payments = Container.get(PaymentService);
  public push = Container.get(PushService);
  public stripe = Container.get(StripeService);

  // Lazy: PublicBookingService prices the services asked at booking with this service.
  private get bookings(): PublicBookingService {
    return Container.get(PublicBookingService);
  }

  // ---- The parking's offer ----------------------------------------------------------------------------------------

  /** Every service with the parking's price (the default when never set) and whether it is offered. */
  public async offersOf(parkingId: string, client: Client = prisma) {
    return offerList(await client.parkingExtra.findMany({ where: { parkingId } }));
  }

  /** What a traveller can order on this parking (offered services only). */
  public async enabledOffers(parkingId: string, client: Client = prisma): Promise<ExtraOffer[]> {
    return enabledOffersFrom(await client.parkingExtra.findMany({ where: { parkingId } }));
  }

  private async ownParking(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await prisma.parking.findFirst({ where: { id: parkingId, operatorId: actor.operatorId } });
    if (!parking) throw new HttpException(httpStatus.NOT_FOUND, 'Parking not found', 'not_found');
    return parking;
  }

  /** GET /internal/parkings/:id/extras */
  public async settings(actor: AuthenticatedStaff, parkingId: string) {
    const parking = await this.ownParking(actor, parkingId);
    return { leadHours: parking.extrasLeadHours, offers: await this.offersOf(parking.id) };
  }

  /** PUT /internal/parkings/:id/extras { leadHours?, offers?: [{ kind, enabled, priceCents }] } */
  public async updateSettings(actor: AuthenticatedStaff, parkingId: string, body: { leadHours?: unknown; offers?: unknown }) {
    const parking = await this.ownParking(actor, parkingId);
    const fields: Record<string, string> = {};
    let leadHours: number | undefined;
    if (body.leadHours !== undefined) {
      if (typeof body.leadHours !== 'number' || !Number.isInteger(body.leadHours) || body.leadHours < 0 || body.leadHours > MAX_LEAD_HOURS) {
        fields.leadHours = 'invalid';
      } else leadHours = body.leadHours;
    }
    const offers: { kind: ExtraKind; enabled: boolean; priceCents: number }[] = [];
    if (body.offers !== undefined) {
      if (!Array.isArray(body.offers)) fields.offers = 'invalid';
      else {
        for (const raw of body.offers as unknown[]) {
          const o = (raw ?? {}) as { kind?: unknown; enabled?: unknown; priceCents?: unknown };
          if (typeof o.kind !== 'string' || !EXTRA_KINDS.includes(o.kind as ExtraKind) || offers.some(x => x.kind === o.kind)) {
            fields.offers = 'invalid';
            continue;
          }
          const kind = o.kind as ExtraKind;
          if (typeof o.enabled !== 'boolean') fields[`offers.${kind}.enabled`] = 'invalid';
          if (typeof o.priceCents !== 'number' || !Number.isInteger(o.priceCents)) fields[`offers.${kind}.priceCents`] = 'invalid';
          else if (o.priceCents < MIN_EXTRA_PRICE_CENTS || o.priceCents > MAX_EXTRA_PRICE_CENTS) fields[`offers.${kind}.priceCents`] = 'range';
          offers.push({ kind, enabled: o.enabled === true, priceCents: o.priceCents as number });
        }
      }
    }
    if (Object.keys(fields).length) throw new ValidationException(fields);

    const before = await this.settings(actor, parking.id);
    await prisma.$transaction(async tx => {
      if (leadHours !== undefined) await tx.parking.update({ where: { id: parking.id }, data: { extrasLeadHours: leadHours } });
      for (const o of offers) {
        await tx.parkingExtra.upsert({
          where: { parkingId_kind: { parkingId: parking.id, kind: o.kind } },
          create: { parkingId: parking.id, kind: o.kind, enabled: o.enabled, priceCents: o.priceCents },
          update: { enabled: o.enabled, priceCents: o.priceCents },
        });
      }
      await this.audit.record(
        actor,
        {
          action: 'extras.settings_updated',
          entityType: 'parking',
          entityId: parking.id,
          details: {
            ...(leadHours !== undefined && leadHours !== before.leadHours ? { leadHours: { from: before.leadHours, to: leadHours } } : {}),
            offers: offers.map(o => ({ kind: o.kind, enabled: o.enabled, priceCents: o.priceCents })),
          },
        },
        tx,
      );
    });
    return this.settings(actor, parking.id);
  }

  // ---- At booking -------------------------------------------------------------------------------------------------

  /**
   * The services asked with a booking (the app's « Vos informations »), priced from the parking's offer read under the
   * booking's lock (never the client's prices). 400 extras invalid / not_offered / one_charge.
   */
  public async priceForBooking(
    tx: Tx,
    parkingId: string,
    raw: unknown,
    operator: Pick<Operator, 'commissionBps' | 'stripeAccountId' | 'stripeAccountLive' | 'stripePayoutsEnabled' | 'isDemo'>,
  ) {
    const offers = await this.enabledOffers(parkingId, tx);
    let kinds: ExtraKind[];
    try {
      kinds = checkBookingExtras(
        raw,
        offers.map(o => o.kind),
      );
    } catch (error) {
      throw new ValidationException({ extras: error instanceof Error ? error.message : 'invalid' });
    }
    const rows = kinds.map(kind => {
      const offer = offers.find(o => o.kind === kind)!;
      const { commissionCents, operatorShareCents } = this.payments.split(operator, offer.priceCents);
      return { kind, label: offer.label, priceCents: offer.priceCents, commissionCents, operatorShareCents };
    });
    return { rows, totalCents: rows.reduce((sum, r) => sum + r.priceCents, 0) };
  }

  /** Saves the services asked with a booking just held: paid with it (its own payment). */
  public async createWithBooking(
    tx: Tx,
    reservation: Pick<Reservation, 'id' | 'operatorId'>,
    rows: Awaited<ReturnType<ExtraService['priceForBooking']>>['rows'],
  ) {
    for (const row of rows) {
      await tx.reservationExtra.create({ data: { ...row, reservationId: reservation.id, operatorId: reservation.operatorId, withBooking: true } });
    }
  }

  /** The booking's payment went through: the services paid with it are to do. */
  public async confirmWithBooking(tx: Tx, reservationId: string, now: Date) {
    await tx.reservationExtra.updateMany({
      where: { reservationId, withBooking: true, status: { in: ['pending_payment', 'expired'] } },
      data: { status: 'ordered', paidAt: now, payoutStatus: 'pending' },
    });
  }

  /**
   * The booking was refunded in full: the services paid with it went back with it (their transfer reversed if one was
   * made). Call inside the transaction that refunds the booking.
   */
  public async refundedWithBooking(tx: Tx, reservation: Pick<Reservation, 'id' | 'stripeLive'>, now: Date) {
    const extras = await tx.reservationExtra.findMany({
      where: { reservationId: reservation.id, withBooking: true, status: { in: ['ordered', 'done'] } },
    });
    for (const e of extras) {
      let payoutStatus: 'cancelled' | 'reversed' = 'cancelled';
      if (e.payoutStatus === 'transferred' && e.stripeTransferId && !this.payments.testUnderLiveKeys(reservation)) {
        await this.stripe
          .api()
          .transfers.createReversal(e.stripeTransferId, { metadata: { extraId: e.id } }, { idempotencyKey: `plazo-extra-transfer-reversal-${e.id}` });
        payoutStatus = 'reversed';
      }
      await tx.reservationExtra.update({ where: { id: e.id }, data: { status: 'refunded', refundedAt: now, payoutStatus } });
    }
  }

  // ---- The traveller ----------------------------------------------------------------------------------------------

  private async travellerBooking(reference: string, token: string | undefined) {
    const booking = await this.bookings.load(reference, token);
    return prisma.reservation.findUniqueOrThrow({ where: { id: booking.id }, include: { parking: true, operator: true, extras: true } });
  }

  private refusalOf(
    r: Reservation & { parking: { extrasLeadHours: number }; extras: ReservationExtra[] },
    kind: ExtraKind,
    offered: boolean,
    now: Date,
  ): OrderRefusal | null {
    // A payment sheet left half-way does not block (a new order closes it).
    const active = r.extras
      .filter(e => ACTIVE_EXTRA_STATUSES.includes(e.status) && !(e.status === 'pending_payment' && !e.withBooking))
      .map(e => e.kind);
    if (r.paymentStatus !== 'paid') return 'not_online';
    return orderRefusal(r, kind, { offered, leadHours: r.parking.extrasLeadHours, active, now });
  }

  private async travellerViewOf(r: Reservation & { parking: { id: string; extrasLeadHours: number }; extras: ReservationExtra[] }, now = new Date()) {
    const offers = await this.enabledOffers(r.parking.id);
    const offerList = offers.map(o => {
      const refusal = this.refusalOf(r, o.kind, true, now);
      return { ...o, available: refusal === null, reason: refusal };
    });
    const closed = r.paymentStatus !== 'paid' || offerList.every(o => o.reason === 'closed' || o.reason === 'too_late' || o.reason === 'not_online');
    return {
      offers: offerList,
      orders: r.extras
        .filter(e => SHOWN.status.in.includes(e.status))
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(orderView),
      orderUntil: orderDeadline(r.returnAt, r.parking.extrasLeadHours).toISOString(),
      canOrder: !closed && offerList.some(o => o.available),
    };
  }

  /** GET /public/bookings/:reference/extras */
  public async travellerView(reference: string, token: string | undefined) {
    return this.travellerViewOf(await this.travellerBooking(reference, token));
  }

  private async lockReservation(tx: Tx, id: string) {
    await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
  }

  /**
   * POST /public/bookings/:reference/extras { kind }: a new order and its PaymentIntent for the app's payment sheet (the
   * one already started again for the same service). Another service's sheet left half-way is closed first.
   * 409 not_offered, closed, too_late, already_ordered, one_charge, not_online.
   */
  public async order(
    reference: string,
    token: string | undefined,
    rawKind: unknown,
  ): Promise<{ extra: ExtraOrderView; payment: ExtraPayment | { paid: true } }> {
    if (typeof rawKind !== 'string' || !EXTRA_KINDS.includes(rawKind as ExtraKind)) throw new ValidationException({ kind: 'invalid' });
    const kind = rawKind as ExtraKind;
    if (!this.payments.enabled()) throw unavailable();
    const booking = await this.bookings.load(reference, token);
    const confirmLater: Stripe.PaymentIntent[] = [];
    const result = await prisma.$transaction(async tx => {
      await this.lockReservation(tx, booking.id);
      const r = await tx.reservation.findUniqueOrThrow({ where: { id: booking.id }, include: { parking: true, operator: true, extras: true } });
      const api = this.stripe.api();

      for (const e of r.extras.filter(x => x.status === 'pending_payment' && !x.withBooking && x.stripePaymentIntentId)) {
        if (this.payments.testUnderLiveKeys(e)) {
          await tx.reservationExtra.update({ where: { id: e.id }, data: { status: 'expired' } });
          e.status = 'expired';
          continue;
        }
        if (e.kind === kind) {
          const intent = await api.paymentIntents.retrieve(e.stripePaymentIntentId!);
          if (intent.status === 'succeeded') {
            confirmLater.push(intent);
            return { extra: orderView(e), payment: { paid: true as const } };
          }
          if (intent.status !== 'canceled' && intent.client_secret) {
            return {
              extra: orderView(e),
              payment: { clientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency },
            };
          }
        } else {
          const intent = await this.payments.closeIntent(e.stripePaymentIntentId!);
          if (intent.status === 'succeeded') {
            // Paid meanwhile: it stands (confirmed below), and the rules apply to it.
            confirmLater.push(intent);
            e.status = 'ordered';
            continue;
          }
        }
        await tx.reservationExtra.update({ where: { id: e.id }, data: { status: 'expired' } });
        e.status = 'expired';
      }

      const offers = await this.enabledOffers(r.parkingId, tx);
      const offer = offers.find(o => o.kind === kind);
      const refusal = this.refusalOf(r, kind, !!offer, new Date());
      if (refusal) throw new HttpException(httpStatus.CONFLICT, `This service cannot be ordered (${refusal})`, refusal);
      if (this.payments.modeFor(r.operator) !== 'online') throw unavailable();
      const amounts = this.payments.split(r.operator, offer!.priceCents);
      const extra = await tx.reservationExtra.create({
        data: {
          reservationId: r.id,
          operatorId: r.operatorId,
          kind,
          label: offer!.label,
          priceCents: amounts.chargedCents,
          commissionCents: amounts.commissionCents,
          operatorShareCents: amounts.operatorShareCents,
          stripeLive: this.payments.live(),
        },
      });
      const intent = await api.paymentIntents.create(
        {
          amount: amounts.chargedCents,
          currency: 'eur',
          automatic_payment_methods: { enabled: true },
          receipt_email: r.customerEmail ?? undefined,
          description: `${offer!.label} · réservation ${r.reference}`,
          // extraId only: a booking's confirmation never reads this intent.
          metadata: { extraId: extra.id },
          transfer_group: r.id,
        },
        { idempotencyKey: `plazo-extra-intent-${extra.id}` },
      );
      const saved = await tx.reservationExtra.update({ where: { id: extra.id }, data: { stripePaymentIntentId: intent.id } });
      if (!intent.client_secret) throw new HttpException(httpStatus.BAD_GATEWAY, 'No payment intent', 'payment_failed');
      return {
        extra: orderView(saved),
        payment: { clientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents: intent.amount, currency: intent.currency },
      };
    }, STRIPE_TX);
    for (const intent of confirmLater) await this.confirmIntent(intent, 'return');
    if ('paid' in result.payment) {
      const fresh = await prisma.reservationExtra.findUniqueOrThrow({ where: { id: result.extra.id } });
      return { extra: orderView(fresh), payment: { paid: true } };
    }
    return result;
  }

  /** POST /public/bookings/:reference/extras/:id/sync: after the payment sheet, reads Stripe (the webhook may lag). */
  public async sync(reference: string, token: string | undefined, extraId: string) {
    const r = await this.travellerBooking(reference, token);
    const extra = r.extras.find(e => e.id === extraId);
    if (!extra) throw notFound();
    if (extra.status === 'pending_payment' && extra.stripePaymentIntentId && this.payments.enabled() && !this.payments.testUnderLiveKeys(extra)) {
      try {
        const intent = await this.stripe.api().paymentIntents.retrieve(extra.stripePaymentIntentId);
        if (intent.status === 'succeeded') await this.confirmIntent(intent, 'return');
      } catch (error) {
        logger.warn(`[Extras] Could not check the payment of service ${extra.id}: ${stripeErrorName(error)}`);
      }
    }
    return this.travellerView(reference, token);
  }

  /** DELETE /public/bookings/:reference/extras/:id: the traveller closed the payment sheet (nothing charged). */
  public async abandon(reference: string, token: string | undefined, extraId: string) {
    const r = await this.travellerBooking(reference, token);
    const extra = r.extras.find(e => e.id === extraId);
    if (!extra) throw notFound();
    if (extra.status === 'pending_payment' && !extra.withBooking) {
      let succeeded: Stripe.PaymentIntent | null = null;
      if (extra.stripePaymentIntentId && this.payments.enabled() && !this.payments.testUnderLiveKeys(extra)) {
        const intent = await this.payments.closeIntent(extra.stripePaymentIntentId);
        if (intent.status === 'succeeded') succeeded = intent;
      }
      if (succeeded) await this.confirmIntent(succeeded, 'return');
      else await prisma.reservationExtra.updateMany({ where: { id: extra.id, status: 'pending_payment' }, data: { status: 'expired' } });
    }
    return this.travellerView(reference, token);
  }

  /**
   * A succeeded PaymentIntent of a service (webhook, or the traveller's return): to do. Idempotent. One paid after it was
   * given up (expired) is refunded at once. Returns true when the intent was a service's.
   */
  public async confirmIntent(intent: Stripe.PaymentIntent, source: 'return' | 'webhook'): Promise<boolean> {
    const extraId = intent.metadata?.extraId;
    if (!extraId) return false;
    if (intent.status !== 'succeeded') return true;
    const outcome = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservation_extras WHERE id = ${extraId} FOR UPDATE`;
      const e = await tx.reservationExtra.findUnique({ where: { id: extraId }, include: { reservation: true } });
      if (!e) {
        logger.error(`[Extras] Paid payment intent ${intent.id}: service ${extraId} not found`);
        return 'ignored' as const;
      }
      const amount = intent.amount_received || intent.amount;
      if (amount !== e.priceCents || intent.currency !== 'eur' || e.stripePaymentIntentId !== intent.id) {
        logger.error(`[Extras] Payment intent ${intent.id} does not match service ${extraId}: not confirmed`);
        return 'ignored' as const;
      }
      if (e.status !== 'pending_payment' && e.status !== 'expired') return 'already' as const;
      const now = new Date();
      const late = e.status === 'expired' || CLOSED_BOOKING_STATUSES.includes(e.reservation.status);
      await tx.reservationExtra.update({
        where: { id: e.id },
        data: { status: 'ordered', paidAt: now, payoutStatus: 'pending', stripeChargeId: chargeOf(intent) },
      });
      await this.audit.record(
        { id: null, operatorId: e.operatorId },
        {
          action: 'extra.paid',
          entityType: 'reservation',
          entityId: e.reservationId,
          details: { extraId: e.id, kind: e.kind, priceCents: e.priceCents, source, ...(late ? { late: true } : {}) },
        },
        tx,
      );
      return late ? ('refund' as const) : ('confirmed' as const);
    });
    if (outcome === 'confirmed') {
      logger.info(`[Extras] Service ${extraId} paid (${source})`);
      await this.notifyOrdered(extraId);
    } else if (outcome === 'refund') {
      logger.warn(`[Extras] Service ${extraId} paid after it was given up: refunding`);
      await this.refund(extraId, 'refunded', null);
    }
    return true;
  }

  private async notifyOrdered(extraId: string) {
    try {
      const e = await prisma.reservationExtra.findUniqueOrThrow({ where: { id: extraId }, include: { reservation: true } });
      await this.push.notifyStaff(e.operatorId, 'bookingChanges', extraOrderedPush(e.label, e.reservation.plate, e.reservation.customerName), {
        data: { type: 'booking', event: 'extra_ordered', reservationId: e.reservationId },
        collapseId: `extra-${e.id}`,
      });
    } catch (error) {
      logger.warn(`[Extras] Team not told of service ${extraId}: ${error instanceof Error ? error.name : 'unknown error'}`);
    }
  }

  // ---- Refunds ----------------------------------------------------------------------------------------------------

  /**
   * Refunds one service still to do (« Pas possible », not done by the handover, booking cancelled): its own payment in
   * full, or its share of the booking's payment. Returns false when there was nothing to refund (done meanwhile…).
   */
  public async refund(extraId: string, as: 'refused' | 'refunded', actor: AuthenticatedStaff | null, reason?: string | null): Promise<boolean> {
    const done = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT id FROM reservation_extras WHERE id = ${extraId} FOR UPDATE`;
      const e = await tx.reservationExtra.findUniqueOrThrow({ where: { id: extraId }, include: { reservation: true } });
      if (e.status !== 'ordered') return false;
      const now = new Date();
      let refundId: string | null = null;
      const live = e.withBooking ? e.reservation : e;
      if (!this.payments.testUnderLiveKeys(live)) {
        const api = this.stripe.api();
        const paymentIntent = e.withBooking ? e.reservation.stripePaymentIntentId : e.stripePaymentIntentId;
        if (!paymentIntent) throw new HttpException(httpStatus.BAD_GATEWAY, 'Payment not found', 'refund_failed');
        try {
          const refund = await api.refunds.create(
            { payment_intent: paymentIntent, ...(e.withBooking ? { amount: e.priceCents } : {}), metadata: { extraId: e.id } },
            { idempotencyKey: `plazo-extra-refund-${e.id}` },
          );
          refundId = refund.id;
        } catch (error) {
          logger.error(`[Extras] Refund of service ${e.id} failed: ${stripeErrorName(error)}`);
          throw new HttpException(httpStatus.BAD_GATEWAY, 'The refund failed, please try again', 'refund_failed');
        }
      }
      await tx.reservationExtra.update({
        where: { id: e.id },
        data: {
          status: as,
          refundedAt: now,
          stripeRefundId: refundId,
          payoutStatus: 'cancelled',
          ...(as === 'refused' ? { refusedAt: now, refusedById: actor?.id ?? null, refusedReason: reason?.trim() || null } : {}),
        },
      });
      await this.audit.record(
        actor ?? { id: null, operatorId: e.operatorId },
        {
          action: as === 'refused' ? 'extra.refused' : 'extra.refunded',
          entityType: 'reservation',
          entityId: e.reservationId,
          details: { extraId: e.id, kind: e.kind, priceCents: e.priceCents },
        },
        tx,
      );
      return true;
    }, STRIPE_TX);
    if (done) {
      const e = await prisma.reservationExtra.findUniqueOrThrow({ where: { id: extraId } });
      await this.push
        .notifyTravellers([e.reservationId], extraRefundedPush(e.label, e.priceCents), {
          data: { type: 'booking', event: 'extra_refunded', reservationId: e.reservationId },
        })
        .catch(() => 0);
    }
    return done;
  }

  // ---- The team ---------------------------------------------------------------------------------------------------

  private async ownReservation(actor: AuthenticatedStaff, id: string) {
    const r = await prisma.reservation.findFirst({ where: { id, operatorId: actor.operatorId, AND: [STAFF_VISIBLE] }, include: { extras: true } });
    if (!r) throw new HttpException(httpStatus.NOT_FOUND, 'Reservation not found', 'not_found');
    return r;
  }

  private async staffViewOf(reservationId: string) {
    const rows = await prisma.reservationExtra.findMany({
      where: { reservationId, ...SHOWN },
      include: { doneBy: { select: { firstName: true } }, refusedBy: { select: { firstName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return {
      extras: rows.map(e => ({ ...orderView(e), doneBy: e.doneBy?.firstName ?? null, refusedBy: e.refusedBy?.firstName ?? null })),
    };
  }

  /** GET /internal/reservations/:id/extras */
  public async staffOrders(actor: AuthenticatedStaff, id: string) {
    const r = await this.ownReservation(actor, id);
    return this.staffViewOf(r.id);
  }

  private async ownOrder(actor: AuthenticatedStaff, id: string, extraId: string) {
    const r = await this.ownReservation(actor, id);
    const e = r.extras.find(x => x.id === extraId && SHOWN.status.in.includes(x.status));
    if (!e) throw notFound();
    return { r, e };
  }

  /** POST /internal/reservations/:id/extras/:extraId/done (« Fait »): the traveller hears it. 409 not_to_do. */
  public async markDone(actor: AuthenticatedStaff, id: string, extraId: string) {
    const { e } = await this.ownOrder(actor, id, extraId);
    const now = new Date();
    const changed = await prisma.$transaction(async tx => {
      const { count } = await tx.reservationExtra.updateMany({
        where: { id: e.id, status: 'ordered' },
        data: { status: 'done', doneAt: now, doneById: actor.id },
      });
      if (count) {
        await this.audit.record(
          actor,
          { action: 'extra.done', entityType: 'reservation', entityId: id, details: { extraId: e.id, kind: e.kind } },
          tx,
        );
      }
      return count > 0;
    });
    if (!changed) throw new HttpException(httpStatus.CONFLICT, 'This service is not to do', 'not_to_do');
    await this.push
      .notifyTravellers([id], extraDonePush(e.kind), {
        data: { type: 'booking', event: 'extra_done', reservationId: id },
        collapseId: `extra-${e.id}`,
      })
      .catch(() => 0);
    return this.staffViewOf(id);
  }

  /** POST /internal/reservations/:id/extras/:extraId/refuse { reason? } (« Pas possible »): refunded. 409 not_to_do. */
  public async refuse(actor: AuthenticatedStaff, id: string, extraId: string, rawReason: unknown) {
    const { e } = await this.ownOrder(actor, id, extraId);
    const reason = typeof rawReason === 'string' ? rawReason.trim().slice(0, 200) : null;
    if (!(await this.refund(e.id, 'refused', actor, reason))) throw new HttpException(httpStatus.CONFLICT, 'This service is not to do', 'not_to_do');
    return this.staffViewOf(id);
  }

  /** Services still to do on the operator's bookings, the next returns first (the dashboard). */
  public async dueFor(operatorId: string, until: Date) {
    return prisma.reservationExtra.findMany({
      where: {
        operatorId,
        status: 'ordered',
        reservation: { status: { notIn: [...CLOSED_BOOKING_STATUSES, 'pending_payment'] }, returnAt: { lte: until } },
      },
      select: { id: true, kind: true, label: true, reservation: { select: { id: true, returnAt: true, plate: true, customerName: true } } },
      orderBy: { reservation: { returnAt: 'asc' } },
    });
  }

  // ---- Cron -------------------------------------------------------------------------------------------------------

  /**
   * Every 15 minutes (remind-tomorrow): a service still to do on a booking whose car was handed back, or that was
   * cancelled or a no-show, is refunded; a service sheet started more than a day ago and never paid is given up.
   */
  public async settle(now = new Date()) {
    const result = { refunded: 0, failed: 0, expired: 0 };
    const due = await prisma.reservationExtra.findMany({
      where: { status: 'ordered', reservation: { status: { in: [...CLOSED_BOOKING_STATUSES] } } },
      select: { id: true },
      take: 50,
    });
    for (const { id } of due) {
      try {
        if (await this.refund(id, 'refunded', null)) result.refunded += 1;
      } catch {
        result.failed += 1;
      }
    }
    const stale = await prisma.reservationExtra.findMany({
      where: { status: 'pending_payment', withBooking: false, createdAt: { lt: new Date(now.getTime() - 86400000) } },
      select: { id: true, stripePaymentIntentId: true, stripeLive: true },
      take: 50,
    });
    for (const e of stale) {
      try {
        if (e.stripePaymentIntentId && this.payments.enabled() && !this.payments.testUnderLiveKeys(e)) {
          const intent = await this.payments.closeIntent(e.stripePaymentIntentId);
          if (intent.status === 'succeeded') {
            await this.confirmIntent(intent, 'webhook');
            continue;
          }
        }
        await prisma.reservationExtra.updateMany({ where: { id: e.id, status: 'pending_payment' }, data: { status: 'expired' } });
        result.expired += 1;
      } catch (error) {
        logger.warn(`[Extras] Service ${e.id} not closed: ${stripeErrorName(error)}`);
      }
    }
    return result;
  }

  /**
   * GET /internal/cron/payouts (daily): the operator's share of every service done, on its booking's payout date, like
   * the booking's own share (an account not ready keeps it pending).
   */
  public async runPayouts(now = new Date()) {
    const result = { transferred: 0, notDue: 0, waitingForAccount: 0, failed: 0, skipped: 0, testPayments: 0 };
    const rows = await prisma.reservationExtra.findMany({
      where: { status: 'done', payoutStatus: 'pending' },
      include: { reservation: { include: { parking: { select: { timezone: true } }, operator: true } } },
      orderBy: { id: 'asc' },
      take: 200,
    });
    for (const e of rows) {
      const r = e.reservation;
      const live = e.withBooking ? r : e;
      if (this.payments.testUnderLiveKeys(live)) {
        await prisma.reservationExtra.updateMany({ where: { id: e.id, payoutStatus: 'pending' }, data: { payoutStatus: 'cancelled' } });
        result.testPayments += 1;
        continue;
      }
      if (now < payoutDueAt(r.operator.payoutSchedule, r, r.parking.timezone)) {
        result.notDue += 1;
        continue;
      }
      const account = this.payments.accountOf(r.operator);
      if (!account || !r.operator.stripeChargesEnabled) {
        result.waitingForAccount += 1;
        continue;
      }
      result[await this.transferShare(e.id, account)] += 1;
    }
    return result;
  }

  private async transferShare(id: string, destination: string): Promise<'transferred' | 'failed' | 'skipped'> {
    try {
      return await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT id FROM reservation_extras WHERE id = ${id} FOR UPDATE`;
        const e = await tx.reservationExtra.findUniqueOrThrow({ where: { id }, include: { reservation: true } });
        if (e.status !== 'done' || e.payoutStatus !== 'pending') return 'skipped' as const;
        const api = this.stripe.api();
        let chargeId = e.withBooking ? e.reservation.stripeChargeId : e.stripeChargeId;
        const intentId = e.withBooking ? e.reservation.stripePaymentIntentId : e.stripePaymentIntentId;
        if (!chargeId && intentId) chargeId = chargeOf(await api.paymentIntents.retrieve(intentId));
        if (!chargeId) throw new Error('Charge not found');
        const transfer = await api.transfers.create(
          {
            amount: e.operatorShareCents,
            currency: 'eur',
            destination,
            transfer_group: e.reservationId,
            source_transaction: chargeId,
            metadata: { extraId: e.id, reservationId: e.reservationId },
          },
          { idempotencyKey: `plazo-extra-transfer-${e.id}` },
        );
        await tx.reservationExtra.update({
          where: { id },
          data: {
            payoutStatus: 'transferred',
            stripeTransferId: transfer.id,
            transferredAt: new Date(),
            ...(e.withBooking ? {} : { stripeChargeId: chargeId }),
          },
        });
        await this.audit.record(
          { id: null, operatorId: e.operatorId },
          {
            action: 'extra.payout',
            entityType: 'reservation',
            entityId: e.reservationId,
            details: { extraId: e.id, amountCents: e.operatorShareCents },
          },
          tx,
        );
        return 'transferred' as const;
      }, STRIPE_TX);
    } catch (error) {
      const type = stripeErrorName(error);
      if (type === 'StripeInvalidRequestError' || type === 'StripePermissionError') {
        await prisma.reservationExtra.updateMany({ where: { id, payoutStatus: 'pending' }, data: { payoutStatus: 'failed' } });
        logger.error(`[Extras] Service ${id}: transfer refused (${type}), payout marked failed`);
        return 'failed';
      }
      logger.warn(`[Extras] Service ${id}: transfer not made (${type}), retried on the next run`);
      return 'skipped';
    }
  }
}
