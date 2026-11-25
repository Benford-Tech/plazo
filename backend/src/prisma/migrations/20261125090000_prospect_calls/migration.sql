-- 25/11/2026 (« A · File d'appels »): the calls made to a prospect and what the queue needs on the prospect itself.
ALTER TABLE "prospects"
  ADD COLUMN "lastCallAt" TIMESTAMP(3),
  ADD COLUMN "lastCallOutcome" TEXT,
  ADD COLUMN "callCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "missedCalls" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "callbackAt" TIMESTAMP(3),
  ADD COLUMN "phoneWrong" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "prospect_calls" (
  "id" TEXT NOT NULL,
  "prospectId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "note" TEXT,
  "callbackAt" TIMESTAMP(3),
  "calledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prospect_calls_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "prospect_calls_prospectId_createdAt_idx" ON "prospect_calls"("prospectId", "createdAt");

ALTER TABLE "prospect_calls"
  ADD CONSTRAINT "prospect_calls_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "prospects"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "prospect_calls_outcome" CHECK ("outcome" IN ('no_answer', 'voicemail', 'callback', 'interested', 'not_interested', 'wrong_number')),
  ADD CONSTRAINT "prospect_calls_note_length" CHECK ("note" IS NULL OR char_length("note") <= 300),
  ADD CONSTRAINT "prospect_calls_callback" CHECK (("outcome" = 'callback') = ("callbackAt" IS NOT NULL));
