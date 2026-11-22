-- 22/11/2026: where a prospect of the « Nouveaux parkings » workflow was found, and its dates.
ALTER TABLE "prospects" ADD COLUMN "origin" TEXT;
ALTER TABLE "prospects" ADD COLUMN "foundOn" TEXT;
ALTER TABLE "prospects" ADD COLUMN "opensOn" TEXT;

ALTER TABLE "prospects" ADD CONSTRAINT "prospects_origin" CHECK ("origin" IS NULL OR "origin" IN ('bodacc', 'directory'));
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_found_on" CHECK ("foundOn" IS NULL OR "foundOn" ~ '^\d{4}-\d{2}-\d{2}$');
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_opens_on" CHECK ("opensOn" IS NULL OR "opensOn" ~ '^\d{4}-\d{2}-\d{2}$');
