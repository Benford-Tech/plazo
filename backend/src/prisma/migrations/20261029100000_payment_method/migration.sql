-- 29/10/2026 « le moyen de paiement » (direction A « Payé par »): how a booking not made on Plazo was paid.
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'cash', 'cheque', 'transfer', 'holiday_vouchers', 'comparator');

ALTER TABLE "reservations" ADD COLUMN "paymentMethod" "PaymentMethod";

-- A Plazo booking is paid online: it never carries a method of its own.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_payment_method_channel"
  CHECK ("paymentMethod" IS NULL OR "channel" <> 'plazo');
