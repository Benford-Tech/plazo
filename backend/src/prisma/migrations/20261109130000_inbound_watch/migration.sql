-- 09/11/2026 (« un job qui parcourt les mails en continu »): the managers' reminder of an email left « À traiter », and
-- the platform's morning report.
ALTER TABLE "inbound_emails" ADD COLUMN "staleAlertedAt" TIMESTAMP(3);

CREATE TABLE "inbound_watch_reports" (
    "day" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inbound_watch_reports_pkey" PRIMARY KEY ("day")
);
