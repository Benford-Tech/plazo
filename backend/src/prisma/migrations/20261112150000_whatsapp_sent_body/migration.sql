-- « Affiche aussi les messages envoyés » (12/11/2026): the text of each WhatsApp Plazo sends, kept the 30 days of the row.
ALTER TABLE "whatsapp_messages" ADD COLUMN "body" TEXT;
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_body_length" CHECK ("body" IS NULL OR char_length("body") <= 4096);
