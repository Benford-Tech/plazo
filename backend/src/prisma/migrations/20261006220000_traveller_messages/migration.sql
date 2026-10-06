-- B (06/10/2026): the traveller's message thread, each message sent once.
ALTER TABLE "reservations" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "parkedNotifiedAt" TIMESTAMP(3);
ALTER TABLE "reservations" ADD COLUMN "closingSentAt" TIMESTAMP(3);
