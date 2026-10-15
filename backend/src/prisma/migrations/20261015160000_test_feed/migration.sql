-- 15/10/2026 (« ajoute en continu des données de tests pour le chauffeur pour qu'il ait toujours des personnes à
-- emmener »): the continuous fictional travellers of the platform's own test operator (TestFeedService). One row per
-- operator, created at the first read of the driver's lists; the bookings themselves are ordinary rows (TS-201-PZ to
-- TS-240-PZ, externalReference TEST-FEED-…): no column changes on reservations.
CREATE TABLE "test_feeds" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "ranAt" TIMESTAMP(3),
    "state" JSONB NOT NULL DEFAULT '{}',
    "lastReport" JSONB,
    "lastError" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "test_feeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "test_feeds_operatorId_key" ON "test_feeds"("operatorId");

ALTER TABLE "test_feeds" ADD CONSTRAINT "test_feeds_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
