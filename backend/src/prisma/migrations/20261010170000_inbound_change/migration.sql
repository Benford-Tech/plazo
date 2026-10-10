-- 10/10/2026 (« C'est une modification ») : what Plazo did of an Allopark email announcing a change of a booking
-- ({ applied, reason, reservationId, reference, changes: [{ field, from, to }], at }): applied to the booking, or left
-- to the staff with the reason. Personal data like the text: cleared with it after 30 days, and when the email is
-- attached.
ALTER TABLE "inbound_emails" ADD COLUMN     "change" JSONB;
