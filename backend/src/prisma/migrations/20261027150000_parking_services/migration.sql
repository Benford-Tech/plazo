-- Additional services chosen by each parking (27/10/2026, « pouvoir ajouter ou supprimer des Services additionnels »,
-- choice B + C): services from a catalogue or written by the manager, each with its icon, its lead time before the
-- return, an optional « one per booking » group and its place in the list. The fixed kinds become text keys.

ALTER TABLE "parking_extras" ALTER COLUMN "kind" TYPE TEXT USING "kind"::text;
ALTER TABLE "reservation_extras" ALTER COLUMN "kind" TYPE TEXT USING "kind"::text;
DROP TYPE "ExtraKind";

ALTER TABLE "parking_extras"
  ADD COLUMN "label" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'star',
  ADD COLUMN "groupKey" TEXT,
  ADD COLUMN "leadHours" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "custom" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- The three services of 21/10/2026 keep their texts, their prices and the parking's lead time; the two charges stay
-- « one per booking ».
UPDATE "parking_extras" e SET
  "label" = CASE e."kind"
    WHEN 'interior_wash' THEN 'Lavage intérieur et shampouineuse'
    WHEN 'hybrid_charge' THEN 'Recharge hybride'
    ELSE 'Recharge électrique' END,
  "description" = CASE e."kind"
    WHEN 'interior_wash' THEN 'Aspiration, plastiques et shampouineuse des sièges'
    WHEN 'hybrid_charge' THEN 'Batterie de votre hybride rechargeable remplie'
    ELSE 'Votre voiture électrique rechargée avant le retour' END,
  "icon" = CASE e."kind" WHEN 'interior_wash' THEN 'interior' WHEN 'hybrid_charge' THEN 'hybrid' ELSE 'ev' END,
  "groupKey" = CASE WHEN e."kind" IN ('hybrid_charge', 'ev_charge') THEN 'charge' ELSE NULL END,
  "position" = CASE e."kind" WHEN 'interior_wash' THEN 0 WHEN 'hybrid_charge' THEN 1 ELSE 2 END,
  "leadHours" = p."extrasLeadHours"
FROM "parkings" p
WHERE p."id" = e."parkingId";

ALTER TABLE "parking_extras" ALTER COLUMN "label" DROP DEFAULT;
ALTER TABLE "parking_extras"
  ADD CONSTRAINT "parking_extras_kind_format" CHECK ("kind" ~ '^[a-z][a-z0-9_]{1,39}$'),
  ADD CONSTRAINT "parking_extras_label_length" CHECK (char_length("label") BETWEEN 1 AND 60),
  ADD CONSTRAINT "parking_extras_description_length" CHECK (char_length("description") <= 140),
  ADD CONSTRAINT "parking_extras_icon" CHECK ("icon" IN ('interior', 'exterior', 'fuel', 'ev', 'hybrid', 'tyre', 'luggage', 'star')),
  ADD CONSTRAINT "parking_extras_group" CHECK ("groupKey" IS NULL OR "groupKey" IN ('charge', 'wash')),
  ADD CONSTRAINT "parking_extras_lead_hours_range" CHECK ("leadHours" BETWEEN 0 AND 168),
  -- A removed service is never offered.
  ADD CONSTRAINT "parking_extras_archived_off" CHECK ("archivedAt" IS NULL OR NOT "enabled");
