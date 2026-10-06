-- Retention (privacy policy, 06/10/2026): bookings are anonymised 12 months after their return.
ALTER TABLE "reservations" ADD COLUMN "anonymizedAt" TIMESTAMP(3);
