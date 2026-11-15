-- 15/11/2026 (« je ne vois plus les colonnes Détail outil, Outil détecté ») : the software seen at the parking and what was seen.
ALTER TABLE "prospects" ADD COLUMN "tool" TEXT;
ALTER TABLE "prospects" ADD COLUMN "toolDetail" TEXT;
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_tool_length" CHECK ("tool" IS NULL OR char_length("tool") <= 80);
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_tool_detail_length" CHECK ("toolDetail" IS NULL OR char_length("toolDetail") <= 200);
