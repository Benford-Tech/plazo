-- 15/11/2026 (« traquer les ouvertures de mail d'invitation, par qui, sur quel support, s'ils téléchargent l'app »).
CREATE TABLE "invitation_trackings" (
  "id" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "operatorId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "emailSent" BOOLEAN NOT NULL,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "openedAt" TIMESTAMP(3),
  "lastOpenedAt" TIMESTAMP(3),
  "openCount" INTEGER NOT NULL DEFAULT 0,
  "openDevice" TEXT,
  "clickedAt" TIMESTAMP(3),
  "clickDevice" TEXT,
  "storeClickAt" TIMESTAMP(3),
  "storeClick" TEXT,
  "demoClickAt" TIMESTAMP(3),
  "passwordSetAt" TIMESTAMP(3),
  "appSignInAt" TIMESTAMP(3),
  "appPlatform" TEXT,
  "webSignInAt" TIMESTAMP(3),
  "webDevice" TEXT,
  CONSTRAINT "invitation_trackings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "invitation_trackings_kind" CHECK ("kind" IN ('operator', 'team')),
  CONSTRAINT "invitation_trackings_store" CHECK ("storeClick" IS NULL OR "storeClick" IN ('play', 'app_store')),
  CONSTRAINT "invitation_trackings_platform" CHECK ("appPlatform" IS NULL OR "appPlatform" IN ('ios', 'android', 'app'))
);
CREATE INDEX "invitation_trackings_staffId_sentAt_idx" ON "invitation_trackings"("staffId", "sentAt");
CREATE INDEX "invitation_trackings_sentAt_idx" ON "invitation_trackings"("sentAt");
ALTER TABLE "invitation_trackings" ADD CONSTRAINT "invitation_trackings_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "invitation_trackings" ADD CONSTRAINT "invitation_trackings_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
