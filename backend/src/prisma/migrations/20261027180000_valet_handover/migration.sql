-- 27/10/2026 « Voiturier au terminal » (direction B): shuttle or valet handover, the two valet runs and who took them.
CREATE TYPE "Handover" AS ENUM ('shuttle', 'valet');

ALTER TABLE "reservations"
  ADD COLUMN "handover" "Handover" NOT NULL DEFAULT 'shuttle',
  ADD COLUMN "valetArrivalById" TEXT,
  ADD COLUMN "valetArrivalTakenAt" TIMESTAMP(3),
  ADD COLUMN "valetDepartureById" TEXT,
  ADD COLUMN "valetDepartureTakenAt" TIMESTAMP(3),
  ADD COLUMN "valetArrivalNotifiedAt" TIMESTAMP(3),
  ADD COLUMN "valetDepartureNotifiedAt" TIMESTAMP(3);

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valetArrivalById_fkey"
  FOREIGN KEY ("valetArrivalById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valetDepartureById_fkey"
  FOREIGN KEY ("valetDepartureById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A run taken by someone has the time it was taken (the member may be deleted later: the time stays). Only a valet
-- booking has runs.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valet_arrival_taken"
  CHECK ("valetArrivalById" IS NULL OR "valetArrivalTakenAt" IS NOT NULL);
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valet_departure_taken"
  CHECK ("valetDepartureById" IS NULL OR "valetDepartureTakenAt" IS NOT NULL);
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_valet_runs_valet_only"
  CHECK ("handover" = 'valet' OR ("valetArrivalTakenAt" IS NULL AND "valetDepartureTakenAt" IS NULL));

-- The valet's meeting point at the airport, per parking.
ALTER TABLE "parkings" ADD COLUMN "valetMeetingPoint" TEXT;
