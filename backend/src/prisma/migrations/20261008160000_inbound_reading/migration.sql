-- L-A (08/10/2026) « Lecture par Claude » : what Claude made of an email no importer knew
-- ({ kind, provider, confidence, summary, model }); null when the email was not read.
ALTER TABLE "inbound_emails" ADD COLUMN "reading" JSONB;
