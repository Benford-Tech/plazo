-- 01/11/2026 (« crée une fausse annonce sur le parking de démo »): the fictitious car park made for the App Store review
-- becomes a test account (« … (tests) »): shown with the DÉMO badge on Plazo, not indexed, never paid with real money.
UPDATE "operators" o
SET "name" = 'Parking Revue (tests)'
WHERE o."name" = 'Parking Revue'
  AND EXISTS (SELECT 1 FROM "staff" s WHERE s."operatorId" = o."id" AND s."email" = 'apple-review-gerant@plazo.fr');
