-- 29/10/2026: « Accepter » a service ordered by a traveller (the traveller is told), before « Fait » or « Pas possible ».
ALTER TABLE "reservation_extras" ADD COLUMN "acceptedAt" TIMESTAMP(3), ADD COLUMN "acceptedById" TEXT;
ALTER TABLE "reservation_extras" ADD CONSTRAINT "reservation_extras_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
