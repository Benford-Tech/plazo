-- 07/11/2026: the traveller asks the parking for an invoice (« Demander la facture »).
ALTER TABLE "reservations" ADD COLUMN "invoiceRequestedAt" TIMESTAMP(3),
ADD COLUMN "invoiceRequestCompany" TEXT,
ADD COLUMN "invoiceRequestAddress" TEXT;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_invoice_request" CHECK (
  ("invoiceRequestCompany" IS NULL OR char_length("invoiceRequestCompany") <= 120)
  AND ("invoiceRequestAddress" IS NULL OR char_length("invoiceRequestAddress") <= 300)
);
