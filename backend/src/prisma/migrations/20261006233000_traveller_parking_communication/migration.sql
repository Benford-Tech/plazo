-- E (06/10/2026): what the traveller tells the parking.
CREATE TYPE "ReturnNoticeKind" AS ENUM ('flight_delayed', 'luggage', 'other');
ALTER TABLE "reservations" ADD COLUMN "customerNote" TEXT;
ALTER TABLE "reservations" ADD COLUMN "vehicleModel" TEXT;
ALTER TABLE "reservations" ADD COLUMN "vehicleColour" TEXT;
ALTER TABLE "reservations" ADD COLUMN "returnNoticeKind" "ReturnNoticeKind";
ALTER TABLE "reservations" ADD COLUMN "returnNoticeText" TEXT;
ALTER TABLE "reservations" ADD COLUMN "returnNoticeAt" TIMESTAMP(3);
ALTER TABLE "arrival_signals" ADD COLUMN "note" TEXT;
