/**
 * 29/10/2026 (« le moyen de paiement », direction A « Payé par »): how a booking was paid. A Plazo booking is always
 * « En ligne sur Plazo » (never stored; mirrors `paidBy` on the server).
 */
import type { PaidBy, PaymentMethod, ReservationChannel } from "./types";

export const PAYMENT_METHODS: PaymentMethod[] = ["card", "cash", "cheque", "transfer", "holiday_vouchers", "comparator"];

export function paidBy(booking: { channel: ReservationChannel; paymentMethod?: PaymentMethod | null }): PaidBy | null {
  return booking.channel === "plazo" ? "online" : (booking.paymentMethod ?? null);
}
