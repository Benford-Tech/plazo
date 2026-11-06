-- 06/11/2026 (SEO local, A + M2): where a booking came from, the site's visits per landing page, Search Console.
ALTER TABLE "reservations"
  ADD COLUMN "acquisitionSource" TEXT,
  ADD COLUMN "acquisitionDetail" TEXT,
  ADD COLUMN "acquisitionLanding" TEXT,
  ADD CONSTRAINT "reservations_acquisition_source" CHECK (
    "acquisitionSource" IS NULL OR "acquisitionSource" IN ('search', 'direct', 'referral', 'social', 'campaign', 'app')
  );

CREATE TABLE "site_visit_days" (
    "id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "landing" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "detail" TEXT NOT NULL DEFAULT '',
    "visits" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "site_visit_days_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "site_visit_days_day_landing_source_detail_key" ON "site_visit_days"("day", "landing", "source", "detail");
CREATE INDEX "site_visit_days_day_idx" ON "site_visit_days"("day");

CREATE TABLE "search_console_rows" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "search_console_rows_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "search_console_rows_date_query_page_key" ON "search_console_rows"("date", "query", "page");
CREATE INDEX "search_console_rows_date_idx" ON "search_console_rows"("date");

CREATE TABLE "search_console_state" (
    "id" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "lastDate" TEXT,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "search_console_state_pkey" PRIMARY KEY ("id")
);
