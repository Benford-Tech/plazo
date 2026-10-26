-- 26/10/2026: « Clés laissées » in one click, before (or without) a hook number.
ALTER TABLE "reservations" ADD COLUMN "keysLeftAt" TIMESTAMP(3);
