-- Promotions to the Plazo app's travellers (13/11/2026, choix A).
ALTER TYPE "PlatformAudience" ADD VALUE IF NOT EXISTS 'promotion';

ALTER TABLE "platform_notifications" ADD COLUMN "link" JSONB, ADD COLUMN "filters" JSONB;

CREATE TABLE "traveller_app_devices" (
  "id" TEXT NOT NULL,
  "subscriptionId" TEXT NOT NULL,
  "platform" TEXT,
  "offers" BOOLEAN NOT NULL DEFAULT false,
  "offersAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "traveller_app_devices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "traveller_app_devices_subscription_length" CHECK (char_length("subscriptionId") BETWEEN 1 AND 100),
  CONSTRAINT "traveller_app_devices_platform_length" CHECK ("platform" IS NULL OR char_length("platform") <= 20)
);
CREATE UNIQUE INDEX "traveller_app_devices_subscriptionId_key" ON "traveller_app_devices"("subscriptionId");
CREATE INDEX "traveller_app_devices_offers_idx" ON "traveller_app_devices"("offers");
