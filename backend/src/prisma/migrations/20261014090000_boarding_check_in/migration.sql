-- « Embarquer en un geste » (14/10/2026): the drop-off trip at whose boarding a traveller not checked in yet was checked
-- in (« Pointé à l'embarquement par Karim »); cleared when the booking goes back to "upcoming", and if the trip goes.

ALTER TABLE "reservations" ADD COLUMN "boardingTripId" TEXT;
CREATE INDEX "reservations_boardingTripId_idx" ON "reservations"("boardingTripId");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_boardingTripId_fkey"
  FOREIGN KEY ("boardingTripId") REFERENCES "shuttle_trips"("id") ON DELETE SET NULL ON UPDATE CASCADE;
