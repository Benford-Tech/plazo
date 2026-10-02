-- Platform space: operator suspension, self sign-up (email verification), invitations and the
-- review of listings by the platform.

-- CreateEnum
CREATE TYPE "OperatorStatus" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "AccountTokenType" AS ENUM ('invitation', 'email_verification');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'pending_review', 'published', 'rejected');

-- AlterTable: the published flag becomes a review status. Listings online today stay online
-- (validated now); the others are drafts.
ALTER TABLE "listings" ADD COLUMN     "reviewMessage" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "submittedAt" TIMESTAMP(3);

UPDATE "listings" SET "status" = 'published', "reviewedAt" = CURRENT_TIMESTAMP WHERE "published" = true;

ALTER TABLE "listings" DROP COLUMN "published";

-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "status" "OperatorStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "suspendedAt" TIMESTAMP(3);

-- A suspended operator always has the date of its suspension.
ALTER TABLE "operators" ADD CONSTRAINT "operators_suspended_at_check" CHECK ("status" = 'active' OR "suspendedAt" IS NOT NULL);

-- AlterTable: accounts created before email verification existed were all created by the platform.
ALTER TABLE "staff" ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3);

UPDATE "staff" SET "emailVerifiedAt" = "createdAt";

-- CreateTable
CREATE TABLE "account_tokens" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" "AccountTokenType" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_tokens_tokenHash_key" ON "account_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "account_tokens_staffId_type_idx" ON "account_tokens"("staffId", "type");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- AddForeignKey
ALTER TABLE "account_tokens" ADD CONSTRAINT "account_tokens_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
