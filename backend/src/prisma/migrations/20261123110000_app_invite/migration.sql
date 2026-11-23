-- 23/11/2026 (« envoyer des messages WhatsApp pour inviter à utiliser Plazo lorsqu'on ne connaît pas le mail »): the
-- WhatsApp invitation to install the app, once per number and parking in 12 months, and its STOP.
ALTER TABLE "reservations" ADD COLUMN "appInviteAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "appInviteOutcome" TEXT;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_app_invite_outcome" CHECK (
  "appInviteOutcome" IS NULL OR "appInviteOutcome" IN ('sent', 'repeat', 'opted_out', 'has_email', 'no_phone', 'off', 'failed')
);
-- The bookings already made are not written to: only those created from now on.
UPDATE "reservations" SET "appInviteAt" = NOW(), "appInviteOutcome" = 'repeat' WHERE "appInviteAt" IS NULL;

CREATE TABLE "traveller_phone_optouts" (
  "phoneHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "traveller_phone_optouts_pkey" PRIMARY KEY ("phoneHash")
);
