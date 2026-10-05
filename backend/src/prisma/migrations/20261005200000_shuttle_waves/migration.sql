-- Shuttle waves (V-A, 05/10/2026): the outbound flight and the parking's lead times.
ALTER TABLE "parkings"
  ADD COLUMN "terminalLeadMinutes" INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN "landingDelayMinutes" INTEGER NOT NULL DEFAULT 30;

ALTER TABLE "reservations"
  ADD COLUMN "departureFlight" TEXT,
  ADD COLUMN "departureStatus" "FlightStatus",
  ADD COLUMN "departureScheduledAt" TIMESTAMP(3),
  ADD COLUMN "departureEstimatedAt" TIMESTAMP(3),
  ADD COLUMN "departureTerminal" TEXT,
  ADD COLUMN "departureCheckedAt" TIMESTAMP(3);

ALTER TABLE "parkings"
  ADD CONSTRAINT "parkings_terminal_lead_check" CHECK ("terminalLeadMinutes" BETWEEN 0 AND 360),
  ADD CONSTRAINT "parkings_landing_delay_check" CHECK ("landingDelayMinutes" BETWEEN 0 AND 180);
