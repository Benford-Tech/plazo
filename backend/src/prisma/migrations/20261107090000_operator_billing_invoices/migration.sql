-- 06/11/2026 (« une facture au nom du parking avec son logo », direction A): the parking's invoicing details and the
-- invoices it issues to its customers (numbered without gaps, never changed once issued).
-- CreateEnum
CREATE TYPE "InvoiceKind" AS ENUM ('invoice', 'credit_note');

-- AlterTable
ALTER TABLE "operators" ADD COLUMN     "billingAddress" TEXT,
ADD COLUMN     "billingLegalName" TEXT,
ADD COLUMN     "billingMention" TEXT,
ADD COLUMN     "billingPrefix" TEXT NOT NULL DEFAULT 'F',
ADD COLUMN     "billingSiret" TEXT,
ADD COLUMN     "billingVatExempt" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "billingVatNumber" TEXT,
ADD COLUMN     "billingVatRateBp" INTEGER NOT NULL DEFAULT 2000;

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "reservationId" TEXT,
    "kind" "InvoiceKind" NOT NULL DEFAULT 'invoice',
    "year" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creditOfId" TEXT,
    "seller" JSONB NOT NULL,
    "customer" JSONB NOT NULL,
    "lines" JSONB NOT NULL,
    "vatRateBp" INTEGER NOT NULL,
    "totalHtCents" INTEGER NOT NULL,
    "vatCents" INTEGER NOT NULL,
    "totalTtcCents" INTEGER NOT NULL,
    "paidBy" TEXT,
    "pdf" BYTEA NOT NULL,
    "pdfSha256" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "sentTo" TEXT,
    "createdById" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invoices_creditOfId_key" ON "invoices"("creditOfId");

-- CreateIndex
CREATE INDEX "invoices_reservationId_idx" ON "invoices"("reservationId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_operatorId_kind_year_sequence_key" ON "invoices"("operatorId", "kind", "year", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_operatorId_number_key" ON "invoices"("operatorId", "number");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_creditOfId_fkey" FOREIGN KEY ("creditOfId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Hand-written checks.
ALTER TABLE "operators" ADD CONSTRAINT "operators_billing_vat_rate" CHECK ("billingVatRateBp" BETWEEN 0 AND 10000);
ALTER TABLE "operators" ADD CONSTRAINT "operators_billing_prefix" CHECK ("billingPrefix" ~ '^[A-Z0-9]{1,6}$');
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sequence_positive" CHECK ("sequence" > 0);
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_totals" CHECK ("totalHtCents" + "vatCents" = "totalTtcCents");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_note" CHECK (("kind" = 'credit_note') = ("creditOfId" IS NOT NULL));
