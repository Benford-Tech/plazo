-- 14/11/2026 (« faudrait que les sms écrits au numéro du parking arrivent sur la messagerie de Plazo aussi »): SMS to the
-- parking's own phone land in « Messages », and a reply leaves by SMS from that phone.
ALTER TABLE "whatsapp_conversations" ADD COLUMN "lastSmsAt" TIMESTAMP(3);

-- The phone must now also tell Plazo of the SMS it receives: the webhooks are registered again at the next check.
UPDATE "operator_sms_settings" SET "phoneWebhooksSetAt" = NULL WHERE "phoneWebhooksSetAt" IS NOT NULL;

-- A message written to, or answered from, the parking's own phone.
ALTER TABLE "whatsapp_inbox_messages" DROP CONSTRAINT "whatsapp_inbox_messages_channel";
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_channel" CHECK ("channel" IN ('whatsapp', 'app', 'sms'));
