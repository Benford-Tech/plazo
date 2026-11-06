-- 06/11/2026 (« ajoute un historique d'état du téléphone de service »): the gateway phone checked every 15 minutes.
ALTER TABLE "operator_sms_settings"
  ADD COLUMN "phoneAlerts" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "phoneCheckedAt" TIMESTAMP(3),
  ADD COLUMN "phoneOfflineAlertedAt" TIMESTAMP(3),
  ADD COLUMN "phonePingSetAt" TIMESTAMP(3);

CREATE TABLE "sms_phone_checks" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "state" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "errorCode" TEXT,

    CONSTRAINT "sms_phone_checks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sms_phone_checks_state" CHECK ("state" IN ('online', 'offline', 'unknown'))
);

CREATE INDEX "sms_phone_checks_operatorId_checkedAt_idx" ON "sms_phone_checks"("operatorId", "checkedAt");

ALTER TABLE "sms_phone_checks" ADD CONSTRAINT "sms_phone_checks_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
