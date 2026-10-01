-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "externalReference" TEXT,
ADD COLUMN     "priceCents" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_operatorId_externalReference_key" ON "reservations"("operatorId", "externalReference");

