-- CreateEnum
CREATE TYPE "SmsMode" AS ENUM ('gateway', 'brevo', 'none');

-- CreateEnum
CREATE TYPE "SmsOutboxStatus" AS ENUM ('queued', 'sent', 'delivered', 'failed', 'abandoned');

-- CreateTable
CREATE TABLE "operator_sms_settings" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "mode" "SmsMode" NOT NULL DEFAULT 'none',
    "gatewayBaseUrl" TEXT,
    "gatewayLogin" TEXT,
    "gatewayPasswordEncrypted" TEXT,
    "senderPhone" TEXT,
    "linkedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "lastErrorAt" TIMESTAMP(3),
    "monthKey" TEXT,
    "monthSent" INTEGER NOT NULL DEFAULT 0,
    "monthFailed" INTEGER NOT NULL DEFAULT 0,
    "queueCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "operator_sms_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_outbox" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "reservationId" TEXT,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "bodyHash" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "status" "SmsOutboxStatus" NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sms_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "operator_sms_settings_operatorId_key" ON "operator_sms_settings"("operatorId");

-- CreateIndex
CREATE INDEX "sms_outbox_operatorId_status_idx" ON "sms_outbox"("operatorId", "status");

-- CreateIndex
CREATE INDEX "sms_outbox_createdAt_idx" ON "sms_outbox"("createdAt");

-- AddForeignKey
ALTER TABLE "operator_sms_settings" ADD CONSTRAINT "operator_sms_settings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_outbox" ADD CONSTRAINT "sms_outbox_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sms_outbox" ADD CONSTRAINT "sms_outbox_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
