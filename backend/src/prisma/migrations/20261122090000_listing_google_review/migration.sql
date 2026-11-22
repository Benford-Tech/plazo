-- Lien d'avis Google (22/11/2026): the parking's Google review link, sent to travellers once their car is returned.
ALTER TABLE "listings" ADD COLUMN "googleReviewUrl" TEXT;
ALTER TABLE "listings" ADD CONSTRAINT "listings_google_review_url_length" CHECK ("googleReviewUrl" IS NULL OR char_length("googleReviewUrl") <= 500);
