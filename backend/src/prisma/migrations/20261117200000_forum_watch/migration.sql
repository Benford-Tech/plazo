-- 17/11/2026: the forum watch (a daily mail of new forum discussions, nothing posted).
CREATE TABLE "forum_watch_runs" (
    "day" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "found" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "forum_watch_runs_pkey" PRIMARY KEY ("day")
);

CREATE TABLE "forum_watch_seen" (
    "key" TEXT NOT NULL,
    "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "forum_watch_seen_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "forum_watch_seen_seenAt_idx" ON "forum_watch_seen"("seenAt");
