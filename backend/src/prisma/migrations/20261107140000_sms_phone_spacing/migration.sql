-- 07/11/2026 (« Faudrait espacer les envois »): when Plazo asked the SMS app to wait between two SMS.
ALTER TABLE "operator_sms_settings" ADD COLUMN "phoneSpacingSetAt" TIMESTAMP(3);
