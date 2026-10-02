import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { Routes } from '@/interfaces/routes.interface';
import { UpdatePayoutSettingsDto } from '@/dtos/payment.dto';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Online payment (Stripe Connect) — the operator's account, and Stripe's webhook
 */
/**
 * @swagger
 * /internal/payments/onboarding:
 *   post:
 *     summary: Connect the operator to Stripe (manager)
 *     description: >
 *       Creates the operator's Stripe Express account when it has none, and returns a single-use link
 *       to Stripe's onboarding { url, expiresAt } (identity and bank details are entered on Stripe).
 *       Stripe sends the manager back to /pro/plazo/fiche?stripe=retour (or ?stripe=relance when the
 *       link expired). 503 "payments_disabled" while STRIPE_SECRET_KEY is not set; 403
 *       "view_as_read_only" in a platform admin's view-as session.
 *     tags: [Payments]
 * /internal/payments/dashboard-link:
 *   post:
 *     summary: Open the operator's Stripe Express dashboard (manager)
 *     description: >
 *       A single-use login link { url } to the operator's Stripe dashboard (payouts, bank details).
 *       409 "payments_not_connected" until the onboarding was sent to Stripe; 503 "payments_disabled";
 *       502 "payments_unavailable" when Stripe does not answer; 403 "view_as_read_only".
 *     tags: [Payments]
 * /internal/payments/status:
 *   get:
 *     summary: Whether the operator can take online payments (manager)
 *     description: >
 *       { enabled, testMode, connected, detailsSubmitted, chargesEnabled, payoutsEnabled, commissionBps,
 *       payoutSchedule }, refreshed from Stripe when possible. enabled is false while STRIPE_SECRET_KEY
 *       is not set (travellers pay at the parking); testMode is true with a Stripe test key.
 *     tags: [Payments]
 * /internal/payments/settings:
 *   get:
 *     summary: When the operator receives its money (manager) — { payoutSchedule }
 *     tags: [Payments]
 *   put:
 *     summary: Choose when the operator receives its money (manager)
 *     description: >
 *       AFTER_STAY (default): the day after the return; AT_DROP_OFF: the day after the arrival; WEEKLY:
 *       every Monday, for the stays ended the week before; MONTHLY: on the 1st, for the stays ended the
 *       month before (dates local to the parking). Applies to every share not transferred yet.
 *       400 "invalid_payout_schedule"; 403 "view_as_read_only".
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [payoutSchedule]
 *             properties:
 *               payoutSchedule: { type: string, enum: [AFTER_STAY, AT_DROP_OFF, WEEKLY, MONTHLY] }
 * /public/stripe/webhook:
 *   post:
 *     summary: Stripe events (signed)
 *     description: >
 *       Raw body checked against STRIPE_WEBHOOK_SECRET (comma-separated secrets: the platform's endpoint
 *       and the connected accounts' one). Handles checkout.session.completed,
 *       checkout.session.async_payment_succeeded, checkout.session.async_payment_failed,
 *       checkout.session.expired, payment_intent.succeeded (the app's payment sheet: same idempotent
 *       confirmation as Checkout, one confirmation message, late payments kept or refunded),
 *       payment_intent.payment_failed (a declined attempt: logged, the hold stays so the traveller can
 *       retry) and account.updated. 400 "invalid_signature".
 *     tags: [Payments]
 *     security: []
 * /public/payments/config:
 *   get:
 *     summary: "Payment sheet settings for the mobile app"
 *     description: >-
 *       { payments: online | on_site, publishableKey (null when payments are off or
 *       STRIPE_PUBLISHABLE_KEY is not set: the app then uses the Checkout page), merchantDisplayName,
 *       merchantCountryCode: FR, currency: eur }.
 *     tags: [Payments]
 *     security: []
 */
export class PaymentRoute implements Routes {
  public router = Router();
  public payments = new PaymentController();

  constructor() {
    // The operator's Stripe account and payouts stay theirs: read-only while a platform admin views
    // their space (RefuseInViewAs: 403 view_as_read_only).
    this.router.post('/internal/payments/onboarding', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.payments.onboarding);
    this.router.post('/internal/payments/dashboard-link', StaffAuthMiddleware('parking:manage'), RefuseInViewAs(), this.payments.dashboardLink);
    this.router.get('/internal/payments/status', StaffAuthMiddleware('parking:manage'), this.payments.status);
    this.router.get('/internal/payments/settings', StaffAuthMiddleware('parking:manage'), this.payments.settings);
    this.router.put(
      '/internal/payments/settings',
      StaffAuthMiddleware('parking:manage'),
      RefuseInViewAs(),
      ValidationMiddleware(UpdatePayoutSettingsDto),
      this.payments.updateSettings,
    );
    this.router.get('/public/payments/config', this.payments.sheetConfig);
    // The raw body is kept for this path only (see app.ts).
    this.router.post('/public/stripe/webhook', this.payments.webhook);
  }
}
