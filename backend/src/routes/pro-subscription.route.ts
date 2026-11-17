import { Router } from 'express';
import { ProSubscriptionController } from '@/controllers/pro-subscription.controller';
import { Routes } from '@/interfaces/routes.interface';
import { RefuseInViewAs, StaffAuthMiddleware } from '@/middlewares/staff-auth.middleware';

/**
 * @openapi
 * tags:
 *   name: Subscription
 *   description: >
 *     The operator's Plazo Pro subscription, paid with Stripe Billing (17/11/2026, direction B « Tout dans Plazo »):
 *     plans of « Mon contrat », setup fee on the first invoice, VAT 20 % on top, card or SEPA, prorated changes,
 *     invoices, cancellation at the end of the paid period. Managers only; never in consultation nor in the demo
 *     (403 view_as_payments). 409 subscriptions_unavailable without Stripe keys, test_operator for a test or demo
 *     operator under live keys, already_subscribed, no_subscription, same_plan, payment_failed, setup_not_confirmed.
 * /internal/subscription:
 *   get: { tags: [Subscription], summary: The plans, the setup fee and the subscription }
 *   post: { tags: [Subscription], summary: "Subscribe { plan, yearly }: the first invoice's client secret for the Payment Element" }
 * /internal/subscription/sync:
 *   post: { tags: [Subscription], summary: Read the subscription back from Stripe after a payment }
 * /internal/subscription/preview:
 *   get: { tags: [Subscription], summary: "What a change of plan costs (?plan=&yearly=)" }
 * /internal/subscription/change:
 *   post: { tags: [Subscription], summary: "Change plan { plan, yearly }" }
 * /internal/subscription/payment-method:
 *   post: { tags: [Subscription], summary: A SetupIntent for a new card or IBAN }
 * /internal/subscription/payment-method/confirm:
 *   post: { tags: [Subscription], summary: "Make the confirmed method the default { setupIntentId }" }
 * /internal/subscription/invoices:
 *   get: { tags: [Subscription], summary: The invoices (Stripe's PDF links) }
 * /internal/subscription/cancel:
 *   post: { tags: [Subscription], summary: Stop at the end of the paid period }
 * /internal/subscription/resume:
 *   post: { tags: [Subscription], summary: Keep the subscription going }
 */
export class ProSubscriptionRoute implements Routes {
  public router = Router();
  public subscriptions = new ProSubscriptionController();

  constructor() {
    const manager = StaffAuthMiddleware('parking:manage');
    const write = [manager, RefuseInViewAs('view_as_payments', 'Payments of the operator are not changed in consultation')];
    this.router.get('/internal/subscription', manager, this.subscriptions.view);
    this.router.get('/internal/subscription/invoices', manager, this.subscriptions.invoices);
    this.router.get('/internal/subscription/preview', manager, this.subscriptions.preview);
    this.router.post('/internal/subscription', ...write, this.subscriptions.subscribe);
    this.router.post('/internal/subscription/sync', manager, this.subscriptions.sync);
    this.router.post('/internal/subscription/change', ...write, this.subscriptions.change);
    this.router.post('/internal/subscription/payment-method', ...write, this.subscriptions.paymentMethodSetup);
    this.router.post('/internal/subscription/payment-method/confirm', ...write, this.subscriptions.paymentMethodConfirm);
    this.router.post('/internal/subscription/cancel', ...write, this.subscriptions.cancel);
    this.router.post('/internal/subscription/resume', ...write, this.subscriptions.resume);
  }
}
