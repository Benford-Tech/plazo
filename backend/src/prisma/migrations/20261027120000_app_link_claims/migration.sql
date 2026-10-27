-- « Lien court Plazo » (27/10/2026): phones that left the rebound page for the store, remembered 24 h.
CREATE TABLE "app_link_claims" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_link_claims_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "app_link_claims_fingerprint_createdAt_idx" ON "app_link_claims"("fingerprint", "createdAt");
CREATE INDEX "app_link_claims_expiresAt_idx" ON "app_link_claims"("expiresAt");

ALTER TABLE "app_link_claims" ADD CONSTRAINT "app_link_claims_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
