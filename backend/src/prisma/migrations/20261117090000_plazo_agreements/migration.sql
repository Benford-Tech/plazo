-- The two contracts Plazo writes for every operator (17/11/2026, choice C).
ALTER TABLE "operators" ADD COLUMN "proPlan" TEXT;
ALTER TABLE "operators" ADD COLUMN "proPlanYearly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "operators" ADD CONSTRAINT "operators_pro_plan" CHECK ("proPlan" IS NULL OR "proPlan" IN ('essentiel', 'operations', 'complet'));

CREATE TABLE "plazo_agreements" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "textSha256" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedById" TEXT,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signerIp" TEXT,
    "signerUserAgent" TEXT,
    "pdf" BYTEA NOT NULL,
    "pdfSha256" TEXT NOT NULL,
    "proof" BYTEA NOT NULL,

    CONSTRAINT "plazo_agreements_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "plazo_agreements_kind" CHECK ("kind" IN ('pro_terms', 'listing'))
);

CREATE UNIQUE INDEX "plazo_agreements_operatorId_kind_version_key" ON "plazo_agreements"("operatorId", "kind", "version");
CREATE INDEX "plazo_agreements_operatorId_signedAt_idx" ON "plazo_agreements"("operatorId", "signedAt");

ALTER TABLE "plazo_agreements" ADD CONSTRAINT "plazo_agreements_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
