-- P-B (07/10/2026): spots laid by hand survive a regeneration.
ALTER TABLE "parking_spots" ADD COLUMN "manual" BOOLEAN NOT NULL DEFAULT false;
