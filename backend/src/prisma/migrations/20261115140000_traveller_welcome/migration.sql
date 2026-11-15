-- 15/11/2026 (« Mail d'intro de Plazo au client avec message pour installer l'App »): the welcome email to the travellers
-- of the other channels, once per address and parking in 12 months, and its opt-out.
ALTER TABLE "reservations" ADD COLUMN "welcomeEmailAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "welcomeEmailOutcome" TEXT;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_welcome_email_outcome" CHECK (
  "welcomeEmailOutcome" IS NULL OR "welcomeEmailOutcome" IN ('sent', 'repeat', 'opted_out', 'no_email', 'failed')
);
-- The bookings already made are not written to: only those created from now on.
UPDATE "reservations" SET "welcomeEmailAt" = NOW(), "welcomeEmailOutcome" = 'repeat' WHERE "welcomeEmailAt" IS NULL;

CREATE TABLE "traveller_email_optouts" (
  "emailHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "traveller_email_optouts_pkey" PRIMARY KEY ("emailHash")
);
