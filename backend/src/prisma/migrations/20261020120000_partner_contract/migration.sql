-- « Pouvoir stocker le contrat à faire signer » (20/10/2026, choice 2a): the Plazo ↔ operator contract.
CREATE TYPE "PartnerContractStatus" AS ENUM ('pending', 'signed', 'superseded');

CREATE TABLE "partner_contracts" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "blobKey" TEXT NOT NULL,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PartnerContractStatus" NOT NULL DEFAULT 'pending',
    "notifiedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedById" TEXT,
    "signerName" TEXT,
    "signerEmail" TEXT,
    "signerIp" TEXT,
    "signerUserAgent" TEXT,
    "signedBlobKey" TEXT,
    "signedSha256" TEXT,
    "proofBlobKey" TEXT,

    CONSTRAINT "partner_contracts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "partner_contracts_operatorId_version_key" ON "partner_contracts"("operatorId", "version");
CREATE INDEX "partner_contracts_operatorId_status_idx" ON "partner_contracts"("operatorId", "status");

ALTER TABLE "partner_contracts" ADD CONSTRAINT "partner_contracts_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- At most one contract waiting for a signature per operator.
CREATE UNIQUE INDEX "partner_contracts_one_pending" ON "partner_contracts"("operatorId") WHERE "status" = 'pending';

ALTER TABLE "partner_contracts" ADD CONSTRAINT "partner_contracts_version_positive" CHECK ("version" >= 1);
ALTER TABLE "partner_contracts" ADD CONSTRAINT "partner_contracts_size" CHECK ("sizeBytes" > 0 AND "sizeBytes" <= 4194304);
-- A signed contract has its whole proof; an unsigned one has none.
ALTER TABLE "partner_contracts" ADD CONSTRAINT "partner_contracts_signed_proof" CHECK (
    ("signedAt" IS NOT NULL) = ("signerName" IS NOT NULL)
    AND ("signedAt" IS NOT NULL) = ("signedSha256" IS NOT NULL)
    AND ("signedAt" IS NOT NULL) = ("signedBlobKey" IS NOT NULL)
    AND ("status" <> 'signed' OR "signedAt" IS NOT NULL)
    AND ("status" <> 'pending' OR "signedAt" IS NULL)
);
