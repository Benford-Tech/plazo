-- Store screenshots: the demo parking dressed as a parking in production, once `scenario.mjs prepare` has run.
-- Applied by run.sh to the throwaway screenshot database only (its name ends in _shots).

-- No « DÉMO » badge on the traveller's screens.
UPDATE operators SET "isDemo" = false WHERE slug LIKE 'demo-%';

-- Every booking made on Plazo is paid online (06/10/2026): the three traveller bookings are, like in production.
UPDATE reservations
SET "paymentStatus" = 'paid',
    "paidAt" = COALESCE("paidAt", "createdAt"),
    "chargedCents" = "priceCents",
    "commissionCents" = ROUND("priceCents" * 0.15),
    "operatorShareCents" = "priceCents" - ROUND("priceCents" * 0.15),
    "payoutStatus" = 'pending'
WHERE reference IN ('RDEMX1', 'RDEMX2', 'RDEMX3');

-- The day-before SMS go out through Brevo, as at the client's (the API runs with a placeholder key for the capture).
INSERT INTO operator_sms_settings (id, "operatorId", mode, "updatedAt")
SELECT 'shots-sms-' || id, id, 'brevo', now() FROM operators WHERE slug = 'demo-parkair-lyon'
ON CONFLICT ("operatorId") DO UPDATE SET mode = 'brevo';

-- The scenario records the arrivals at the moment it runs: the cars came in at their booked time (+5 min), so the
-- morning's travellers do not join this afternoon's shuttle waves.
UPDATE reservations SET "arrivedAt" = "arrivalAt" + INTERVAL '5 minutes'
WHERE "arrivedAt" IS NOT NULL AND "arrivedAt" > "arrivalAt" + INTERVAL '30 minutes';
