import { randomUUID } from 'crypto';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import { Container, Service } from 'typedi';
import {
  isLiveStripeKey,
  PLATFORM_COMMISSION_BPS,
  paymentsEnabled,
  PRODUCT_NAME,
  PUBLIC_SITE_URL,
  SECRET_KEY,
  stripePublishableKey,
  stripeSecretKey,
  stripeWebhookSecrets,
} from '@/config';
import prisma, { Operator, PayoutSchedule, Prisma, Reservation } from '@/database';
import { manageToken } from '@/domain/booking';
import { toPublicBooking, WITH_LISTING } from '@/domain/booking-view';
import { confirmationSms, formatLocalShort } from '@/domain/booking-messages';
import { splitPayment } from '@/domain/pricing';
import { payoutDueAt } from '@/domain/payout';
import { AuthenticatedStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';
import { AuditService } from './audit.service';
import { CapacityService } from './capacity.service';
import { NotificationService } from './notification.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { StripeService } from './stripe.service';

type Client = Prisma.TransactionClient | typeof prisma;
type RefundFields = { paymentStatus: 'refunded'; refundedAt: Date; stripeRefundId: string; payoutStatus: 'cancelled' | 'reversed' };
type PaymentOperator = Pick<Operator, 'commissionBps' | 'stripeAccountId' | 'stripePayoutsEnabled' | 'isDemo'>;

/** The app's payment sheet: the PaymentIntent to confirm, or the news that the booking is paid. */
export type PaymentIntentResult =
  { clientSecret: string; paymentIntentId: string; amountCents: number; currency: string; holdExpiresAt: string } | { paid: true };

/** How a parking is booked on the site: paid online, at the parking, or not bookable online yet. */
export type BookingPaymentMode = 'online' | 'on_site' | 'unavailable';

/** Minutes a place stays held while the traveller pays (Stripe Checkout's shortest expiry). */
export const HOLD_MINUTES = 30;
// Stripe refuses an expires_at less than 30 minutes ahead: keep a margin for the clocks.
const CHECKOUT_MIN_SECONDS = 31 * 60;
// Interactive transactions that call Stripe while holding a row lock.
const STRIPE_TX = { timeout: 30000, maxWait: 10000 };

/** Where Stripe sends the manager back after its onboarding (the pro space's "Sur Plazo" page). */
export const ONBOARDING_RETURN_PATH = '/pro/plazo/fiche';

/** The operator's online payment state, as the pro space shows it. */
export type PaymentStatus = {
  /** False while the platform has no Stripe key: the travellers pay at the parking. */
  enabled: boolean;
  /** A Stripe test key: no real money moves. */
  testMode: boolean;
  connected: boolean;
  /** The onboarding was sent to Stripe (verification pending until payouts are enabled). */
  detailsSubmitted: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  /** Plazo's commission in basis points (null: not set yet). */
  commissionBps: number | null;
  payoutSchedule: PayoutSchedule;
};

export const OPERATOR_PAYMENT_FIELDS = { commissionBps: true, stripeAccountId: true, stripePayoutsEnabled: true, isDemo: true } as const;

const unavailable = () => new HttpException(httpStatus.CONFLICT, 'This parking cannot be booked online yet', 'online_booking_unavailable');
const holdExpired = () => new HttpException(httpStatus.CONFLICT, 'The hold on this place has ended', 'hold_expired');

/** A payment that went through, from a Checkout Session or a PaymentIntent. */
type ConfirmedPayment = {
  reservationId: string | null;
  amountCents: number | null;
  currency: string | null;
  paymentIntentId: string | null;
  checkoutSessionId: string | null;
  /** For the logs: "session cs_…" or "payment intent pi_…" (never personal data). */
  label: string;
};

/** PaymentIntent states in which it can still be cancelled (nothing was charged). */
const CANCELABLE_INTENT: Stripe.PaymentIntent.Status[] = ['requires_payment_method', 'requires_confirmation', 'requires_action', 'requires_capture'];

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  return typeof pi === 'string' ? pi : (pi?.id ?? null);
}

/** Stripe's error type only (its message may quote request data). */
function stripeErrorName(error: unknown): string {
  if (error && typeof error === 'object' && 'type' in error && typeof (error as { type: unknown }).type === 'string') {
    return (error as { type: string }).type;
  }
  return error instanceof Error ? error.name : 'unknown error';
}

/**
 * Online payment of the bookings made on the site, with Stripe Connect: Plazo takes the payment
 * (Stripe Checkout, hosted page), keeps its commission as an application fee and the rest goes to
 * the operator's connected account (destination charge). A booking holds its place while it is
 * paid (pending_payment), until holdExpiresAt.
 */
@Service()
export class PaymentService {
  public audit = Container.get(AuditService);
  public capacity = Container.get(CapacityService);
  public notifications = Container.get(NotificationService);
  public push = Container.get(PushService);
  public sms = Container.get(SmsService);
  public stripe = Container.get(StripeService);
  /** Read from the environment once; tests override it. */
  public settings = { siteUrl: PUBLIC_SITE_URL };

  public enabled(): boolean {
    return paymentsEnabled();
  }

  /** Plazo's commission for an operator, in basis points (null: none configured, no online payment). */
  public commissionBps(operator: Pick<Operator, 'commissionBps'>): number | null {
    return operator.commissionBps ?? PLATFORM_COMMISSION_BPS;
  }

  /**
   * Online as soon as the platform has Stripe keys and the operator a commission: Plazo takes every
   * payment itself. Decision of 06/10/2026 (evening): the operator's connected account is NOT required
   * to be booked; its share stays "pending" (`runPayouts` → waitingForAccount) until it links one, or is
   * paid by hand. Demo operators are never bookable with real money.
   */
  public modeFor(operator: PaymentOperator): BookingPaymentMode {
    if (!this.enabled() || operator.isDemo) return 'unavailable';
    return this.commissionBps(operator) !== null ? 'online' : 'unavailable';
  }

  /** What the traveller pays, split between Plazo's commission and the operator's share (cents). */
  public split(operator: PaymentOperator, priceCents: number): { chargedCents: number; commissionCents: number; operatorShareCents: number } {
    const bps = this.commissionBps(operator);
    if (bps === null) throw unavailable();
    const { commissionCents, operatorCents } = splitPayment(priceCents, bps);
    return { chargedCents: priceCents, commissionCents, operatorShareCents: operatorCents };
  }

  private siteUrl(): string {
    const url = this.settings.siteUrl.replace(/\/+$/, '');
    if (!url) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'PUBLIC_SITE_URL is not set', 'payments_unavailable');
    return url;
  }

  // ---- Holds ----------------------------------------------------------------------------------

  /** Ends the holds whose time is over: their place is free again (lazy expiry, also run by the cron). */
  public async expireLapsedHolds(client: Client = prisma, now = new Date()): Promise<number> {
    const { count } = await client.reservation.updateMany({
      where: { status: 'pending_payment', holdExpiresAt: { lte: now } },
      data: { status: 'cancelled', paymentStatus: 'expired', cancelledAt: now, holdExpiresAt: null },
    });
    return count;
  }

  /** Locks a booking's row until the end of the transaction (payment, refund, release). */
  private async lockRow(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRaw`SELECT id FROM reservations WHERE id = ${id} FOR UPDATE`;
  }

  // ---- Checkout -------------------------------------------------------------------------------

  /**
   * The Stripe Checkout page of a held booking: the open session again, or a new one. Returns
   * { paid: true } when the booking turns out to be paid already.
   */
  public async checkout(reservationId: string): Promise<{ url: string } | { paid: true }> {
    if (!this.enabled()) throw unavailable();
    await this.expireLapsedHolds();
    type Outcome = { url: string } | { paid: true } | { complete: Stripe.Checkout.Session } | { succeeded: Stripe.PaymentIntent };
    const result = await prisma.$transaction(async (tx): Promise<Outcome> => {
      await this.lockRow(tx, reservationId);
      const r = await tx.reservation.findUniqueOrThrow({ where: { id: reservationId }, include: { ...WITH_LISTING, operator: true } });
      if (r.paymentStatus === 'paid') return { paid: true as const };
      if (r.status !== 'pending_payment' || r.paymentStatus !== 'pending' || !r.holdExpiresAt) throw holdExpired();

      // Started in the app's payment sheet: closed first, so that the booking cannot be paid twice.
      if (r.stripePaymentIntentId) {
        const intent = await this.closeIntent(r.stripePaymentIntentId);
        if (intent.status === 'succeeded') return { succeeded: intent };
        await tx.reservation.update({ where: { id: r.id }, data: { stripePaymentIntentId: null } });
      }

      if (r.stripeCheckoutSessionId) {
        const existing = await this.stripe.api().checkout.sessions.retrieve(r.stripeCheckoutSessionId);
        if (existing.status === 'open' && existing.url) return { url: existing.url };
        if (existing.status === 'complete') return { complete: existing };
        // Expired: a new session below.
      }

      const operator = r.operator;
      if (this.modeFor(operator) !== 'online' || r.priceCents === null) throw unavailable();
      const site = this.siteUrl();
      const listing = r.parking.listing!;
      const booking = toPublicBooking(r);
      // Deterministic within a minute, so that a retried call sends the same parameters with the same key.
      const minute = Math.floor(Date.now() / 60000);
      const expiresAt = Math.max(Math.ceil(r.holdExpiresAt.getTime() / 1000), (minute + 1) * 60 + CHECKOUT_MIN_SECONDS);
      // Computed when the place was held (never from the client).
      const amounts = r.chargedCents !== null ? null : this.split(operator, r.priceCents);
      const charged = r.chargedCents ?? amounts!.chargedCents;
      const reference = encodeURIComponent(r.reference);

      const session = await this.stripe.api().checkout.sessions.create(
        {
          mode: 'payment',
          locale: 'fr',
          currency: 'eur',
          customer_email: r.customerEmail ?? undefined,
          client_reference_id: r.id,
          metadata: { reservationId: r.id },
          expires_at: expiresAt,
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: charged,
                product_data: {
                  name: `${listing.title} · ${booking.days} jour${booking.days > 1 ? 's' : ''}`,
                  description: `Réservation ${r.reference} : dépôt le ${formatLocalShort(booking.arrivalAt)}, retour le ${formatLocalShort(booking.returnAt)}`,
                },
              },
            },
          ],
          // Charged on Plazo's account; the operator's share is transferred after the stay
          // (transfer_group links the transfer to this payment in Stripe's dashboard).
          payment_intent_data: {
            transfer_group: r.id,
            description: `Réservation ${r.reference}`,
            metadata: { reservationId: r.id },
          },
          success_url: `${site}/ma-reservation/${reference}?paiement=retour`,
          cancel_url: `${site}/ma-reservation/${reference}/paiement`,
        },
        { idempotencyKey: `plazo-checkout-${r.id}-${r.stripeCheckoutSessionId ?? 'first'}-${minute}` },
      );
      // The hold lasts as long as the payment page.
      await tx.reservation.update({
        where: { id: r.id },
        data: {
          stripeCheckoutSessionId: session.id,
          holdExpiresAt: new Date(Math.max(r.holdExpiresAt.getTime(), expiresAt * 1000)),
          ...(amounts ?? {}),
        },
      });
      if (!session.url) throw new HttpException(httpStatus.BAD_GATEWAY, 'No payment page', 'payment_failed');
      return { url: session.url };
    }, STRIPE_TX);

    if ('complete' in result) {
      // Paid in the meantime (e.g. in another tab): confirm now, outside the row lock.
      await this.confirmPaid(result.complete, 'return');
      return { paid: true };
    }
    if ('succeeded' in result) {
      await this.confirmIntent(result.succeeded, 'return');
      return { paid: true };
    }
    return result;
  }

  // ---- Payment sheet (app) ----------------------------------------------------------------------

  /**
   * The PaymentIntent of a held booking, for the app's native payment sheet (card, Apple Pay,
   * Google Pay): the one already started again, or a new one. Same amount and commission split as
   * Checkout (computed when the place was held), metadata.reservationId for the webhook, and
   * idempotency keys. An open Checkout page of the same booking is closed first (one payment only).
   * Returns { paid: true } when the booking turns out to be paid already. The hold is not extended.
   */
  public async paymentIntent(reservationId: string): Promise<PaymentIntentResult> {
    if (!this.enabled()) throw unavailable();
    await this.expireLapsedHolds();
    type Outcome = PaymentIntentResult | { complete: Stripe.Checkout.Session } | { succeeded: Stripe.PaymentIntent };
    const result = await prisma.$transaction(async (tx): Promise<Outcome> => {
      await this.lockRow(tx, reservationId);
      const r = await tx.reservation.findUniqueOrThrow({ where: { id: reservationId }, include: { operator: true } });
      if (r.paymentStatus === 'paid') return { paid: true as const };
      if (r.status !== 'pending_payment' || r.paymentStatus !== 'pending' || !r.holdExpiresAt) throw holdExpired();
      const api = this.stripe.api();

      // A Checkout page opened on the site: closed (or confirmed, if it was paid meanwhile). Its
      // id stays on the booking: the "expired" webhook then ignores it (a payment intent is set).
      if (r.stripeCheckoutSessionId) {
        const session = await api.checkout.sessions.retrieve(r.stripeCheckoutSessionId);
        if (session.status === 'complete') return { complete: session };
        if (session.status === 'open') await api.checkout.sessions.expire(session.id, {}, { idempotencyKey: `plazo-expire-${session.id}` });
      }

      const intentResult = (intent: Stripe.PaymentIntent): PaymentIntentResult => ({
        clientSecret: intent.client_secret!,
        paymentIntentId: intent.id,
        amountCents: intent.amount,
        currency: intent.currency,
        holdExpiresAt: r.holdExpiresAt!.toISOString(),
      });

      if (r.stripePaymentIntentId) {
        const existing = await api.paymentIntents.retrieve(r.stripePaymentIntentId);
        if (existing.status === 'succeeded') return { succeeded: existing };
        if (existing.status !== 'canceled' && existing.client_secret) return intentResult(existing);
        // Cancelled: a new one below.
      }

      const operator = r.operator;
      if (this.modeFor(operator) !== 'online' || r.priceCents === null) throw unavailable();
      // Computed when the place was held (never from the client).
      const amounts = r.chargedCents !== null ? null : this.split(operator, r.priceCents);
      const charged = r.chargedCents ?? amounts!.chargedCents;
      const intent = await api.paymentIntents.create(
        {
          amount: charged,
          currency: 'eur',
          // Card, Apple Pay and Google Pay (and what the Stripe dashboard enables).
          automatic_payment_methods: { enabled: true },
          receipt_email: r.customerEmail ?? undefined,
          description: `Réservation ${r.reference}`,
          metadata: { reservationId: r.id },
          // Charged on Plazo's account; the operator's share is transferred after the stay.
          transfer_group: r.id,
        },
        { idempotencyKey: `plazo-intent-${r.id}-${r.stripeCheckoutSessionId ?? 'nosession'}-${r.stripePaymentIntentId ?? 'first'}` },
      );
      await tx.reservation.update({ where: { id: r.id }, data: { stripePaymentIntentId: intent.id, ...(amounts ?? {}) } });
      if (!intent.client_secret) throw new HttpException(httpStatus.BAD_GATEWAY, 'No payment intent', 'payment_failed');
      return intentResult(intent);
    }, STRIPE_TX);

    if ('complete' in result) {
      await this.confirmPaid(result.complete, 'return');
      return { paid: true };
    }
    if ('succeeded' in result) {
      await this.confirmIntent(result.succeeded, 'return');
      return { paid: true };
    }
    return result;
  }

  /** Cancels a payment intent that can still be (nothing charged); returns it as it is now. */
  private async closeIntent(id: string): Promise<Stripe.PaymentIntent> {
    const api = this.stripe.api();
    const intent = await api.paymentIntents.retrieve(id);
    if (!CANCELABLE_INTENT.includes(intent.status)) return intent;
    return api.paymentIntents.cancel(id, {}, { idempotencyKey: `plazo-intent-cancel-${id}` });
  }

  /** The app's payment sheet: publishable key and how the sheet presents the merchant. */
  public sheetConfig() {
    const enabled = this.enabled();
    return {
      payments: enabled ? ('online' as const) : ('unavailable' as const),
      publishableKey: enabled ? stripePublishableKey() || null : null,
      merchantDisplayName: PRODUCT_NAME,
      merchantCountryCode: 'FR',
      currency: 'eur',
    };
  }

  /** On the traveller's return (or a page refresh): confirms the booking if Stripe says it is paid. */
  public async syncFromStripe(
    reservation: Pick<Reservation, 'id' | 'status' | 'paymentStatus' | 'stripeCheckoutSessionId' | 'stripePaymentIntentId'>,
  ): Promise<boolean> {
    if (reservation.paymentStatus !== 'pending' || !this.enabled()) return false;
    if (!reservation.stripeCheckoutSessionId && !reservation.stripePaymentIntentId) return false;
    try {
      // A payment intent on a pending booking comes from the app's payment sheet.
      if (reservation.stripePaymentIntentId) {
        const intent = await this.stripe.api().paymentIntents.retrieve(reservation.stripePaymentIntentId);
        if (intent.status === 'succeeded') {
          await this.confirmIntent(intent, 'return');
          return true;
        }
      }
      if (!reservation.stripeCheckoutSessionId) return false;
      const session = await this.stripe.api().checkout.sessions.retrieve(reservation.stripeCheckoutSessionId);
      if (session.status === 'complete' && session.payment_status === 'paid') {
        await this.confirmPaid(session, 'return');
        return true;
      }
    } catch (error) {
      logger.warn(`[Payments] Could not check the payment of reservation ${reservation.id}: ${stripeErrorName(error)}`);
    }
    return false;
  }

  /**
   * A paid Checkout Session: the booking becomes upcoming and paid, and its confirmation is sent
   * once (see confirmPayment).
   */
  public async confirmPaid(session: Stripe.Checkout.Session, source: 'return' | 'webhook'): Promise<void> {
    if (session.payment_status !== 'paid') return;
    await this.confirmPayment(
      {
        reservationId: session.metadata?.reservationId || session.client_reference_id || null,
        amountCents: session.amount_total,
        currency: session.currency,
        paymentIntentId: paymentIntentId(session),
        checkoutSessionId: session.id,
        label: `session ${session.id}`,
      },
      source,
    );
  }

  /** A succeeded PaymentIntent (the app's native payment sheet): same confirmation as Checkout. */
  public async confirmIntent(intent: Stripe.PaymentIntent, source: 'return' | 'webhook'): Promise<void> {
    if (intent.status !== 'succeeded') return;
    await this.confirmPayment(
      {
        reservationId: intent.metadata?.reservationId || null,
        amountCents: intent.amount_received || intent.amount,
        currency: intent.currency,
        paymentIntentId: intent.id,
        checkoutSessionId: null,
        label: `payment intent ${intent.id}`,
      },
      source,
    );
  }

  /**
   * A payment that went through (Checkout Session or PaymentIntent): the booking becomes upcoming
   * and paid, and its confirmation is sent once. Idempotent (the webhooks and the traveller's
   * return may all call it, in any order). A payment that arrives after the hold ended keeps the
   * booking if its place is still free, and is refunded otherwise.
   */
  private async confirmPayment(payment: ConfirmedPayment, source: 'return' | 'webhook'): Promise<void> {
    const id = payment.reservationId;
    if (!id) {
      logger.warn(`[Payments] Paid ${payment.label} without reservation`);
      return;
    }
    const head = await prisma.reservation.findUnique({ where: { id }, select: { parkingId: true } });
    if (!head) {
      logger.error(`[Payments] Paid ${payment.label}: reservation ${id} not found`);
      return;
    }

    const outcome = await prisma.$transaction(async tx => {
      await this.capacity.lock(tx, head.parkingId);
      const r = await tx.reservation.findUniqueOrThrow({ where: { id }, include: { parking: true } });
      if (r.paymentStatus === 'paid' || r.paymentStatus === 'refunded') return 'already';
      if (r.paymentStatus === null) {
        logger.error(`[Payments] Paid ${payment.label} for reservation ${id}, which is paid on site`);
        return 'ignored';
      }
      if (payment.amountCents !== (r.chargedCents ?? r.priceCents) || payment.currency !== 'eur') {
        logger.error(`[Payments] ${payment.label} amount does not match reservation ${id}: not confirmed`);
        return 'ignored';
      }
      const now = new Date();
      const paid = {
        paymentStatus: 'paid' as const,
        payoutStatus: 'pending' as const,
        paidAt: now,
        stripePaymentIntentId: payment.paymentIntentId,
        ...(payment.checkoutSessionId ? { stripeCheckoutSessionId: payment.checkoutSessionId } : {}),
        holdExpiresAt: null,
      };
      let late = false;
      if (r.status === 'cancelled' && r.paymentStatus === 'expired') {
        // Paid as the hold ended: the place may have been taken since.
        const { full } = await this.capacity.fullNights(r.parking, r.arrivalAt, r.returnAt, { excludeReservationId: r.id, client: tx });
        if (full.length) {
          await tx.reservation.update({ where: { id }, data: paid });
          return 'refund';
        }
        late = true;
      } else if (r.status !== 'pending_payment') {
        logger.error(`[Payments] Paid ${payment.label} for reservation ${id} in status ${r.status}: not confirmed`);
        return 'ignored';
      }
      await tx.reservation.update({ where: { id }, data: { ...paid, status: 'upcoming', cancelledAt: null } });
      await this.audit.record(
        { id: null, operatorId: r.operatorId },
        {
          action: 'reservation.paid',
          entityType: 'reservation',
          entityId: id,
          details: {
            chargedCents: payment.amountCents,
            commissionCents: r.commissionCents,
            operatorShareCents: r.operatorShareCents,
            source,
            method: payment.checkoutSessionId ? 'checkout' : 'payment_sheet',
            ...(late ? { afterHold: true } : {}),
          },
        },
        tx,
      );
      return 'confirmed';
    });

    if (outcome === 'confirmed') {
      logger.info(`[Payments] Reservation ${id} paid (${source})`);
      await this.sendConfirmationOnce(id);
    } else if (outcome === 'refund') {
      logger.warn(`[Payments] Reservation ${id} paid after its hold ended and its place was taken: refunding`);
      await this.refundAfterLatePayment(id);
    }
  }

  /** Confirmation email and SMS of a booking made on the site, sent exactly once. */
  public async sendConfirmationOnce(id: string): Promise<void> {
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({ where: { id, confirmationSentAt: null }, data: { confirmationSentAt: now } });
    if (!count) return;
    const record = await prisma.reservation.findUniqueOrThrow({ where: { id }, include: WITH_LISTING });
    if (!record.parking.listing) return;
    if (!SECRET_KEY) throw new Error('SECRET_KEY is not set');
    const token = manageToken(record.id, SECRET_KEY, record.manageTokenVersion);
    const booking = toPublicBooking(record);
    await this.notifications.bookingConfirmed(booking, token);
    // The team hears of it (06/10/2026): nobody typed this booking.
    await this.push.notifyNewBooking(record, record.parking.timezone);
    // The SMS goes through the operator's own channel (their phone, Brevo, or none).
    await this.sms.sendTravellerSms(record.operatorId, {
      reservationId: record.id,
      kind: 'booking_confirmed',
      to: record.customerPhone,
      text: confirmationSms(PRODUCT_NAME, booking, this.notifications.manageUrl(record.reference, token)),
    });
  }

  private async refundAfterLatePayment(id: string) {
    try {
      const record = await prisma.$transaction(async tx => {
        await this.lockRow(tx, id);
        const r = await tx.reservation.findUniqueOrThrow({ where: { id } });
        if (r.paymentStatus !== 'paid' || r.status !== 'cancelled') return null;
        return tx.reservation.update({ where: { id }, data: await this.refundPayment(r), include: WITH_LISTING });
      }, STRIPE_TX);
      if (record?.parking.listing) await this.notifications.bookingCancelled(toPublicBooking(record));
    } catch (error) {
      logger.error(`[Payments] Refund of reservation ${id} failed: ${stripeErrorName(error)}`);
    }
  }

  // ---- Release and refunds ----------------------------------------------------------------------

  /**
   * The traveller goes back to edit the form: the hold ends now (its payment page is closed first,
   * so that it cannot be paid any more). 409 "already_paid" when the payment went through meanwhile.
   */
  public async releaseHold(reservationId: string): Promise<void> {
    const before = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
    if (before.paymentStatus === 'expired') return;
    if (before.paymentStatus === 'paid' || before.paymentStatus === 'refunded') {
      throw new HttpException(httpStatus.CONFLICT, 'This booking is already paid', 'already_paid');
    }
    if (before.status !== 'pending_payment') throw holdExpired();

    if (before.stripePaymentIntentId && this.enabled()) {
      const intent = await this.closeIntent(before.stripePaymentIntentId);
      if (intent.status === 'succeeded') {
        await this.confirmIntent(intent, 'return');
        throw new HttpException(httpStatus.CONFLICT, 'This booking is already paid', 'already_paid');
      }
    }
    if (before.stripeCheckoutSessionId && this.enabled()) {
      const api = this.stripe.api();
      const session = await api.checkout.sessions.retrieve(before.stripeCheckoutSessionId);
      if (session.status === 'complete') {
        await this.confirmPaid(session, 'return');
        throw new HttpException(httpStatus.CONFLICT, 'This booking is already paid', 'already_paid');
      }
      if (session.status === 'open') {
        await api.checkout.sessions.expire(session.id, {}, { idempotencyKey: `plazo-expire-${session.id}` });
      }
    }
    const now = new Date();
    await prisma.reservation.updateMany({
      where: { id: reservationId, status: 'pending_payment' },
      data: { status: 'cancelled', paymentStatus: 'expired', cancelledAt: now, holdExpiresAt: null },
    });
  }

  /**
   * Full refund of a paid booking, from Plazo's account (the payment was taken there). Before the
   * operator's share was transferred, the payout is simply cancelled; after it (should not happen:
   * online cancellation closes before the stay), the transfer is reversed too. Call it inside the
   * transaction that cancels the booking, after locking its row: if Stripe refuses, nothing
   * changes. Returns the fields to save.
   */
  public async refundPayment(
    reservation: Pick<
      Reservation,
      'id' | 'stripePaymentIntentId' | 'stripeCheckoutSessionId' | 'payoutStatus' | 'stripeTransferId' | 'operatorShareCents'
    >,
  ): Promise<RefundFields> {
    const api = this.stripe.api();
    let paymentIntent = reservation.stripePaymentIntentId;
    if (!paymentIntent && reservation.stripeCheckoutSessionId) {
      paymentIntent = paymentIntentId(await api.checkout.sessions.retrieve(reservation.stripeCheckoutSessionId));
    }
    if (!paymentIntent) throw new HttpException(httpStatus.BAD_GATEWAY, 'Payment not found', 'refund_failed');
    try {
      let payoutStatus: 'cancelled' | 'reversed' = 'cancelled';
      if (reservation.payoutStatus === 'transferred' && reservation.stripeTransferId) {
        await api.transfers.createReversal(
          reservation.stripeTransferId,
          { metadata: { reservationId: reservation.id } },
          { idempotencyKey: `plazo-transfer-reversal-${reservation.id}` },
        );
        logger.warn(`[Payments] Reservation ${reservation.id} refunded after its payout: transfer reversed`);
        payoutStatus = 'reversed';
      }
      const refund = await api.refunds.create(
        { payment_intent: paymentIntent, metadata: { reservationId: reservation.id } },
        { idempotencyKey: `plazo-refund-${reservation.id}` },
      );
      logger.info(`[Payments] Reservation ${reservation.id} refunded`);
      return { paymentStatus: 'refunded', refundedAt: new Date(), stripeRefundId: refund.id, payoutStatus };
    } catch (error) {
      logger.error(`[Payments] Refund of reservation ${reservation.id} failed: ${stripeErrorName(error)}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'The refund failed, please try again', 'refund_failed');
    }
  }

  /**
   * Cancels a paid booking with a full refund, atomically: the row stays locked during the refund,
   * and `check` (run on the locked row) may refuse. Returns the updated booking.
   */
  public async cancelWithRefund<T>(
    reservationId: string,
    check: (current: Reservation) => void,
    apply: (tx: Prisma.TransactionClient, refund: RefundFields | null) => Promise<T>,
  ): Promise<T> {
    return prisma.$transaction(async tx => {
      await this.lockRow(tx, reservationId);
      const current = await tx.reservation.findUniqueOrThrow({ where: { id: reservationId } });
      check(current);
      const refund = current.paymentStatus === 'paid' ? await this.refundPayment(current) : null;
      return apply(tx, refund);
    }, STRIPE_TX);
  }

  // ---- Payouts ----------------------------------------------------------------------------------

  /**
   * GET /internal/cron/payouts (daily): transfers the operator's share of every paid booking whose
   * due date has come, by the operator's payout schedule as it is now (see domain/payout.ts),
   * unless the booking was cancelled. An operator whose account cannot take charges yet keeps its
   * payouts pending (next run). Idempotent: one transfer per booking, ever (row lock, payout status
   * and a per-booking Stripe idempotency key).
   */
  public async runPayouts(now = new Date()) {
    const result = { transferred: 0, notDue: 0, waitingForAccount: 0, failed: 0, skipped: 0 };
    let cursor: string | undefined;
    for (;;) {
      // Every schedule is due after the arrival at the earliest: the rest cannot be due yet.
      const batch = await prisma.reservation.findMany({
        where: { payoutStatus: 'pending', paymentStatus: 'paid', arrivalAt: { lt: now } },
        select: { id: true, status: true, arrivalAt: true, returnAt: true, parking: { select: { timezone: true } }, operator: true },
        orderBy: { id: 'asc' },
        take: 200,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });
      if (!batch.length) break;
      cursor = batch[batch.length - 1].id;
      for (const c of batch) {
        if (c.status === 'cancelled' || c.status === 'pending_payment') {
          result.skipped += 1;
          continue;
        }
        if (now < payoutDueAt(c.operator.payoutSchedule, c, c.parking.timezone)) {
          result.notDue += 1;
          continue;
        }
        if (!c.operator.stripeAccountId || !c.operator.stripeChargesEnabled) {
          logger.info(`[Payouts] Reservation ${c.id}: operator ${c.operator.id} account not ready, payout kept pending`);
          result.waitingForAccount += 1;
          continue;
        }
        result[await this.transferShare(c.id, c.operator.stripeAccountId)] += 1;
      }
      if (batch.length < 200) break;
    }
    return result;
  }

  /** The operator's payout schedule (manager). */
  public async payoutSettings(actor: AuthenticatedStaff): Promise<{ payoutSchedule: PayoutSchedule }> {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId }, select: { payoutSchedule: true } });
    return { payoutSchedule: operator.payoutSchedule };
  }

  /** Changes when the operator receives its money; applies to every share not transferred yet. */
  public async updatePayoutSettings(actor: AuthenticatedStaff, payoutSchedule: PayoutSchedule): Promise<{ payoutSchedule: PayoutSchedule }> {
    const before = await this.payoutSettings(actor);
    if (before.payoutSchedule === payoutSchedule) return before;
    await prisma.$transaction(async tx => {
      await tx.operator.update({ where: { id: actor.operatorId }, data: { payoutSchedule } });
      await this.audit.record(
        actor,
        {
          action: 'payments.payout_schedule_changed',
          entityType: 'operator',
          entityId: actor.operatorId,
          details: { from: before.payoutSchedule, to: payoutSchedule },
        },
        tx,
      );
    });
    return { payoutSchedule };
  }

  /** Transfers one booking's share now (cron, or a platform admin retrying a failed payout). */
  public async transferShare(id: string, destination: string): Promise<'transferred' | 'failed' | 'skipped'> {
    try {
      return await prisma.$transaction(async tx => {
        await this.lockRow(tx, id);
        const r = await tx.reservation.findUniqueOrThrow({ where: { id } });
        // Cancelled, refunded or paid out meanwhile.
        if (r.payoutStatus !== 'pending' || r.paymentStatus !== 'paid' || r.status === 'cancelled') return 'skipped';
        if (r.operatorShareCents === null || !r.stripePaymentIntentId) throw new Error('Missing amounts or payment');
        const api = this.stripe.api();
        let chargeId = r.stripeChargeId;
        if (!chargeId) {
          const intent = await api.paymentIntents.retrieve(r.stripePaymentIntentId);
          chargeId = typeof intent.latest_charge === 'string' ? intent.latest_charge : (intent.latest_charge?.id ?? null);
        }
        if (!chargeId) throw new Error('Charge not found');
        const transfer = await api.transfers.create(
          {
            amount: r.operatorShareCents,
            currency: 'eur',
            destination,
            transfer_group: r.id,
            // Funds become transferable when the charge's funds are available.
            source_transaction: chargeId,
            metadata: { reservationId: r.id },
          },
          { idempotencyKey: `plazo-transfer-${r.id}` },
        );
        await tx.reservation.update({
          where: { id },
          data: { payoutStatus: 'transferred', stripeTransferId: transfer.id, transferredAt: new Date(), stripeChargeId: chargeId },
        });
        await this.audit.record(
          { id: null, operatorId: r.operatorId },
          { action: 'reservation.payout', entityType: 'reservation', entityId: id, details: { amountCents: r.operatorShareCents } },
          tx,
        );
        logger.info(`[Payouts] Reservation ${id}: operator share transferred`);
        return 'transferred' as const;
      }, STRIPE_TX);
    } catch (error) {
      const type = stripeErrorName(error);
      // Refused by Stripe (invalid request, permissions): needs a look. Anything else: next run.
      if (type === 'StripeInvalidRequestError' || type === 'StripePermissionError') {
        await prisma.reservation.updateMany({ where: { id, payoutStatus: 'pending' }, data: { payoutStatus: 'failed' } });
        logger.error(`[Payouts] Reservation ${id}: transfer refused (${type}), payout marked failed`);
        return 'failed';
      }
      logger.warn(`[Payouts] Reservation ${id}: transfer not made (${type}), retried on the next run`);
      return 'skipped';
    }
  }

  // ---- Webhook ----------------------------------------------------------------------------------

  /** POST /public/stripe/webhook: signed events from Stripe (the platform's and the connected accounts'). */
  public async handleWebhook(payload: Buffer | undefined, signature: string | undefined): Promise<{ received: true; type: string }> {
    const secrets = stripeWebhookSecrets();
    if (!secrets.length) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Webhook not configured', 'webhook_not_configured');
    if (!payload || !payload.length || !signature) throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid signature', 'invalid_signature');
    let event: Stripe.Event;
    try {
      event = this.stripe.verifyEvent(payload, signature, secrets);
    } catch {
      throw new HttpException(httpStatus.BAD_REQUEST, 'Invalid signature', 'invalid_signature');
    }

    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await this.confirmPaid(event.data.object, 'webhook');
        break;
      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await this.sessionEnded(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await this.confirmIntent(event.data.object, 'webhook');
        break;
      case 'payment_intent.payment_failed':
        this.intentFailed(event.data.object);
        break;
      case 'account.updated':
        await this.accountUpdated(event.data.object);
        break;
      default:
        break;
    }
    return { received: true, type: event.type };
  }

  /**
   * A declined attempt in the app's payment sheet (card refused, authentication failed): the
   * traveller may try again with another card while the place is held, so the hold stays; it ends
   * at its time like any other. Logged without personal data.
   */
  private intentFailed(intent: Stripe.PaymentIntent) {
    const reservationId = intent.metadata?.reservationId;
    if (!reservationId) return;
    logger.info(`[Payments] Payment attempt failed for reservation ${reservationId} (${intent.last_payment_error?.code ?? 'unknown'}): hold kept`);
  }

  /** The payment page expired (or its delayed payment failed): the hold ends, the place is free. */
  private async sessionEnded(session: Stripe.Checkout.Session) {
    const now = new Date();
    const { count } = await prisma.reservation.updateMany({
      // A payment intent on a pending booking: the traveller moved to the app's payment sheet.
      where: { stripeCheckoutSessionId: session.id, status: 'pending_payment', stripePaymentIntentId: null },
      data: { status: 'cancelled', paymentStatus: 'expired', cancelledAt: now, holdExpiresAt: null },
    });
    if (count) logger.info(`[Payments] Hold released (session ${session.id} ended)`);
  }

  private async accountUpdated(account: Stripe.Account) {
    await prisma.operator.updateMany({
      where: { stripeAccountId: account.id },
      data: {
        stripeChargesEnabled: !!account.charges_enabled,
        stripePayoutsEnabled: !!account.payouts_enabled,
        stripeDetailsSubmitted: !!account.details_submitted,
      },
    });
  }

  // ---- Operator account (Stripe Connect Express) ------------------------------------------------

  /** The operator's connected account (created when missing) and a link to Stripe's onboarding. */
  public async onboarding(actor: AuthenticatedStaff): Promise<{ url: string; expiresAt: string }> {
    if (!this.enabled()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Online payments are not enabled', 'payments_disabled');
    const site = this.siteUrl();
    const api = this.stripe.api();
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId } });
    let accountId = operator.stripeAccountId;
    if (!accountId) {
      const account = await api.accounts.create(
        {
          type: 'express',
          country: 'FR',
          default_currency: 'eur',
          capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          business_profile: { name: operator.name, mcc: '7523' },
          metadata: { operatorId: operator.id },
        },
        { idempotencyKey: `plazo-account-${operator.id}` },
      );
      // Two managers at once: the first account saved wins (the key above returns the same one).
      await prisma.operator.updateMany({ where: { id: operator.id, stripeAccountId: null }, data: { stripeAccountId: account.id } });
      accountId = (await prisma.operator.findUniqueOrThrow({ where: { id: operator.id }, select: { stripeAccountId: true } })).stripeAccountId!;
      await this.audit.record(actor, { action: 'payments.account_created', entityType: 'operator', entityId: operator.id, details: {} });
    }
    const link = await api.accountLinks.create(
      {
        account: accountId,
        type: 'account_onboarding',
        // Back to the "Sur Plazo" page, which reads ?stripe= to tell the manager what happened.
        refresh_url: `${site}${ONBOARDING_RETURN_PATH}?stripe=relance`,
        return_url: `${site}${ONBOARDING_RETURN_PATH}?stripe=retour`,
      },
      { idempotencyKey: `plazo-account-link-${randomUUID()}` },
    );
    return { url: link.url, expiresAt: new Date(link.expires_at * 1000).toISOString() };
  }

  /** Whether the operator can take online payments (refreshed from Stripe when possible). */
  public async status(actor: AuthenticatedStaff): Promise<PaymentStatus> {
    const operator = await prisma.operator.findUniqueOrThrow({ where: { id: actor.operatorId } });
    const enabled = this.enabled();
    const base = {
      enabled,
      // A test key moves no real money: the pro space says so next to the onboarding button.
      testMode: enabled && !isLiveStripeKey(stripeSecretKey()),
      commissionBps: this.commissionBps(operator),
      payoutSchedule: operator.payoutSchedule,
    };
    if (!operator.stripeAccountId) {
      return { ...base, connected: false, detailsSubmitted: false, chargesEnabled: false, payoutsEnabled: false };
    }
    let { stripeChargesEnabled: chargesEnabled, stripePayoutsEnabled: payoutsEnabled, stripeDetailsSubmitted: detailsSubmitted } = operator;
    if (enabled) {
      try {
        const account = await this.stripe.api().accounts.retrieve(operator.stripeAccountId);
        chargesEnabled = !!account.charges_enabled;
        payoutsEnabled = !!account.payouts_enabled;
        detailsSubmitted = !!account.details_submitted;
        if (
          chargesEnabled !== operator.stripeChargesEnabled ||
          payoutsEnabled !== operator.stripePayoutsEnabled ||
          detailsSubmitted !== operator.stripeDetailsSubmitted
        ) {
          await prisma.operator.update({
            where: { id: operator.id },
            data: { stripeChargesEnabled: chargesEnabled, stripePayoutsEnabled: payoutsEnabled, stripeDetailsSubmitted: detailsSubmitted },
          });
        }
      } catch (error) {
        logger.warn(`[Payments] Could not refresh the Stripe account of operator ${operator.id}: ${stripeErrorName(error)}`);
      }
    }
    return { ...base, connected: true, detailsSubmitted, chargesEnabled, payoutsEnabled };
  }

  /** A single-use login link to the operator's Stripe Express dashboard (payouts, bank details). */
  public async dashboardLink(actor: AuthenticatedStaff): Promise<{ url: string }> {
    if (!this.enabled()) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'Online payments are not enabled', 'payments_disabled');
    const operator = await prisma.operator.findUniqueOrThrow({
      where: { id: actor.operatorId },
      select: { stripeAccountId: true, stripeDetailsSubmitted: true, stripePayoutsEnabled: true },
    });
    // Stripe only opens the dashboard of an account whose onboarding was sent.
    if (!operator.stripeAccountId || !(operator.stripeDetailsSubmitted || operator.stripePayoutsEnabled)) {
      throw new HttpException(httpStatus.CONFLICT, 'The Stripe account is not set up yet', 'payments_not_connected');
    }
    try {
      const link = await this.stripe.api().accounts.createLoginLink(operator.stripeAccountId);
      return { url: link.url };
    } catch (error) {
      logger.warn(`[Payments] Could not open the Stripe dashboard of operator ${actor.operatorId}: ${stripeErrorName(error)}`);
      throw new HttpException(httpStatus.BAD_GATEWAY, 'Stripe did not answer', 'payments_unavailable');
    }
  }
}
