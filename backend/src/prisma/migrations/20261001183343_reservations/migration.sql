-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('upcoming', 'arrived', 'shuttled_out', 'return_requested', 'returned', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "ReservationChannel" AS ENUM ('website', 'phone', 'counter', 'aggregator', 'import');

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "channel" "ReservationChannel" NOT NULL,
    "channelDetail" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'upcoming',
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3) NOT NULL,
    "passengers" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "plate" TEXT NOT NULL,
    "plateKey" TEXT NOT NULL,
    "returnFlight" TEXT,
    "notes" TEXT,
    "overbooked" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT,
    "arrivedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reference_key" ON "reservations"("reference");

-- CreateIndex
CREATE INDEX "reservations_parkingId_arrivalAt_idx" ON "reservations"("parkingId", "arrivalAt");

-- CreateIndex
CREATE INDEX "reservations_parkingId_returnAt_idx" ON "reservations"("parkingId", "returnAt");

-- CreateIndex
CREATE INDEX "reservations_operatorId_plateKey_idx" ON "reservations"("operatorId", "plateKey");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Business rules enforced by the database.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_dates_order" CHECK ("returnAt" > "arrivalAt");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_passengers_range" CHECK ("passengers" BETWEEN 1 AND 9);
