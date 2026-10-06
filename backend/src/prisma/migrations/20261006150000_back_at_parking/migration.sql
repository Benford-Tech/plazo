-- Workflow decision A (06/10/2026): a status between the pick-up and the handover, and a push preference for new bookings.
ALTER TYPE "ReservationStatus" ADD VALUE 'back_at_parking';
ALTER TABLE "staff" ADD COLUMN "notifyBookings" BOOLEAN NOT NULL DEFAULT true;
