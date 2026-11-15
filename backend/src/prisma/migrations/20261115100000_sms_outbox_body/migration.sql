-- 15/11/2026 (« les SMS reçus ou envoyés sont dans la messagerie de Plazo »): the text the traveller read, kept with the
-- row (30 days), never for a signature code.
ALTER TABLE "sms_outbox" ADD COLUMN "body" TEXT;
ALTER TABLE "sms_outbox" ADD CONSTRAINT "sms_outbox_body_length" CHECK ("body" IS NULL OR char_length("body") <= 4096);
ALTER TABLE "sms_outbox" ADD CONSTRAINT "sms_outbox_body_no_code" CHECK ("body" IS NULL OR "kind" <> 'signature_code');
