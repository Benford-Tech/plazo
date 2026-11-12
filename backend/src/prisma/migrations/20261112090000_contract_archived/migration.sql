-- 12/11/2026 (« Archiver un contrat signé »): a signed contract can be put away from the register; nothing is erased.
ALTER TABLE "reservation_contracts" ADD COLUMN "archivedAt" TIMESTAMP(3),
ADD COLUMN "archivedById" TEXT;

ALTER TABLE "reservation_contracts" ADD CONSTRAINT "reservation_contracts_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
