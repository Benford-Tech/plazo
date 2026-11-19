-- Site du parking, niveau 3 (19/11/2026): the parking's own Plazo booking page, paid online, no commission.
ALTER TABLE "operators" ADD COLUMN "bookingPageSlug" TEXT;
ALTER TABLE "operators" ADD COLUMN "bookingPageAccent" TEXT;
ALTER TABLE "operators" ADD COLUMN "bookingPageEnabledAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "operators_bookingPageSlug_key" ON "operators"("bookingPageSlug");
ALTER TABLE "operators" ADD CONSTRAINT "operators_booking_page_slug" CHECK ("bookingPageSlug" IS NULL OR "bookingPageSlug" ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$');
ALTER TABLE "operators" ADD CONSTRAINT "operators_booking_page_accent" CHECK ("bookingPageAccent" IS NULL OR "bookingPageAccent" ~ '^#[0-9A-F]{6}$');
ALTER TABLE "operators" ADD CONSTRAINT "operators_booking_page_enabled" CHECK ("bookingPageEnabledAt" IS NULL OR "bookingPageSlug" IS NOT NULL);

ALTER TABLE "reservations" ADD COLUMN "viaBookingPage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_booking_page_channel" CHECK (NOT "viaBookingPage" OR "channel" = 'plazo');
