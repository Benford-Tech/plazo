-- What each comparator takes from the operator's bookings (19/10/2026, « paramétrer le taux de commission de chaque comparateur »).
CREATE TABLE "comparator_commissions" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "comparatorKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "rateBp" INTEGER NOT NULL,
    "fixedCents" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparator_commissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "comparator_commissions_rate_range" CHECK ("rateBp" BETWEEN 0 AND 10000),
    CONSTRAINT "comparator_commissions_fixed_range" CHECK ("fixedCents" BETWEEN 0 AND 100000),
    CONSTRAINT "comparator_commissions_effective_from" CHECK ("effectiveFrom" ~ '^\d{4}-\d{2}-\d{2}$'),
    CONSTRAINT "comparator_commissions_key" CHECK ("comparatorKey" <> '' AND "comparatorKey" = lower("comparatorKey"))
);

CREATE UNIQUE INDEX "comparator_commissions_operatorId_comparatorKey_effectiveFrom_key" ON "comparator_commissions"("operatorId", "comparatorKey", "effectiveFrom");

ALTER TABLE "comparator_commissions" ADD CONSTRAINT "comparator_commissions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One booking's exception: a rate or an amount, never both, only on a comparator's booking.
ALTER TABLE "reservations" ADD COLUMN "commissionOverrideBp" INTEGER,
ADD COLUMN "commissionOverrideCents" INTEGER;

ALTER TABLE "reservations" ADD CONSTRAINT "reservations_commission_override" CHECK (
    ("commissionOverrideBp" IS NULL OR "commissionOverrideCents" IS NULL)
    AND ("commissionOverrideBp" IS NULL OR "commissionOverrideBp" BETWEEN 0 AND 10000)
    AND ("commissionOverrideCents" IS NULL OR "commissionOverrideCents" >= 0)
    AND (("commissionOverrideBp" IS NULL AND "commissionOverrideCents" IS NULL) OR "channel" IN ('aggregator', 'import'))
);
