-- 24/11/2026 (« cache la partie facturation pour gopark60000 »): the Plazo Pro billing hidden from one operator's team.
ALTER TABLE "operators" ADD COLUMN "proBillingHidden" BOOLEAN NOT NULL DEFAULT false;

-- Hidden at once for gopark60000 (its mail address, or a member's e-mail address).
UPDATE "operators" SET "proBillingHidden" = true
WHERE "inboundSlug" = 'gopark60000'
   OR "id" IN (SELECT "operatorId" FROM "staff" WHERE lower("email") LIKE 'gopark60000@%');
