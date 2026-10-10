-- 10/10/2026 (« pouvoir relancer l'analyse d'un mail ») : what a re-analysis needs that the stored text lost (the
-- email's own recipients, never the Plazo address, and its allopark.com links; cleared with the text after 30 days),
-- and the time of the last re-analysis (a second one within 30 s is refused).
ALTER TABLE "inbound_emails" ADD COLUMN     "analysedAt" TIMESTAMP(3),
ADD COLUMN     "links" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[];
