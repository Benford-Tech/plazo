-- 14/10/2026 (« C puis A ») : how a booking email reached the Plazo address (the comparators' table of the Mails
-- entrants block), and the emails a too-wide mailbox rule sends on, kept without sender, subject or text for the
-- setup wizard's alert.
ALTER TYPE "InboundEmailStatus" ADD VALUE 'ignored';

CREATE TYPE "InboundDelivery" AS ENUM ('direct', 'forwarded', 'manual');

ALTER TABLE "inbound_emails" ADD COLUMN     "delivery" "InboundDelivery";
