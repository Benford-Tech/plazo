-- CreateEnum
CREATE TYPE "SpotKind" AS ENUM ('standard', 'large', 'covered', 'pmr', 'reserved');

-- CreateTable
CREATE TABLE "parking_plans" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "outline" JSONB,
    "parcels" JSONB NOT NULL DEFAULT '[]',
    "scaleFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "zones" JSONB NOT NULL DEFAULT '[]',
    "exclusions" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "landmarks" JSONB NOT NULL DEFAULT '[]',
    "layout" TEXT,
    "generatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parking_spots" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "index" INTEGER NOT NULL,
    "kind" "SpotKind" NOT NULL DEFAULT 'standard',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "geometry" JSONB NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_spots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parking_plans_parkingId_key" ON "parking_plans"("parkingId");

-- CreateIndex
CREATE UNIQUE INDEX "parking_spots_parkingId_code_key" ON "parking_spots"("parkingId", "code");

-- CreateIndex
CREATE INDEX "parking_spots_parkingId_zoneId_row_index_idx" ON "parking_spots"("parkingId", "zoneId", "row", "index");

-- AddForeignKey
ALTER TABLE "parking_plans" ADD CONSTRAINT "parking_plans_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guards the API also enforces.
ALTER TABLE "parking_spots" ADD CONSTRAINT "parking_spots_row_check" CHECK ("row" >= 1 AND "index" >= 1);
ALTER TABLE "parking_plans" ADD CONSTRAINT "parking_plans_scale_check" CHECK ("scaleFactor" >= 0.5 AND "scaleFactor" <= 2);
