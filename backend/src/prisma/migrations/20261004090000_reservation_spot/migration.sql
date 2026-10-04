-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "spotId" TEXT, ADD COLUMN "keyHook" TEXT;

-- CreateIndex
CREATE INDEX "reservations_spotId_idx" ON "reservations"("spotId");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "parking_spots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
