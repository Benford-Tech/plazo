-- 06/10/2026: every staff member has a first name and a last name; `name` stays the display form.
ALTER TABLE "staff" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "staff" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';
UPDATE "staff" SET
  "firstName" = CASE WHEN position(' ' in btrim("name")) > 0 THEN split_part(btrim("name"), ' ', 1) ELSE btrim("name") END,
  "lastName" = CASE WHEN position(' ' in btrim("name")) > 0 THEN btrim(substr(btrim("name"), position(' ' in btrim("name")) + 1)) ELSE '' END;
