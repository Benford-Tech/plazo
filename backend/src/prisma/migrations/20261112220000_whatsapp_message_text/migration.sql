-- 12/11/2026: the text of a WhatsApp Plazo sent, shown in the WhatsApp inbox (kept as long as the row, 30 days).
ALTER TABLE "whatsapp_messages" ADD COLUMN "text" TEXT;
