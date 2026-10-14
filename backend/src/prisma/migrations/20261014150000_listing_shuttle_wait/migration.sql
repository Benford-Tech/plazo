-- Listing tags (14/10/2026, « C et L3, avec le filtre, attente déclarée »): the average wait for the shuttle, declared by
-- the operator on « Ma fiche » next to the ride (« Temps d'attente moyen : 5 min »); null: not declared, no tag.
ALTER TABLE "listings" ADD COLUMN "shuttleWaitMinutes" INTEGER;

-- Business rule enforced by the database (Prisma cannot express CHECK constraints).
ALTER TABLE "listings" ADD CONSTRAINT "listings_shuttle_wait_range"
  CHECK ("shuttleWaitMinutes" IS NULL OR "shuttleWaitMinutes" BETWEEN 0 AND 120);
