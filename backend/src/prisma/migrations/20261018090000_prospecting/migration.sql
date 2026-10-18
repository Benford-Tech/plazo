-- 18/10/2026 (« ajoute un outil d'envoi d'email de prospection pour la gestion de la plateforme », choix « A avec les
-- relances de B »): Plateforme › Prospection. Prospects (professionals), the emails sent to them, the sequence and its
-- daily cap, and the addresses that opted out (hashed, kept after the prospect is deleted).
CREATE TYPE "ProspectStatus" AS ENUM ('to_contact', 'contacted', 'replied', 'interested', 'not_interested', 'unsubscribed');
CREATE TYPE "ProspectSource" AS ENUM ('manual', 'csv');
CREATE TYPE "ProspectMessageStatus" AS ENUM ('sent', 'failed');

CREATE TABLE "prospects" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactFirstName" TEXT,
    "contactLastName" TEXT,
    "town" TEXT,
    "airportCode" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "source" "ProspectSource" NOT NULL DEFAULT 'manual',
    "status" "ProspectStatus" NOT NULL DEFAULT 'to_contact',
    "step" INTEGER NOT NULL DEFAULT 0,
    "nextSendAt" TIMESTAMP(3),
    "firstContactedAt" TIMESTAMP(3),
    "lastContactedAt" TIMESTAMP(3),
    "stoppedAt" TIMESTAMP(3),
    "sendingAt" TIMESTAMP(3),
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "enrolledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospects_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prospects_email_lowercase" CHECK ("email" = lower("email")),
    CONSTRAINT "prospects_step_range" CHECK ("step" BETWEEN 0 AND 3),
    -- A prospect who replied, said yes or no, or opted out is never scheduled again.
    CONSTRAINT "prospects_no_send_when_closed" CHECK (
        "nextSendAt" IS NULL OR "status" IN ('to_contact', 'contacted')
    )
);

CREATE UNIQUE INDEX "prospects_email_key" ON "prospects"("email");
CREATE INDEX "prospects_status_idx" ON "prospects"("status");
CREATE INDEX "prospects_nextSendAt_idx" ON "prospects"("nextSendAt");

CREATE TABLE "prospect_messages" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "providerMessageId" TEXT,
    "status" "ProspectMessageStatus" NOT NULL,
    "error" TEXT,

    CONSTRAINT "prospect_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prospect_messages_prospectId_idx" ON "prospect_messages"("prospectId");
CREATE INDEX "prospect_messages_sentAt_idx" ON "prospect_messages"("sentAt");

ALTER TABLE "prospect_messages" ADD CONSTRAINT "prospect_messages_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "prospecting_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "steps" JSONB NOT NULL,
    "dailyCap" INTEGER NOT NULL DEFAULT 50,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospecting_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "prospecting_settings_singleton" CHECK ("id" = 'default'),
    CONSTRAINT "prospecting_settings_daily_cap_range" CHECK ("dailyCap" BETWEEN 1 AND 300)
);

CREATE TABLE "prospect_suppressions" (
    "emailHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prospect_suppressions_pkey" PRIMARY KEY ("emailHash")
);
