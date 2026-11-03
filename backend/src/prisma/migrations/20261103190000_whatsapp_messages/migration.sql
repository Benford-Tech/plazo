-- 03/11/2026 (« Plazo envoie par WhatsApp », SMS en repli).
ALTER TABLE "operator_sms_settings" ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "reservationId" TEXT,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "waMessageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "errorCode" TEXT,
    "fallbackText" TEXT,
    "smsOutcome" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "whatsapp_messages_status_check" CHECK ("status" IN ('sent', 'delivered', 'read', 'failed', 'fallback'))
);

CREATE UNIQUE INDEX "whatsapp_messages_waMessageId_key" ON "whatsapp_messages"("waMessageId");
CREATE INDEX "whatsapp_messages_status_createdAt_idx" ON "whatsapp_messages"("status", "createdAt");
CREATE INDEX "whatsapp_messages_operatorId_createdAt_idx" ON "whatsapp_messages"("operatorId", "createdAt");
CREATE INDEX "whatsapp_messages_reservationId_idx" ON "whatsapp_messages"("reservationId");

ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
