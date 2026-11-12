-- 12/11/2026 (« A puis B », B): supplements applied on a booking.
ALTER TABLE "reservations" ADD COLUMN "surchargeSuggestionDismissedAt" TIMESTAMP(3);

CREATE TABLE "reservation_surcharges" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "addedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservation_surcharges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reservation_surcharges_reservationId_idx" ON "reservation_surcharges"("reservationId");
CREATE INDEX "reservation_surcharges_operatorId_createdAt_idx" ON "reservation_surcharges"("operatorId", "createdAt");

ALTER TABLE "reservation_surcharges" ADD CONSTRAINT "reservation_surcharges_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_surcharges" ADD CONSTRAINT "reservation_surcharges_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservation_surcharges" ADD CONSTRAINT "reservation_surcharges_kind" CHECK ("kind" IN ('late', 'night', 'breakdown', 'custom', 'other'));
ALTER TABLE "reservation_surcharges" ADD CONSTRAINT "reservation_surcharges_amount" CHECK ("amountCents" > 0 AND "amountCents" <= 100000);
ALTER TABLE "reservation_surcharges" ADD CONSTRAINT "reservation_surcharges_label" CHECK (char_length("label") BETWEEN 1 AND 80);
