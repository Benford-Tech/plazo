-- 12/11/2026 (« Payé au parking »): the team adds a service to any booking, paid at the parking (never through Stripe).
CREATE TYPE "ExtraSource" AS ENUM ('traveller', 'staff');

ALTER TABLE "reservation_extras"
  ADD COLUMN "source" "ExtraSource" NOT NULL DEFAULT 'traveller',
  ADD COLUMN "paymentMethod" "PaymentMethod",
  ADD COLUMN "addedById" TEXT;

ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A service added by the team: no Stripe payment, no Plazo commission, no payout; it never rides on the booking's payment.
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_staff_no_stripe" CHECK (
  "source" <> 'staff' OR (
    "stripePaymentIntentId" IS NULL AND "stripeChargeId" IS NULL AND "stripeRefundId" IS NULL AND "stripeTransferId" IS NULL
    AND "stripeLive" IS NULL AND "payoutStatus" IS NULL AND "withBooking" = false
    AND "commissionCents" = 0 AND "operatorShareCents" = "priceCents"
  )
);
-- Paid at the parking: a method (never « au comparateur ») and its time, both or neither; a traveller's order has neither.
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_parking_payment" CHECK (
  ("source" = 'traveller' AND "paymentMethod" IS NULL)
  OR ("source" = 'staff' AND "paymentMethod" IS NULL AND "paidAt" IS NULL)
  OR ("source" = 'staff' AND "paymentMethod" <> 'comparator' AND "paidAt" IS NOT NULL)
);
