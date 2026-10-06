-- M-A (06/10/2026): the operator's inbound address and the forwarded confirmation emails.
ALTER TABLE "operators" ADD COLUMN "inboundSlug" TEXT;
CREATE UNIQUE INDEX "operators_inboundSlug_key" ON "operators"("inboundSlug");

CREATE TYPE "InboundEmailStatus" AS ENUM ('imported', 'duplicate', 'incomplete', 'unrecognised', 'dismissed');

CREATE TABLE "inbound_emails" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "status" "InboundEmailStatus" NOT NULL,
    "fromAddress" TEXT,
    "fromName" TEXT,
    "subject" TEXT,
    "textBody" TEXT,
    "provider" TEXT,
    "parsed" JSONB,
    "missing" JSONB,
    "reservationId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inbound_emails_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "inbound_emails_operatorId_status_receivedAt_idx" ON "inbound_emails"("operatorId", "status", "receivedAt");
ALTER TABLE "inbound_emails" ADD CONSTRAINT "inbound_emails_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inbound_emails" ADD CONSTRAINT "inbound_emails_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
