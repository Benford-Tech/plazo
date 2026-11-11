-- 11/11/2026 (« les envois sont marqués exclus par Joanny »): the bookings imported from a file were left out of the
-- day-before message at the import itself. Restore the upcoming ones that nobody excluded since (their exclusion is still
-- the import's own stamp) and that have not had their message yet.
UPDATE "reservations" AS r
SET "reminderExcludedAt" = NULL, "reminderExcludedById" = NULL
FROM "reservation_imports" AS i
WHERE r."importId" = i."id"
  AND r."reminderExcludedAt" = i."createdAt"
  AND r."status" = 'upcoming'
  AND r."reminderSentAt" IS NULL
  AND r."arrivalAt" > NOW();
