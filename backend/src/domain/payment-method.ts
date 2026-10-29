/**
 * 29/10/2026 (« le moyen de paiement », direction A « Payé par »): how a booking was paid. A Plazo booking is always
 * « En ligne sur Plazo » (`online`, never stored); the others carry what the staff chose or the import read, or nothing.
 */
import { PaymentMethod, ReservationChannel } from '@/database';

export const PAYMENT_METHODS: PaymentMethod[] = ['card', 'cash', 'cheque', 'transfer', 'holiday_vouchers', 'comparator'];

export type PaidBy = PaymentMethod | 'online';

/** What the booking was paid by: online for Plazo, else its method (null: not said). */
export function paidBy(booking: { channel: ReservationChannel; paymentMethod: PaymentMethod | null }): PaidBy | null {
  return booking.channel === 'plazo' ? 'online' : booking.paymentMethod;
}

/** The CSV's names (the pro space translates the codes itself). */
export const PAID_BY_LABELS: Record<PaidBy, string> = {
  card: 'Carte bancaire',
  cash: 'Espèces',
  cheque: 'Chèque',
  transfer: 'Virement',
  holiday_vouchers: 'Chèques-vacances',
  comparator: 'Au comparateur',
  online: 'En ligne sur Plazo',
};

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * A file's « Paiement » cell: null when empty, `invalid` when no method is recognised. « Prépayé », « Allopark »… mean
 * the comparator took the money.
 */
export function importedPaymentMethod(raw: string | undefined): PaymentMethod | null | 'invalid' {
  const value = fold(raw ?? '');
  if (!value) return null;
  if (/\b(ancv|cheques? vacances?|cheques? vacance)\b/.test(value)) return 'holiday_vouchers';
  if (/\b(cb|carte|carte bancaire|card|visa|mastercard|amex|tpe|sumup|apple pay|google pay)\b/.test(value)) return 'card';
  if (/\b(especes?|liquide|cash)\b/.test(value)) return 'cash';
  if (/\b(cheques?|chq)\b/.test(value)) return 'cheque';
  if (/\b(virement|vir|transfer|sepa|rib)\b/.test(value)) return 'transfer';
  if (/\b(prepaye|prepaid|comparateur|en ligne|online|allopark|onepark|parclick|parkmundo|parkvia|park hit|parkos|zenpark)\b/.test(value)) {
    return 'comparator';
  }
  return 'invalid';
}
