-- 30/10/2026: where the flights go and come from (IATA), read with the flight tracking, shown on the day planning.
ALTER TABLE "reservations" ADD COLUMN "flightOrigin" TEXT;
ALTER TABLE "reservations" ADD COLUMN "departureDestination" TEXT;
