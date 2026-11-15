-- 15/11/2026 (« Mail de promotion à Plazo… pensez à Plazo pour la prochaine location de parking », direction C, campagne à la main).
CREATE TABLE "traveller_campaigns" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "airportSlug" TEXT NOT NULL,
    "arrival" TEXT,
    "return" TEXT,
    "offers" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT,
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "sent" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "skipped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "traveller_campaigns_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "traveller_campaigns_lengths" CHECK (char_length("subject") <= 120 AND char_length("title") <= 120 AND char_length("body") <= 1200)
);
CREATE INDEX "traveller_campaigns_createdAt_idx" ON "traveller_campaigns"("createdAt");
ALTER TABLE "traveller_campaigns" ADD CONSTRAINT "traveller_campaigns_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "traveller_campaign_recipients" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "reservationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sendingAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "traveller_campaign_recipients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "traveller_campaign_recipients_status" CHECK ("status" IN ('pending', 'sent', 'failed', 'skipped'))
);
CREATE UNIQUE INDEX "traveller_campaign_recipients_campaignId_emailHash_key" ON "traveller_campaign_recipients"("campaignId", "emailHash");
CREATE INDEX "traveller_campaign_recipients_status_campaignId_idx" ON "traveller_campaign_recipients"("status", "campaignId");
ALTER TABLE "traveller_campaign_recipients" ADD CONSTRAINT "traveller_campaign_recipients_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "traveller_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
