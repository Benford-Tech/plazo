-- 16/11/2026 (test de charge): indexes behind the dashboard's slowest reads (30 ms each on 50 000 bookings).

-- The shuttle forecast: a day's outbound flights (by take-off) and return flights (by landing).
CREATE INDEX "reservations_parkingId_departureScheduledAt_idx" ON "reservations"("parkingId", "departureScheduledAt");
CREATE INDEX "reservations_parkingId_flightEstimatedAt_idx" ON "reservations"("parkingId", "flightEstimatedAt");

-- The operator's last imported booking (« Import » service tile), and any read of an operator's bookings by creation.
CREATE INDEX "reservations_operatorId_createdAt_idx" ON "reservations"("operatorId", "createdAt");

-- Bookings without a price (« Sans prix », alert price_missing): few rows, kept out of the schema (partial index).
CREATE INDEX "reservations_no_price_idx" ON "reservations"("operatorId", "arrivalAt") WHERE "priceCents" IS NULL AND "deletedAt" IS NULL;

-- Invoices asked for by the traveller (alert invoice_requested): partial index too.
CREATE INDEX "reservations_invoice_requested_idx" ON "reservations"("operatorId", "invoiceRequestedAt") WHERE "invoiceRequestedAt" IS NOT NULL;
