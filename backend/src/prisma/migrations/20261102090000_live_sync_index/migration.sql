-- 02/11/2026: the live sync signal reads the latest booking change of an operator (GET /internal/sync).
CREATE INDEX "reservations_operatorId_updatedAt_idx" ON "reservations"("operatorId", "updatedAt");
