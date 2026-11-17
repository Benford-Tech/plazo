-- 17/11/2026 (« Branche stripe pour le paiement des abonnements plazo pro », direction B): the operator's Plazo Pro
-- subscription, paid with Stripe Billing.
CREATE TABLE "pro_subscriptions" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "live" BOOLEAN NOT NULL,
    "customerId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "yearly" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "setupFeeIncluded" BOOLEAN NOT NULL DEFAULT false,
    "setupFeePaidAt" TIMESTAMP(3),
    "paymentMethod" JSONB,
    "lastPaymentError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pro_subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pro_subscriptions_plan" CHECK ("plan" IN ('essentiel', 'operations', 'complet'))
);
CREATE UNIQUE INDEX "pro_subscriptions_operatorId_key" ON "pro_subscriptions"("operatorId");
CREATE UNIQUE INDEX "pro_subscriptions_subscriptionId_key" ON "pro_subscriptions"("subscriptionId");
ALTER TABLE "pro_subscriptions" ADD CONSTRAINT "pro_subscriptions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators"("id") ON DELETE CASCADE ON UPDATE CASCADE;
