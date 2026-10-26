-- The parking's own contract (26/10/2026, choice A « Mon PDF »), and the signed PDF + proof of each signature.
CREATE TABLE "operator_contract_templates" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "blobKey" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "retiredById" TEXT,

    CONSTRAINT "operator_contract_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "operator_contract_templates_operatorId_version_key" ON "operator_contract_templates"("operatorId", "version");
CREATE INDEX "operator_contract_templates_operatorId_retiredAt_idx" ON "operator_contract_templates"("operatorId", "retiredAt");
-- One contract in force per operator.
CREATE UNIQUE INDEX "operator_contract_templates_one_in_force" ON "operator_contract_templates"("operatorId") WHERE "retiredAt" IS NULL;
ALTER TABLE "operator_contract_templates" ADD CONSTRAINT "operator_contract_templates_version_positive" CHECK ("version" > 0);
ALTER TABLE "operator_contract_templates" ADD CONSTRAINT "operator_contract_templates_pages_positive" CHECK ("pageCount" > 0 AND "sizeBytes" > 0);

ALTER TABLE "operator_contract_templates" ADD CONSTRAINT "operator_contract_templates_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reservation_contracts" ADD COLUMN "templateId" TEXT,
ADD COLUMN "signedBlobKey" TEXT,
ADD COLUMN "signedSha256" TEXT,
ADD COLUMN "proofBlobKey" TEXT;

CREATE INDEX "reservation_contracts_templateId_idx" ON "reservation_contracts"("templateId");
ALTER TABLE "reservation_contracts" ADD CONSTRAINT "reservation_contracts_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "operator_contract_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
