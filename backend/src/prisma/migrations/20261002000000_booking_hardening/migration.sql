-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "contactPhone" TEXT;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "manageTokenVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "reservations_idempotencyKey_key" ON "reservations"("idempotencyKey");

