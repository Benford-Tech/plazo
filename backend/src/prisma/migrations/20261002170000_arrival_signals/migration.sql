-- CreateEnum
CREATE TYPE "ArrivalKind" AS ENUM ('outbound', 'return');

-- CreateEnum
CREATE TYPE "ArrivalState" AS ENUM ('sharing', 'announced', 'at_meeting_point', 'ended');

-- CreateEnum
CREATE TYPE "ArrivalEndReason" AS ENUM ('stopped', 'expired', 'closed');

-- AlterTable
ALTER TABLE "parkings" ADD COLUMN     "returnMeetingLabel" TEXT,
ADD COLUMN     "returnMeetingPoint" geometry(Point, 4326);

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "notifyArrivals" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyReturns" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "arrival_signals" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "kind" "ArrivalKind" NOT NULL,
    "state" "ArrivalState" NOT NULL,
    "endReason" "ArrivalEndReason",
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" DOUBLE PRECISION,
    "positionRecordedAt" TIMESTAMP(3),
    "positionReceivedAt" TIMESTAMP(3),
    "distanceM" INTEGER,
    "etaMinutes" INTEGER,
    "etaAt" TIMESTAMP(3),
    "announcedMinutes" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "atMeetingPointAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "notifiedStartAt" TIMESTAMP(3),
    "notifiedSoonAt" TIMESTAMP(3),
    "notifiedArrivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arrival_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_devices" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "platform" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "arrival_signals_operatorId_state_idx" ON "arrival_signals"("operatorId", "state");

-- CreateIndex
CREATE INDEX "arrival_signals_state_expiresAt_idx" ON "arrival_signals"("state", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "arrival_signals_reservationId_kind_key" ON "arrival_signals"("reservationId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "staff_devices_subscriptionId_key" ON "staff_devices"("subscriptionId");

-- CreateIndex
CREATE INDEX "staff_devices_staffId_idx" ON "staff_devices"("staffId");

-- AddForeignKey
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_devices" ADD CONSTRAINT "staff_devices_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written checks (RGPD: a position exists only while it is being shared, never a history).
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_position_only_while_sharing"
  CHECK (("lat" IS NULL AND "lng" IS NULL AND "accuracyM" IS NULL AND "positionRecordedAt" IS NULL) OR "state" = 'sharing');
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_position_complete"
  CHECK (("lat" IS NULL) = ("lng" IS NULL));
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_position_range"
  CHECK ("lat" IS NULL OR ("lat" BETWEEN -90 AND 90 AND "lng" BETWEEN -180 AND 180));
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_announced_minutes"
  CHECK ("announcedMinutes" IS NULL OR "announcedMinutes" IN (10, 20, 30));
ALTER TABLE "arrival_signals" ADD CONSTRAINT "arrival_signals_window"
  CHECK ("expiresAt" > "startedAt");
