-- Services for the car (21/10/2026): lavage intérieur, recharge hybride, recharge électrique, ordered on Plazo.
CREATE TYPE "ExtraKind" AS ENUM ('interior_wash', 'hybrid_charge', 'ev_charge');
CREATE TYPE "ExtraStatus" AS ENUM ('pending_payment', 'ordered', 'done', 'refused', 'refunded', 'expired');

ALTER TABLE "parkings" ADD COLUMN "extrasLeadHours" INTEGER NOT NULL DEFAULT 24;
ALTER TABLE "reservations" ADD COLUMN "extrasChargedCents" INTEGER;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_extras_charged_positive" CHECK ("extrasChargedCents" IS NULL OR "extrasChargedCents" > 0);

ALTER TABLE "parkings" ADD CONSTRAINT "parkings_extras_lead_hours_range" CHECK ("extrasLeadHours" BETWEEN 0 AND 168);

CREATE TABLE "parking_extras" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "kind" "ExtraKind" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "priceCents" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "parking_extras_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "parking_extras_price_range" CHECK ("priceCents" BETWEEN 100 AND 100000)
);
CREATE UNIQUE INDEX "parking_extras_parkingId_kind_key" ON "parking_extras"("parkingId", "kind");
ALTER TABLE "parking_extras" ADD CONSTRAINT "parking_extras_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "reservation_extras" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "kind" "ExtraKind" NOT NULL,
    "label" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "operatorShareCents" INTEGER NOT NULL,
    "status" "ExtraStatus" NOT NULL DEFAULT 'pending_payment',
    "withBooking" BOOLEAN NOT NULL DEFAULT false,
    "stripePaymentIntentId" TEXT,
    "stripeLive" BOOLEAN,
    "stripeChargeId" TEXT,
    "stripeRefundId" TEXT,
    "stripeTransferId" TEXT,
    "payoutStatus" "PayoutStatus",
    "paidAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "doneById" TEXT,
    "refusedAt" TIMESTAMP(3),
    "refusedById" TEXT,
    "refusedReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "transferredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reservation_extras_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reservation_extras_amounts" CHECK ("priceCents" > 0 AND "commissionCents" >= 0 AND "operatorShareCents" >= 0 AND "commissionCents" + "operatorShareCents" = "priceCents"),
    -- Paid with the booking, or in its own payment: never both.
    CONSTRAINT "reservation_extras_payment" CHECK (NOT ("withBooking" AND "stripePaymentIntentId" IS NOT NULL))
);
CREATE UNIQUE INDEX "reservation_extras_stripePaymentIntentId_key" ON "reservation_extras"("stripePaymentIntentId");
CREATE INDEX "reservation_extras_reservationId_idx" ON "reservation_extras"("reservationId");
CREATE INDEX "reservation_extras_operatorId_status_idx" ON "reservation_extras"("operatorId", "status");
CREATE INDEX "reservation_extras_payoutStatus_status_idx" ON "reservation_extras"("payoutStatus", "status");
-- One active order of each service per booking.
CREATE UNIQUE INDEX "reservation_extras_one_active_kind" ON "reservation_extras"("reservationId", "kind") WHERE "status" IN ('pending_payment', 'ordered', 'done');
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_doneById_fkey" FOREIGN KEY ("doneById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_refusedById_fkey" FOREIGN KEY ("refusedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
