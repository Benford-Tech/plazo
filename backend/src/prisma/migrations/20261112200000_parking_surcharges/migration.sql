-- 12/11/2026: the parking's supplements (« Suppléments et conditions »), a JSON list; null = never set.
ALTER TABLE "parkings" ADD COLUMN "surcharges" JSONB;
