-- CreateEnum
CREATE TYPE "FlightStatus" AS ENUM ('scheduled', 'delayed', 'departed', 'landed', 'cancelled', 'diverted', 'unknown');

-- CreateEnum
CREATE TYPE "FlightLandedSource" AS ENUM ('tracking', 'traveller');

-- CreateEnum
CREATE TYPE "ShuttleTripStatus" AS ENUM ('running', 'ended');

-- CreateEnum
CREATE TYPE "ShuttleTripEndReason" AS ENUM ('completed', 'expired');

-- AlterTable
ALTER TABLE "parkings" ADD COLUMN     "returnMeetingInstructions" TEXT,
ADD COLUMN     "returnMeetingPhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "flightCheckedAt" TIMESTAMP(3),
ADD COLUMN     "flightEstimatedAt" TIMESTAMP(3),
ADD COLUMN     "flightGate" TEXT,
ADD COLUMN     "flightLandedAt" TIMESTAMP(3),
ADD COLUMN     "flightLandedSource" "FlightLandedSource",
ADD COLUMN     "flightScheduledAt" TIMESTAMP(3),
ADD COLUMN     "flightStatus" "FlightStatus",
ADD COLUMN     "flightTerminal" TEXT,
ADD COLUMN     "landingNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "landingSmsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "shuttle_vehicles" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "colour" TEXT,
    "plate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shuttle_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shuttle_trips" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "vehicleModel" TEXT,
    "vehicleColour" TEXT,
    "vehiclePlate" TEXT,
    "status" "ShuttleTripStatus" NOT NULL,
    "endReason" "ShuttleTripEndReason",
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "positionRecordedAt" TIMESTAMP(3),
    "positionReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shuttle_trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shuttle_trip_passengers" (
    "tripId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shuttle_trip_passengers_pkey" PRIMARY KEY ("tripId","reservationId")
);

-- CreateIndex
CREATE INDEX "shuttle_vehicles_operatorId_idx" ON "shuttle_vehicles"("operatorId");

-- CreateIndex
CREATE INDEX "shuttle_trips_operatorId_status_idx" ON "shuttle_trips"("operatorId", "status");

-- CreateIndex
CREATE INDEX "shuttle_trips_driverId_status_idx" ON "shuttle_trips"("driverId", "status");

-- CreateIndex
CREATE INDEX "shuttle_trips_status_expiresAt_idx" ON "shuttle_trips"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "shuttle_trip_passengers_reservationId_idx" ON "shuttle_trip_passengers"("reservationId");

-- AddForeignKey
ALTER TABLE "shuttle_vehicles" ADD CONSTRAINT "shuttle_vehicles_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "shuttle_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trip_passengers" ADD CONSTRAINT "shuttle_trip_passengers_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "shuttle_trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shuttle_trip_passengers" ADD CONSTRAINT "shuttle_trip_passengers_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written checks (RGPD: the driver's position exists only while the trip runs, never a history).
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_position_only_while_running"
  CHECK (("lat" IS NULL AND "lng" IS NULL AND "accuracyM" IS NULL AND "positionRecordedAt" IS NULL) OR "status" = 'running');
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_position_complete"
  CHECK (("lat" IS NULL) = ("lng" IS NULL));
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_position_range"
  CHECK ("lat" IS NULL OR ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180));
ALTER TABLE "shuttle_trips" ADD CONSTRAINT "shuttle_trips_window"
  CHECK ("expiresAt" > "startedAt");
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_return_meeting_instructions_length"
  CHECK ("returnMeetingInstructions" IS NULL OR char_length("returnMeetingInstructions") <= 500);
