-- 17/11/2026 (« pouvoir marquer des prospects comme intéressés ou non »): a short note on why.
ALTER TABLE "prospects" ADD COLUMN "statusNote" TEXT;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_status_note_length" CHECK ("statusNote" IS NULL OR char_length("statusNote") <= 300);
