-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'expired', 'refunded');

-- CreateEnum
CREATE TYPE "PayoutSchedule" AS ENUM ('AFTER_STAY', 'AT_DROP_OFF', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'transferred', 'cancelled', 'reversed', 'failed');

-- AlterEnum
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'pending_payment';

-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeChargesEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripePayoutsEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "payoutSchedule" "PayoutSchedule" NOT NULL DEFAULT 'AFTER_STAY';

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "chargedCents" INTEGER,
ADD COLUMN     "commissionCents" INTEGER,
ADD COLUMN     "confirmationSentAt" TIMESTAMP(3),
ADD COLUMN     "holdExpiresAt" TIMESTAMP(3),
ADD COLUMN     "operatorShareCents" INTEGER,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentStatus" "PaymentStatus",
ADD COLUMN     "payoutStatus" "PayoutStatus",
ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "stripeTransferId" TEXT,
ADD COLUMN     "transferredAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "operators_stripeAccountId_key" ON "operators"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_stripeCheckoutSessionId_key" ON "reservations"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "reservations_status_holdExpiresAt_idx" ON "reservations"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "reservations_payoutStatus_arrivalAt_idx" ON "reservations"("payoutStatus", "arrivalAt");


-- A held place always has an end (compared as text: the new enum value cannot be used in the
-- transaction that adds it).
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_hold_has_expiry_check"
  CHECK ("status"::text <> 'pending_payment' OR "holdExpiresAt" IS NOT NULL);
-- What the traveller pays is split between Plazo and the operator, to the cent.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_payment_split_check"
  CHECK (
    ("chargedCents" IS NULL AND "commissionCents" IS NULL AND "operatorShareCents" IS NULL)
    OR ("chargedCents" >= 0 AND "commissionCents" >= 0 AND "operatorShareCents" >= 0
        AND "chargedCents" = "commissionCents" + "operatorShareCents")
  );
