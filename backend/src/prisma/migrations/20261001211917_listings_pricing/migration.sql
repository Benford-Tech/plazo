-- CreateEnum
CREATE TYPE "CancellationPolicy" AS ENUM ('free_until_arrival', 'free_24h', 'free_48h', 'non_refundable');

-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "commissionBps" INTEGER;

-- AlterTable
ALTER TABLE "parkings" ADD COLUMN     "extraDayPriceCents" INTEGER;

-- CreateTable
CREATE TABLE "airports" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "airports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_tiers" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "priceCents" INTEGER NOT NULL,

    CONSTRAINT "pricing_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "airportId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "services" TEXT[],
    "shuttleMinutes" INTEGER,
    "distanceKm" DOUBLE PRECISION,
    "openingHours" TEXT,
    "cancellationPolicy" "CancellationPolicy" NOT NULL DEFAULT 'free_24h',
    "photos" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "airports_code_key" ON "airports"("code");

-- CreateIndex
CREATE UNIQUE INDEX "airports_slug_key" ON "airports"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pricing_tiers_parkingId_days_key" ON "pricing_tiers"("parkingId", "days");

-- CreateIndex
CREATE UNIQUE INDEX "listings_parkingId_key" ON "listings"("parkingId");

-- CreateIndex
CREATE UNIQUE INDEX "listings_airportId_slug_key" ON "listings"("airportId", "slug");

-- AddForeignKey
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_airportId_fkey" FOREIGN KEY ("airportId") REFERENCES "airports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Business rules enforced by the database.
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_days_range" CHECK ("days" BETWEEN 1 AND 90);
ALTER TABLE "pricing_tiers" ADD CONSTRAINT "pricing_tiers_price_positive" CHECK ("priceCents" >= 0);
ALTER TABLE "parkings" ADD CONSTRAINT "parkings_extra_day_positive" CHECK ("extraDayPriceCents" IS NULL OR "extraDayPriceCents" >= 0);
ALTER TABLE "operators" ADD CONSTRAINT "operators_commission_range" CHECK ("commissionBps" IS NULL OR "commissionBps" BETWEEN 0 AND 5000);

-- First airport of the platform.
INSERT INTO "airports" ("id", "code", "name", "city", "slug", "timezone", "latitude", "longitude")
VALUES ('airport_lys', 'LYS', 'Lyon Saint-Exupéry', 'Lyon', 'lyon-saint-exupery', 'Europe/Paris', 45.7256, 5.0811)
ON CONFLICT DO NOTHING;
