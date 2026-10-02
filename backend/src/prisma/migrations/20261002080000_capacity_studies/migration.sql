-- CreateTable
CREATE TABLE "capacity_studies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "outline" JSONB,
    "parcels" JSONB NOT NULL DEFAULT '[]',
    "scaleFactor" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "zones" JSONB NOT NULL DEFAULT '[]',
    "exclusions" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "results" JSONB NOT NULL DEFAULT '{}',
    "carMarkers" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacity_studies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "capacity_studies_updatedAt_idx" ON "capacity_studies"("updatedAt");

-- AddForeignKey
ALTER TABLE "capacity_studies" ADD CONSTRAINT "capacity_studies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Hand-written: the scale correction stays within a plausible range.
ALTER TABLE "capacity_studies" ADD CONSTRAINT "capacity_studies_scale_factor_check" CHECK ("scaleFactor" >= 0.5 AND "scaleFactor" <= 2);
