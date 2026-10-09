-- 09/10/2026: every traveller has a first name and a last name; `customerName` stays the display form.
ALTER TABLE "reservations" ADD COLUMN "customerFirstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "reservations" ADD COLUMN "customerLastName" TEXT NOT NULL DEFAULT '';
UPDATE "reservations" SET
  "customerFirstName" = CASE WHEN position(' ' in btrim("customerName")) > 0 THEN split_part(btrim("customerName"), ' ', 1) ELSE btrim("customerName") END,
  "customerLastName" = CASE WHEN position(' ' in btrim("customerName")) > 0 THEN btrim(substr(btrim("customerName"), position(' ' in btrim("customerName")) + 1)) ELSE '' END;
