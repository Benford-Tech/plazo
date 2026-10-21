-- « Mail du matin » (21/10/2026): the daily email of the planning, the revenue and the integrations.
ALTER TABLE "staff" ADD COLUMN "morningEmail" BOOLEAN;
ALTER TABLE "staff" ADD COLUMN "morningEmailHour" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "staff" ADD COLUMN "morningEmailSentOn" TEXT;
ALTER TABLE "staff" ADD CONSTRAINT "staff_morning_email_hour_range" CHECK ("morningEmailHour" BETWEEN 5 AND 10);
