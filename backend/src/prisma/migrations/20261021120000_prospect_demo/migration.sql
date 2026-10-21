-- « mets un environnement de démo de l'app » (21/10/2026, choice A + B + C): the prospects' demo operator and the
-- prospects' own demo links.
ALTER TABLE "operators" ADD COLUMN "prospectDemo" BOOLEAN NOT NULL DEFAULT false;

-- One demo operator at most.
CREATE UNIQUE INDEX "operators_one_prospect_demo" ON "operators" ("prospectDemo") WHERE "prospectDemo";

CREATE TABLE "demo_links" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "prospectId" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "lastOpenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "demo_links_opens_check" CHECK ("opens" >= 0)
);

CREATE UNIQUE INDEX "demo_links_token_key" ON "demo_links"("token");
CREATE UNIQUE INDEX "demo_links_prospectId_key" ON "demo_links"("prospectId");

ALTER TABLE "demo_links" ADD CONSTRAINT "demo_links_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
