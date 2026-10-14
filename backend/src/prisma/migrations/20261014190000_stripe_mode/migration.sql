-- « Passer Stripe en mode prod » (14/10/2026): a Stripe object made with test keys does not exist for live keys (and
-- the reverse). The mode of the operator's connected account and of each booking's payment is kept, so that the
-- switch to live keys neither sends the operators' payouts to test accounts nor calls Stripe for a test payment.
-- Until now production refused live keys (STRIPE_ALLOW_LIVE): the existing accounts and payments are test ones, which
-- the defaults say (false, and null read as test).
ALTER TABLE "operators" ADD COLUMN "stripeAccountLive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD COLUMN "stripeLive" BOOLEAN;
