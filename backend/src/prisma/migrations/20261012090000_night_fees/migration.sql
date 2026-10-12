-- 12/10/2026 (« ajoute des frais de nuit pour les arrivées et départs en heure définie par le parking », direction B):
-- one night window per parking, the same every day ("HH:mm", the start counts as night, the end does not, it may cross
-- midnight), a fee for a drop-off and one for a return booked in it. Off for every existing parking.
ALTER TABLE "parkings" ADD COLUMN     "nightFeeEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nightStart" TEXT,
ADD COLUMN     "nightEnd" TEXT,
ADD COLUMN     "nightArrivalFeeCents" INTEGER,
ADD COLUMN     "nightReturnFeeCents" INTEGER;

-- The fees charged when a Plazo booking was made, frozen (included in "priceCents"); null when none.
ALTER TABLE "reservations" ADD COLUMN     "nightArrivalFeeCents" INTEGER,
ADD COLUMN     "nightReturnFeeCents" INTEGER;

-- Business rules enforced by the database (Prisma cannot express CHECK constraints).
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_night_start_format"
  CHECK ("nightStart" IS NULL OR "nightStart" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_night_end_format"
  CHECK ("nightEnd" IS NULL OR "nightEnd" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_night_fees_range"
  CHECK (
    ("nightArrivalFeeCents" IS NULL OR "nightArrivalFeeCents" BETWEEN 0 AND 100000)
    AND ("nightReturnFeeCents" IS NULL OR "nightReturnFeeCents" BETWEEN 0 AND 100000)
  );
-- Switched on: a real window (start and end, different) and at least one fee.
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_night_enabled_complete"
  CHECK (
    NOT "nightFeeEnabled"
    OR (
      "nightStart" IS NOT NULL AND "nightEnd" IS NOT NULL AND "nightStart" <> "nightEnd"
      AND (COALESCE("nightArrivalFeeCents", 0) > 0 OR COALESCE("nightReturnFeeCents", 0) > 0)
    )
  );

-- A fee charged is a positive amount, and only bookings made on Plazo carry one.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_night_fees_positive"
  CHECK (("nightArrivalFeeCents" IS NULL OR "nightArrivalFeeCents" > 0) AND ("nightReturnFeeCents" IS NULL OR "nightReturnFeeCents" > 0));
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_night_fees_plazo"
  CHECK (("nightArrivalFeeCents" IS NULL AND "nightReturnFeeCents" IS NULL) OR "channel"::text = 'plazo');
