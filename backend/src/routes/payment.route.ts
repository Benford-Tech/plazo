import { Router } from 'express';
import { PaymentController } from '@/controllers/payment.controller';
import { Routes } from '@/interfaces/routes.interface';
import { UpdatePayoutSettingsDto } from '@/dtos/payment.dto';
import { StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';
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
 *       503 "payments_disabled" while STRIPE_SECRET_KEY is not set.
 *     tags: [Payments]
 * /internal/payments/status:
 *   get:
 *     summary: Whether the operator can take online payments (manager)
 *     description: "{ connected, chargesEnabled, payoutsEnabled, payoutSchedule }, refreshed from Stripe when possible."
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
 *       400 "invalid_payout_schedule".
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
 *       checkout.session.expired and account.updated. 400 "invalid_signature".
 *     tags: [Payments]
 *     security: []
 */
export class PaymentRoute implements Routes {
  public router = Router();
  public payments = new PaymentController();

  constructor() {
    this.router.post('/internal/payments/onboarding', StaffAuthMiddleware('parking:manage'), this.payments.onboarding);
    this.router.get('/internal/payments/status', StaffAuthMiddleware('parking:manage'), this.payments.status);
    this.router.get('/internal/payments/settings', StaffAuthMiddleware('parking:manage'), this.payments.settings);
    this.router.put(
      '/internal/payments/settings',
      StaffAuthMiddleware('parking:manage'),
      ValidationMiddleware(UpdatePayoutSettingsDto),
      this.payments.updateSettings,
    );
    // The raw body is kept for this path only (see app.ts).
    this.router.post('/public/stripe/webhook', this.payments.webhook);
  }
}
