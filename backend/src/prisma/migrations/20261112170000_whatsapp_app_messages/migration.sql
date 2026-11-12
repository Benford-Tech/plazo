-- « Écrire au parking » from the Plazo app (12/11/2026): the traveller's messages land in the WhatsApp conversation.
ALTER TABLE "whatsapp_conversations" ADD COLUMN "lastAppAt" TIMESTAMP(3);

ALTER TABLE "whatsapp_inbox_messages" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'whatsapp',
ADD COLUMN "reservationId" TEXT;

ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_channel" CHECK ("channel" IN ('whatsapp', 'app'));

CREATE INDEX "whatsapp_inbox_messages_reservationId_createdAt_idx" ON "whatsapp_inbox_messages"("reservationId", "createdAt");

ALTER TABLE "whatsapp_inbox_messages" ADD CONSTRAINT "whatsapp_inbox_messages_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
