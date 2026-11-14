-- 14/11/2026: the team page shows the last activity, not the last sign-in.
ALTER TABLE "staff" ADD COLUMN "lastActiveAt" TIMESTAMP(3);
UPDATE "staff" SET "lastActiveAt" = "lastLoginAt" WHERE "lastLoginAt" IS NOT NULL;
