-- 23/11/2026: VAT a comparator adds to its commission (« pour certain contract il y'a une TVA », choix A).
ALTER TABLE "comparator_commissions" ADD COLUMN "vatBp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "comparator_commissions" ADD CONSTRAINT "comparator_commissions_vat_range" CHECK ("vatBp" >= 0 AND "vatBp" <= 5000);
