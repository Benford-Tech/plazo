-- T-A + N-A (08/10/2026), data part (the enum values were added by 20261008150000_inbound_statuses_booking_notify):
-- the emails closed without a booking become "handled"; each staff member's booking notification keeps its meaning
-- (off → never; on → the hourly digest for managers, a push per booking for the others), then the old flag goes.
UPDATE "inbound_emails" SET "status" = 'handled' WHERE "status" = 'dismissed';

UPDATE "staff" SET "bookingNotify" = CASE
  WHEN "notifyBookings" = false THEN 'never'::"BookingNotify"
  WHEN "role" = 'manager' THEN 'hourly'::"BookingNotify"
  ELSE 'immediate'::"BookingNotify"
END;

ALTER TABLE "staff" DROP COLUMN "notifyBookings";
