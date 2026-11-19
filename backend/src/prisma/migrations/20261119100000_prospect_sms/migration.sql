-- 19/11/2026 (« pouvoir envoyer un sms de prospection », choix C): SMS to the chosen prospects.
ALTER TABLE "prospects" ADD COLUMN "lastSmsAt" TIMESTAMP(3);
ALTER TABLE "prospect_messages" ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'email';
ALTER TABLE "prospect_messages" ADD CONSTRAINT "prospect_messages_channel" CHECK ("channel" IN ('email', 'sms'));
CREATE INDEX "prospect_messages_channel_sentAt_idx" ON "prospect_messages"("channel", "sentAt");
