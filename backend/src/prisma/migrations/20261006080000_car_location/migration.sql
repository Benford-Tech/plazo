-- Where the car is parked (06/10/2026): GPS position recorded by the traveller or the staff.
CREATE TYPE "CarLocatedBy" AS ENUM ('traveller', 'staff');

ALTER TABLE "reservations"
  ADD COLUMN "carLat" DOUBLE PRECISION,
  ADD COLUMN "carLng" DOUBLE PRECISION,
  ADD COLUMN "carAccuracyM" INTEGER,
  ADD COLUMN "carLocatedAt" TIMESTAMP(3),
  ADD COLUMN "carLocatedBy" "CarLocatedBy",
  ADD COLUMN "carNote" TEXT;

ALTER TABLE "reservations"
  ADD CONSTRAINT "reservations_car_lat_check" CHECK ("carLat" IS NULL OR ("carLat" BETWEEN -90 AND 90)),
  ADD CONSTRAINT "reservations_car_lng_check" CHECK ("carLng" IS NULL OR ("carLng" BETWEEN -180 AND 180));
