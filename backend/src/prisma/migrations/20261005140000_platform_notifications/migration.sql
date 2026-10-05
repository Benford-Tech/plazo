-- Platform broadcasts (E-A, 05/10/2026): the super admin's pushes to the staff or the travellers,
-- and the staff's "Messages de Plazo" preference.

CREATE TYPE "PlatformAudience" AS ENUM ('staff', 'travellers', 'operator');

ALTER TABLE "staff" ADD COLUMN "notifyPlatform" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "platform_notifications" (
  "id" TEXT NOT NULL,
  "audience" "PlatformAudience" NOT NULL,
  "operatorId" TEXT,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "url" TEXT,
  "recipients" INTEGER NOT NULL,
  "sentById" TEXT,
  "sentByName" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "platform_notifications_createdAt_idx" ON "platform_notifications"("createdAt");
ALTER TABLE "platform_notifications" ADD CONSTRAINT "platform_notifications_operatorId_fkey"
  FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
