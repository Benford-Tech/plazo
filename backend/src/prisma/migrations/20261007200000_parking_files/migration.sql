-- S-C (07/10/2026): files as the unit of storage on a valet parking.
CREATE TABLE "parking_files" (
    "id" TEXT NOT NULL,
    "parkingId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "capacity" INTEGER NOT NULL,
    "geometry" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "plannedDay" TEXT,
    "plannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parking_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "parking_files_parkingId_code_key" ON "parking_files"("parkingId", "code");
CREATE INDEX "parking_files_parkingId_sortOrder_idx" ON "parking_files"("parkingId", "sortOrder");

ALTER TABLE "parking_files" ADD CONSTRAINT "parking_files_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "parkings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "parking_files" ADD CONSTRAINT "parking_files_capacity_check" CHECK ("capacity" >= 1 AND "capacity" <= 200);

ALTER TABLE "reservations" ADD COLUMN "fileId" TEXT,
ADD COLUMN "fileRank" INTEGER;

CREATE INDEX "reservations_fileId_idx" ON "reservations"("fileId");

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "parking_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
