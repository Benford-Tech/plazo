-- 24/11/2026: a Plazo Pro price agreed with one operator (direction A « Prix négocié »).
ALTER TABLE "operators" ADD COLUMN "proAgreedPlan" TEXT;
ALTER TABLE "operators" ADD COLUMN "proAgreedMonthlyCents" INTEGER;
ALTER TABLE "operators" ADD COLUMN "proAgreedSetupFeeCents" INTEGER;

ALTER TABLE "operators" ADD CONSTRAINT "operators_pro_agreed_price" CHECK (
  ("proAgreedMonthlyCents" IS NULL AND "proAgreedPlan" IS NULL)
  OR ("proAgreedMonthlyCents" BETWEEN 100 AND 1000000 AND "proAgreedPlan" IN ('essentiel', 'operations', 'complet'))
);
ALTER TABLE "operators" ADD CONSTRAINT "operators_pro_agreed_setup_fee" CHECK (
  "proAgreedSetupFeeCents" IS NULL OR "proAgreedSetupFeeCents" BETWEEN 0 AND 1000000
);
