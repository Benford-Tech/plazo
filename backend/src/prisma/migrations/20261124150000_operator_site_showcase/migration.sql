-- 24/11/2026 (« je veux pouvoir faire des sites comme celui-ci », choix B): the parking's site gets a showcase look
-- (second colour, photo behind the title, logo, Google rating typed by the manager) and several pages.
ALTER TABLE "operator_sites"
  ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'simple',
  ADD COLUMN "accent2" TEXT,
  ADD COLUMN "heroPhotoKey" TEXT,
  ADD COLUMN "showLogo" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ratingTenths" INTEGER,
  ADD COLUMN "ratingCount" INTEGER,
  ADD COLUMN "pages" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "operator_sites"
  ADD CONSTRAINT "operator_sites_theme" CHECK ("theme" IN ('simple', 'showcase')),
  ADD CONSTRAINT "operator_sites_accent2" CHECK ("accent2" IS NULL OR "accent2" ~ '^#[0-9A-F]{6}$'),
  ADD CONSTRAINT "operator_sites_rating" CHECK (
    ("ratingTenths" IS NULL OR "ratingTenths" BETWEEN 10 AND 50)
    AND ("ratingCount" IS NULL OR ("ratingCount" BETWEEN 1 AND 1000000 AND "ratingTenths" IS NOT NULL))
  );
