-- 13/10/2026 (« ok pour la partie rejoindre un parking »): Plazo Pro sign-in with Apple (iPhone) or Google (Android), then
-- joining a parking with its daily code; a manager accepts the request. Leaving a parking and deleting one's account.
-- CreateEnum
CREATE TYPE "IdentityProvider" AS ENUM ('apple', 'google');

-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('pending', 'accepted', 'refused', 'cancelled', 'expired');

-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "leftAt" TIMESTAMP(3),
ADD COLUMN     "passwordSetAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "staff_identities" (
    "id" TEXT NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "subject" TEXT NOT NULL,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrivateEmail" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSignInAt" TIMESTAMP(3),

    CONSTRAINT "staff_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity_tokens" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "identity_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_join_requests" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "wishedRole" "StaffRole" NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'pending',
    "role" "StaffRole",
    "staffId" TEXT,
    "decidedById" TEXT,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_join_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_attempts" (
    "id" TEXT NOT NULL,
    "identityId" TEXT,
    "ipKey" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_identities_staffId_idx" ON "staff_identities"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_identities_provider_subject_key" ON "staff_identities"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "identity_tokens_uid_key" ON "identity_tokens"("uid");

-- CreateIndex
CREATE INDEX "identity_tokens_identityId_idx" ON "identity_tokens"("identityId");

-- CreateIndex
CREATE INDEX "staff_join_requests_operatorId_status_createdAt_idx" ON "staff_join_requests"("operatorId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "staff_join_requests_identityId_createdAt_idx" ON "staff_join_requests"("identityId", "createdAt");

-- CreateIndex
CREATE INDEX "join_attempts_identityId_createdAt_idx" ON "join_attempts"("identityId", "createdAt");

-- CreateIndex
CREATE INDEX "join_attempts_ipKey_createdAt_idx" ON "join_attempts"("ipKey", "createdAt");

-- AddForeignKey
ALTER TABLE "staff_identities" ADD CONSTRAINT "staff_identities_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity_tokens" ADD CONSTRAINT "identity_tokens_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "staff_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "staff_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_attempts" ADD CONSTRAINT "join_attempts_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "staff_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- One identity per provider and member (Prisma cannot express a partial unique index).
CREATE UNIQUE INDEX "staff_identities_staffId_provider_key" ON "staff_identities"("staffId", "provider") WHERE "staffId" IS NOT NULL;
-- One pending request per identity.
CREATE UNIQUE INDEX "staff_join_requests_identityId_pending_key" ON "staff_join_requests"("identityId") WHERE "status" = 'pending';

-- Business rules enforced by the database (Prisma cannot express CHECK constraints).
ALTER TABLE "staff_identities" ADD CONSTRAINT "staff_identities_subject_length"
  CHECK (char_length("subject") BETWEEN 1 AND 255);
ALTER TABLE "identity_tokens" ADD CONSTRAINT "identity_tokens_expiry"
  CHECK ("expiresAt" > "createdAt");
-- A request asks for, and is accepted with, a role below manager (a manager promotes afterwards).
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_wished_role"
  CHECK ("wishedRole" IN ('agent', 'driver', 'valet'));
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_role"
  CHECK ("role" IS NULL OR "role" IN ('agent', 'driver', 'valet'));
-- Only an accepted request names the member it created.
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_member"
  CHECK ("status" = 'accepted' OR "staffId" IS NULL);
-- A manager's answer (accepted or refused) carries its date; nothing else does.
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_decided"
  CHECK (("status" IN ('accepted', 'refused')) = ("decidedAt" IS NOT NULL));
ALTER TABLE "staff_join_requests" ADD CONSTRAINT "staff_join_requests_names"
  CHECK (char_length("firstName") BETWEEN 1 AND 60 AND char_length("lastName") BETWEEN 1 AND 60);
-- A member who left or deleted their account is never active again.
ALTER TABLE "staff" ADD CONSTRAINT "staff_left_inactive" CHECK ("leftAt" IS NULL OR NOT "isActive");
ALTER TABLE "staff" ADD CONSTRAINT "staff_deleted_inactive" CHECK ("deletedAt" IS NULL OR NOT "isActive");

-- Every existing member chose their password at their creation, except an invited manager who never accepted the
-- invitation (their stored hash is a random one nobody knows).
UPDATE "staff" s SET "passwordSetAt" = s."createdAt"
WHERE NOT (
  EXISTS (SELECT 1 FROM "account_tokens" t WHERE t."staffId" = s."id" AND t."type" = 'invitation')
  AND NOT EXISTS (SELECT 1 FROM "account_tokens" t WHERE t."staffId" = s."id" AND t."type" = 'invitation' AND t."usedAt" IS NOT NULL)
);
