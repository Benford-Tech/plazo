-- The parking's contract pre-filled (30/10/2026): where each piece of information goes on its PDF.
ALTER TABLE "operator_contract_templates" ADD COLUMN "fields" JSONB;
ALTER TABLE "operator_contract_templates" ADD COLUMN "fieldsSetAt" TIMESTAMP(3);
