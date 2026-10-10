-- 10/10/2026 (« Pouvoir modifier le prix après l'intégration du mail ») : the amount the comparator last gave, so that
-- its next change email touches the price only when the comparator's amount changed, never a price the staff
-- corrected. Imported bookings already priced take their current price as the comparator's.
ALTER TABLE "reservations" ADD COLUMN     "importedPriceCents" INTEGER;

UPDATE "reservations"
SET "importedPriceCents" = "priceCents"
WHERE "externalReference" IS NOT NULL AND "priceCents" IS NOT NULL AND "channel" <> 'plazo';
