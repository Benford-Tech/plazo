-- CreateEnum
CREATE TYPE "ShuttleTripDirection" AS ENUM ('pickup', 'dropoff');

-- AlterTable: the vehicle sheet (seats, in service, usual driver)
ALTER TABLE "shuttle_vehicles"
  ADD COLUMN "seats" INTEGER,
  ADD COLUMN "inService" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "driverId" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "shuttle_vehicles" ADD CONSTRAINT "shuttle_vehicles_seats_check" CHECK ("seats" IS NULL OR ("seats" >= 1 AND "seats" <= 60));

-- AddForeignKey
ALTER TABLE "shuttle_vehicles" ADD CONSTRAINT "shuttle_vehicles_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: trips go both ways
ALTER TABLE "shuttle_trips" ADD COLUMN "direction" "ShuttleTripDirection" NOT NULL DEFAULT 'pickup';
