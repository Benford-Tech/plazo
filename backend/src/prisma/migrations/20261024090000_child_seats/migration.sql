-- Child car seats for the shuttle (24/10/2026): infant (rear-facing), toddler (1 to 4), booster (4 to 10).
ALTER TABLE "reservations" ADD COLUMN "childSeatInfant" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "childSeatToddler" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD COLUMN "childSeatBooster" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_child_seats_range"
  CHECK ("childSeatInfant" BETWEEN 0 AND 4 AND "childSeatToddler" BETWEEN 0 AND 4 AND "childSeatBooster" BETWEEN 0 AND 4);
