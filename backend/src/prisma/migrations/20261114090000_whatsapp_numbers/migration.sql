-- 14/11/2026: a parking's own WhatsApp number (chemin 1 : numéros sur le compte de Benford Tech).
CREATE TABLE "operator_whatsapp_numbers" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "phone" TEXT,
    "phoneNumberId" TEXT,
    "nameStatus" TEXT,
    "metaStatus" TEXT,
    "quality" TEXT,
    "requestedAt" TIMESTAMP(3),
    "codeSentAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "activeAt" TIMESTAMP(3),
    "checkedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "operator_whatsapp_numbers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "operator_whatsapp_numbers_status" CHECK ("status" IN ('requested', 'added', 'code_sent', 'registered', 'active', 'paused')),
    -- Past « requested », Meta's number is known.
    CONSTRAINT "operator_whatsapp_numbers_meta" CHECK ("status" = 'requested' OR ("phone" IS NOT NULL AND "phoneNumberId" IS NOT NULL))
);
CREATE UNIQUE INDEX "operator_whatsapp_numbers_operatorId_key" ON "operator_whatsapp_numbers"("operatorId");
CREATE UNIQUE INDEX "operator_whatsapp_numbers_phoneNumberId_key" ON "operator_whatsapp_numbers"("phoneNumberId");
ALTER TABLE "operator_whatsapp_numbers" ADD CONSTRAINT "operator_whatsapp_numbers_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whatsapp_messages" ADD COLUMN "fromPhoneNumberId" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN "phoneNumberId" TEXT;
