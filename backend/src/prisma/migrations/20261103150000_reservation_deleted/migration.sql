-- « Pouvoir supprimer une réservation… elle s'archive 45 jours » (03/11/2026).
ALTER TABLE "reservations" ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "deletedById" TEXT,
ADD COLUMN "deleteReason" TEXT;

-- A reason stays short (it is shown in the trash).
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_delete_reason_length"
  CHECK ("deleteReason" IS NULL OR char_length("deleteReason") <= 200);

-- CreateIndex
CREATE INDEX "reservations_operatorId_deletedAt_idx" ON "reservations"("operatorId", "deletedAt");
