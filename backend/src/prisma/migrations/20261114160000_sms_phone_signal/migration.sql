-- 14/11/2026 (« souvent le téléphone est marqué comme hors ligne alors que non »): the phone's own calls count as a sign
-- of life; the webhooks are registered again at the next 15-minute pass, now with the app's ping (system:ping).
ALTER TABLE "operator_sms_settings" ADD COLUMN "phoneSignalAt" TIMESTAMP(3);
UPDATE "operator_sms_settings" SET "phoneWebhooksSetAt" = NULL;
