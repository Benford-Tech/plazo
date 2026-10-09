-- 09/10/2026 (« archive les parkings suspendus »): archived operators, out of the platform's lists and the crons.
ALTER TABLE "operators" ADD COLUMN "archivedAt" TIMESTAMP(3);

-- Only a suspended operator can be archived (reactivating clears the date in the same update).
ALTER TABLE "operators" ADD CONSTRAINT "operators_archived_suspended_check" CHECK ("archivedAt" IS NULL OR "status" = 'suspended');

-- Joanny's request: every operator suspended today is archived.
UPDATE "operators" SET "archivedAt" = CURRENT_TIMESTAMP WHERE "status" = 'suspended';
