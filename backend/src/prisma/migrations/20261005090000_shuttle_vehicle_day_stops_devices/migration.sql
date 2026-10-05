-- Shuttle (05/10/2026): the driver's vehicle of the day (V-A), the stops served besides the
-- airport (D-A), the staff's shuttle notifications and the travellers' phones (N-A).

CREATE TYPE "ShuttleStopKind" AS ENUM ('airport', 'station', 'other');

ALTER TABLE "staff"
  ADD COLUMN "vehicleId" TEXT,
  ADD COLUMN "vehicleSetAt" TIMESTAMP(3),
  ADD COLUMN "notifyShuttles" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "shuttle_stops" (
  "id" TEXT NOT NULL,
  "parkingId" TEXT NOT NULL,
  "kind" "ShuttleStopKind" NOT NULL DEFAULT 'other',
  "name" TEXT NOT NULL,
  "lat" DOUBLE PRECISION NOT NULL,
  "lng" DOUBLE PRECISION NOT NULL,
  "instructions" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shuttle_stops_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "shuttle_stops_parkingId_idx" ON "shuttle_stops"("parkingId");
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_parkingId_fkey"
  FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_lat_check" CHECK ("lat" BETWEEN -90 AND 90);
ALTER TABLE "shuttle_stops" ADD CONSTRAINT "shuttle_stops_lng_check" CHECK ("lng" BETWEEN -180 AND 180);

ALTER TABLE "staff" ADD CONSTRAINT "staff_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "shuttle_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD COLUMN "stopId" TEXT;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_stopId_fkey"
  FOREIGN KEY ("stopId") REFERENCES "shuttle_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "shuttle_trips"
  ADD COLUMN "stopId" TEXT,
  ADD COLUMN "stopKind" "ShuttleStopKind",
  ADD COLUMN "stopName" TEXT,
  ADD COLUMN "arrivedNotifiedAt" TIMESTAMP(3);
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_stopId_fkey"
  FOREIGN KEY ("stopId") REFERENCES "shuttle_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "traveller_devices" (
  "id" TEXT NOT NULL,
  "reservationId" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "platform" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "traveller_devices_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "traveller_devices_subscriptionId_key" ON "traveller_devices"("subscriptionId");
CREATE INDEX "traveller_devices_reservationId_idx" ON "traveller_devices"("reservationId");
ALTER TABLE "traveller_devices" ADD CONSTRAINT "traveller_devices_reservationId_fkey"
  FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
