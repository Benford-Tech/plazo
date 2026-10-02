import Stripe from 'stripe';
import { Service } from 'typedi';
import { stripeApiBase, stripeSecretKey } from '@/config';

/** The parts of the Stripe SDK the platform uses (tests replace them with mocks: no network). */
export type StripeApi = Pick<Stripe, 'checkout' | 'refunds' | 'accounts' | 'accountLinks' | 'paymentIntents' | 'transfers'>;

/**
 * Access to the Stripe API. The client is built from STRIPE_SECRET_KEY when first used (and again
 * if the key changes); tests set `override` instead.
 */
@Service()
export class StripeService {
  /** Tests: a mocked client used instead of the real one. */
  public override: StripeApi | null = null;
  private cached: { key: string; client: Stripe } | null = null;
  // Webhook signatures are checked locally (HMAC): any instance can do it, no key needed.
  private readonly verifier = new Stripe('sk_test_signature_only');

  public api(): StripeApi {
    if (this.override) return this.override;
    const key = stripeSecretKey();
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    if (this.cached?.key !== key) {
      const base = stripeApiBase();
      const url = base ? new URL(base) : null;
      this.cached = {
        key,
        client: new Stripe(key, {
          typescript: true,
          maxNetworkRetries: 2,
          timeout: 15000,
          telemetry: false,
          ...(url
            ? { host: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80), protocol: url.protocol === 'https:' ? 'https' : 'http' }
            : {}),
        }),
      };
    }
    return this.cached.client;
  }

  /** The event, if the payload is signed with one of the secrets; throws otherwise. */
  public verifyEvent(payload: Buffer, signature: string, secrets: string[]): Stripe.Event {
    let lastError: unknown = new Error('No webhook secret');
    for (const secret of secrets) {
      try {
        return this.verifier.webhooks.constructEvent(payload, signature, secret);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  /** Tests: a valid Stripe-Signature header for a payload. */
  public signatureFor(payload: string, secret: string): string {
    return this.verifier.webhooks.generateTestHeaderString({ payload, secret });
  }
}
