-- 22/11/2026: the parking's own site (blocks, paid extra switched on by the platform).
CREATE TABLE "operator_sites" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "blocks" JSONB,
    "addonRequestedAt" TIMESTAMP(3),
    "addonAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operator_sites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_sites_operatorId_key" ON "operator_sites"("operatorId");

ALTER TABLE "operator_sites" ADD CONSTRAINT "operator_sites_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A site is only online with its extra.
ALTER TABLE "operator_sites" ADD CONSTRAINT "operator_sites_published_needs_addon" CHECK ("publishedAt" IS NULL OR "addonAt" IS NOT NULL);
