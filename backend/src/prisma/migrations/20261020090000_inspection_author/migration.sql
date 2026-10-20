-- « Les deux peuvent faire l'état des lieux » (20/10/2026): a report is the staff's or the traveller's own.
CREATE TYPE "InspectionAuthor" AS ENUM ('staff', 'traveller');

ALTER TABLE "vehicle_inspections" ADD COLUMN "author" "InspectionAuthor" NOT NULL DEFAULT 'staff';

DROP INDEX "vehicle_inspections_reservationId_kind_key";
CREATE UNIQUE INDEX "vehicle_inspections_reservationId_kind_author_key" ON "vehicle_inspections"("reservationId", "kind", "author");

-- A traveller's report has no answer (only the staff's are answered).
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_traveller_unanswered" CHECK ("author" = 'staff' OR "decision" = 'pending');
