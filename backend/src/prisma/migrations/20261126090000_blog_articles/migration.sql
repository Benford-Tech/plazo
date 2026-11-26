-- 26/11/2026: the daily SEO articles (blog), validated by a platform admin before publication.
CREATE TYPE "BlogArticleStatus" AS ENUM ('planned', 'draft', 'published', 'rejected', 'failed');

CREATE TABLE "blog_articles" (
    "id" TEXT NOT NULL,
    "dueOn" TEXT NOT NULL,
    "status" "BlogArticleStatus" NOT NULL DEFAULT 'planned',
    "topic" TEXT NOT NULL,
    "query" TEXT,
    "slug" TEXT,
    "title" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "intro" TEXT,
    "body" TEXT,
    "related" JSONB,
    "sources" JSONB,
    "warnings" JSONB,
    "facts" JSONB,
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "model" TEXT,
    "error" TEXT,
    "writtenAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "mailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blog_articles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "blog_articles_due_on" CHECK ("dueOn" ~ '^\d{4}-\d{2}-\d{2}$'),
    CONSTRAINT "blog_articles_sizes" CHECK (
        char_length("topic") <= 200 AND char_length(coalesce("query", '')) <= 200 AND char_length(coalesce("slug", '')) <= 100
        AND char_length(coalesce("title", '')) <= 140 AND char_length(coalesce("metaTitle", '')) <= 90
        AND char_length(coalesce("metaDescription", '')) <= 200 AND char_length(coalesce("intro", '')) <= 800
        AND char_length(coalesce("body", '')) <= 30000
    ),
    -- A published article always has its address and its text.
    CONSTRAINT "blog_articles_published" CHECK (
        "status" <> 'published' OR ("slug" IS NOT NULL AND "title" IS NOT NULL AND "body" IS NOT NULL AND "publishedAt" IS NOT NULL)
    )
);

CREATE UNIQUE INDEX "blog_articles_dueOn_key" ON "blog_articles"("dueOn");
CREATE UNIQUE INDEX "blog_articles_slug_key" ON "blog_articles"("slug");
CREATE INDEX "blog_articles_status_publishedAt_idx" ON "blog_articles"("status", "publishedAt");
