-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT,
    "reservationId" TEXT,
    "phone" TEXT NOT NULL,
    "profileName" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "lastInboundAt" TIMESTAMP(3),
    "unread" INTEGER NOT NULL DEFAULT 0,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_inbox_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "text" TEXT,
    "mediaId" TEXT,
    "mediaMime" TEXT,
    "waMessageId" TEXT,
    "status" TEXT,
    "errorCode" TEXT,
    "staffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_inbox_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_conversations_operatorId_lastMessageAt_idx" ON "whatsapp_conversations"("operatorId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_phone_idx" ON "whatsapp_conversations"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_reservationId_idx" ON "whatsapp_conversations"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_inbox_messages_waMessageId_key" ON "whatsapp_inbox_messages"("waMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_inbox_messages_conversationId_createdAt_idx" ON "whatsapp_inbox_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_inbox_messages_createdAt_idx" ON "whatsapp_inbox_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- One conversation per parking and number; one per number among the unplaced ones (operatorId null).
CREATE UNIQUE INDEX "whatsapp_conversations_operator_phone_key" ON "whatsapp_conversations"("operatorId", "phone") WHERE "operatorId" IS NOT NULL;
CREATE UNIQUE INDEX "whatsapp_conversations_unknown_phone_key" ON "whatsapp_conversations"("phone") WHERE "operatorId" IS NULL;

ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_unread" CHECK ("unread" >= 0);
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_direction" CHECK ("direction" IN ('in', 'out'));
ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_text_length" CHECK ("text" IS NULL OR char_length("text") <= 4096);
