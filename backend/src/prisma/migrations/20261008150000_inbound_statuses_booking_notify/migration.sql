-- T-A (08/10/2026) « Deux gestes » : « Marquer comme traité » (handled) et « Archiver » (archived); `dismissed` stays in
-- the enum, deprecated. N-A (08/10/2026) « Récapitulatif horaire » : Staff.bookingNotify replaces notifyBookings, and
-- the operator keeps the end of its last digest window. Postgres cannot use a new enum value in the transaction that
-- added it: the data moves in the next migration (20261008150100_inbound_statuses_data).
ALTER TYPE "InboundEmailStatus" ADD VALUE 'handled';
ALTER TYPE "InboundEmailStatus" ADD VALUE 'archived';

CREATE TYPE "BookingNotify" AS ENUM ('immediate', 'hourly', 'never');

ALTER TABLE "staff" ADD COLUMN "bookingNotify" "BookingNotify" NOT NULL DEFAULT 'immediate';

ALTER TABLE "operators" ADD COLUMN "bookingDigestAt" TIMESTAMP(3);
