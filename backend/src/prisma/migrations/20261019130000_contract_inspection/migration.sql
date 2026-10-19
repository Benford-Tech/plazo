
-- CreateEnum
CREATE TYPE "SignatureMethod" AS ENUM ('sms_code', 'handwritten', 'booking_link');

-- CreateEnum
CREATE TYPE "SignatureDevice" AS ENUM ('traveller_app', 'staff_device');

-- CreateEnum
CREATE TYPE "InspectionKind" AS ENUM ('dropoff', 'return');

-- CreateEnum
CREATE TYPE "InspectionDecision" AS ENUM ('pending', 'accepted', 'accepted_by_default', 'reserved');

-- CreateTable
CREATE TABLE "reservation_contracts" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textSha256" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "method" "SignatureMethod" NOT NULL,
    "device" "SignatureDevice" NOT NULL,
    "phoneMasked" TEXT,
    "strokes" JSONB,
    "witnessedById" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proofSha256" TEXT NOT NULL,
    "emailedAt" TIMESTAMP(3),

    CONSTRAINT "reservation_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signature_codes" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "phoneMasked" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signature_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_inspections" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "kind" "InspectionKind" NOT NULL,
    "damages" JSONB NOT NULL DEFAULT '[]',
    "mileageKm" INTEGER,
    "fuelQuarters" INTEGER,
    "notes" TEXT,
    "performedById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "decision" "InspectionDecision" NOT NULL DEFAULT 'pending',
    "decidedAt" TIMESTAMP(3),
    "decisionMethod" "SignatureMethod",
    "decisionDevice" "SignatureDevice",
    "strokes" JSONB,
    "reserveText" TEXT,
    "proofSha256" TEXT,
    "photosErasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_photos" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservation_contracts_reservationId_key" ON "reservation_contracts"("reservationId");

-- CreateIndex
CREATE INDEX "signature_codes_reservationId_createdAt_idx" ON "signature_codes"("reservationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_inspections_reservationId_kind_key" ON "vehicle_inspections"("reservationId", "kind");

-- CreateIndex
CREATE INDEX "inspection_photos_inspectionId_idx" ON "inspection_photos"("inspectionId");

-- AddForeignKey
ALTER TABLE "reservation_contracts" ADD CONSTRAINT "reservation_contracts_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signature_codes" ADD CONSTRAINT "signature_codes_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_photos" ADD CONSTRAINT "inspection_photos_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "vehicle_inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Checks (added by hand).
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_fuel_range" CHECK ("fuelQuarters" IS NULL OR "fuelQuarters" BETWEEN 0 AND 4);
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_mileage_range" CHECK ("mileageKm" IS NULL OR "mileageKm" BETWEEN 0 AND 2000000);
-- An answer only on a completed report.
ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "vehicle_inspections_decided_when_completed" CHECK ("decision" = 'pending' OR "completedAt" IS NOT NULL);
