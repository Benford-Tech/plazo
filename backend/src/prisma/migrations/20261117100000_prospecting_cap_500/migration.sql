-- 17/11/2026 (« passe le plafond par défaut à 500 »): 500 prospecting emails a day by default, 1 000 at most.
ALTER TABLE "prospecting_settings" DROP CONSTRAINT "prospecting_settings_daily_cap_range";
ALTER TABLE "prospecting_settings" ADD CONSTRAINT "prospecting_settings_daily_cap_range" CHECK ("dailyCap" BETWEEN 1 AND 1000);
ALTER TABLE "prospecting_settings" ALTER COLUMN "dailyCap" SET DEFAULT 500;
-- A setting left at the old default takes the new one; a cap chosen by hand stays.
UPDATE "prospecting_settings" SET "dailyCap" = 500 WHERE "dailyCap" = 50;
