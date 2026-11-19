-- 19/11/2026 (niveau 2 « l'extension WordPress Plazo »): the key of the parking's WordPress site.
CREATE TABLE "website_integrations" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "lastBookingAt" TIMESTAMP(3),
    "siteHost" TEXT,
    CONSTRAINT "website_integrations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "website_integrations_site_host" CHECK ("siteHost" IS NULL OR char_length("siteHost") <= 255)
);
CREATE UNIQUE INDEX "website_integrations_operatorId_key" ON "website_integrations"("operatorId");
CREATE UNIQUE INDEX "website_integrations_keyHash_key" ON "website_integrations"("keyHash");
ALTER TABLE "website_integrations" ADD CONSTRAINT "website_integrations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
