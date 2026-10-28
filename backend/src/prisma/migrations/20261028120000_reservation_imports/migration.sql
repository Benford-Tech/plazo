-- 28/10/2026 (« importer des anciennes réservations dans plazo et avoir un aperçu avant de valider »): file imports.
CREATE TABLE "reservation_imports" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "staffId" TEXT,
    "fileName" TEXT NOT NULL DEFAULT '',
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "removedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undoneAt" TIMESTAMP(3),

    CONSTRAINT "reservation_imports_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reservation_imports_counts" CHECK ("createdCount" >= 0 AND "removedCount" >= 0 AND "removedCount" <= "createdCount")
);

CREATE INDEX "reservation_imports_operatorId_createdAt_idx" ON "reservation_imports"("operatorId", "createdAt");

ALTER TABLE "reservation_imports" ADD CONSTRAINT "reservation_imports_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservation_imports" ADD CONSTRAINT "reservation_imports_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "reservations" ADD COLUMN "importId" TEXT;
CREATE INDEX "reservations_importId_idx" ON "reservations"("importId");
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_importId_fkey" FOREIGN KEY ("importId") REFERENCES "reservation_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
