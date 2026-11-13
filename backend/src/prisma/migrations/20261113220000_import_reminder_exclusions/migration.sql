-- 13/11/2026 (« aucun envoi n'est exclu par Joanny ! »): the file import left every stay to come out of the day-before
-- message in the importer's name. An exclusion still carrying the import's own stamp and the importer's id is the
-- import's, not a person's choice: it is no longer anybody's (« Heure à vérifier »). The stays to come whose file gave
-- an arrival time (not the 08:00 Plazo puts when the file gives none) get their message again, except on the test and
-- demo operators.
UPDATE "reservations" AS r
SET "reminderExcludedById" = NULL
FROM "reservation_imports" AS i
WHERE r."importId" = i."id"
  AND r."reminderExcludedAt" = i."createdAt"
  AND r."reminderExcludedById" IS NOT DISTINCT FROM i."staffId";

UPDATE "reservations" AS r
SET "reminderExcludedAt" = NULL
FROM "reservation_imports" AS i, "operators" AS o, "parkings" AS p
WHERE r."importId" = i."id"
  AND o."id" = r."operatorId"
  AND p."id" = r."parkingId"
  AND NOT o."isDemo"
  AND NOT o."prospectDemo"
  AND o."name" !~ '\(tests\)\s*$'
  AND r."reminderExcludedAt" = i."createdAt"
  AND r."reminderExcludedById" IS NULL
  AND r."status" = 'upcoming'
  AND r."reminderSentAt" IS NULL
  AND r."arrivalAt" > NOW()
  AND to_char(r."arrivalAt" AT TIME ZONE 'UTC' AT TIME ZONE p."timezone", 'HH24:MI') <> '08:00';
