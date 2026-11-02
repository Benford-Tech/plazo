-- 02/11/2026: the parking logo shown to the team in Plazo Pro and the web pro space (direction B).
ALTER TABLE "operators" ADD COLUMN "logoKey" TEXT, ADD COLUMN "logoUpdatedAt" TIMESTAMP(3);
