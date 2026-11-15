-- 15/11/2026 (« Les mails sont à envoyer dans la langue du pays »): the prospecting mails in each European country's own
-- language. The language chosen by hand may now be any of them.
ALTER TABLE "prospects" DROP CONSTRAINT "prospects_language_key";
ALTER TABLE "prospects" ADD CONSTRAINT "prospects_language_key" CHECK ("language" IS NULL OR "language" IN ('fr', 'de', 'en', 'es', 'it', 'pt', 'nl', 'pl', 'ro', 'sv', 'da', 'nb', 'fi', 'hu', 'cs', 'et', 'el'));
