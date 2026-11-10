-- 10/11/2026 (« pour tous les parkings »): WhatsApp to travellers is on for every parking, unless a manager turns it off.
ALTER TABLE "operator_sms_settings" ALTER COLUMN "whatsappEnabled" SET DEFAULT true;
UPDATE "operator_sms_settings" SET "whatsappEnabled" = true WHERE "whatsappEnabled" = false;
