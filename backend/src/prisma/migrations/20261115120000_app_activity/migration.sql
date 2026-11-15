-- 15/11/2026: daily activity of the Plazo app's phones and the Plazo Pro members (Plateforme › Applications).
CREATE TABLE "app_activity_days" (
    "day" DATE NOT NULL,
    "app" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "platform" TEXT,
    CONSTRAINT "app_activity_days_pkey" PRIMARY KEY ("day","app","subject"),
    CONSTRAINT "app_activity_days_app" CHECK ("app" IN ('plazo', 'pro'))
);

CREATE INDEX "app_activity_days_app_day_idx" ON "app_activity_days"("app", "day");
