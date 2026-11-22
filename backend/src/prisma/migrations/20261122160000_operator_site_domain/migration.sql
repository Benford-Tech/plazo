-- 22/11/2026: the parking's own domain name for its site.
ALTER TABLE "operator_sites" ADD COLUMN "domain" TEXT,
ADD COLUMN "domainSetAt" TIMESTAMP(3),
ADD COLUMN "domainActiveAt" TIMESTAMP(3),
ADD COLUMN "domainCheckedAt" TIMESTAMP(3),
ADD COLUMN "domainIssue" TEXT;

CREATE UNIQUE INDEX "operator_sites_domain_key" ON "operator_sites"("domain");

-- A domain is active only while it is set.
ALTER TABLE "operator_sites" ADD CONSTRAINT "operator_sites_domain_active" CHECK ("domainActiveAt" IS NULL OR "domain" IS NOT NULL);
