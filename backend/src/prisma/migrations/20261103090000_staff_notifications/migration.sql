-- AlterTable
ALTER TABLE "staff" ADD COLUMN     "notificationChannels" JSONB;

-- CreateTable
CREATE TABLE "staff_notifications" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "target" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_web_push_subscriptions" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),

    CONSTRAINT "staff_web_push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_notifications_staffId_createdAt_idx" ON "staff_notifications"("staffId", "createdAt");

-- CreateIndex
CREATE INDEX "staff_notifications_createdAt_idx" ON "staff_notifications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_web_push_subscriptions_endpoint_key" ON "staff_web_push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "staff_web_push_subscriptions_staffId_idx" ON "staff_web_push_subscriptions"("staffId");

-- AddForeignKey
ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_web_push_subscriptions" ADD CONSTRAINT "staff_web_push_subscriptions_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

