-- 10/10/2026 (« Prévent captcha ») : what became of the Allopark booking page at the last analysis of an email
-- ({ outcome: read | protected | unavailable | not_found, url, at }); the url is the page the staff open by hand when
-- Allopark asks for an anti-robot check. Cleared with the text after 30 days and when the email is attached.
ALTER TABLE "inbound_emails" ADD COLUMN     "pageLookup" JSONB;
