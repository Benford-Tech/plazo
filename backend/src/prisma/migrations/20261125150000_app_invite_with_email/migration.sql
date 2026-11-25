-- 25/11/2026: travellers with an email get the app invite too. Upcoming bookings left aside for that reason
-- are handed back to the next pass (which still checks the hour, the STOP list and the once-per-number rule).
UPDATE "reservations"
SET "appInviteAt" = NULL, "appInviteOutcome" = NULL
WHERE "appInviteOutcome" = 'has_email' AND "arrivalAt" > NOW() AND "status" = 'upcoming';
