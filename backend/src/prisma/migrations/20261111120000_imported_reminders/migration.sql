-- 11/11/2026 (« les envois sont marqués exclus par Joanny »): the bookings imported from a file were left out of the
-- day-before message at the import itself. Restore the upcoming ones that nobody excluded since (their exclusion is still
-- the import's own stamp) and that have not had their message yet, except on the test and demo operators.
UPDATE "reservations" AS r
SET "reminderExcludedAt" = NULL, "reminderExcludedById" = NULL
FROM "reservation_imports" AS i, "operators" AS o
WHERE r."importId" = i."id"
  AND o."id" = r."operatorId"
  AND NOT o."isDemo"
  AND NOT o."prospectDemo"
  AND o."name" !~ '\(tests\)\s*$'
  AND r."reminderExcludedAt" = i."createdAt"
  AND r."status" = 'upcoming'
  AND r."reminderSentAt" IS NULL
  AND r."arrivalAt" > NOW();
