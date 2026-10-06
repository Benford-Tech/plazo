import { CLEARED_CAR_LOCATION } from '@/domain/car-location';

/**
 * Retention of the travellers' data (privacy policy of 06/10/2026, site/src/lib/legal.ts): a booking
 * keeps who the traveller is for 12 months after its return, for claims and disputes. After that only
 * what accounting and the operator's reconciliations need stays: reference, parking, channel and its
 * booking number, dates, status, passengers count, amounts and payment identifiers.
 */
export const RESERVATION_RETENTION_MONTHS = 12;

/** Bookings whose return is before this moment are anonymised. */
export function anonymizeReturnedBefore(now: Date): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - RESERVATION_RETENTION_MONTHS);
  return cutoff;
}

/** What replaces the traveller's data on an anonymised booking (required columns get a neutral value). */
export const ANONYMIZED_TRAVELLER = {
  customerName: 'Client anonymisé',
  customerPhone: '',
  customerEmail: null,
  plate: '—',
  plateKey: '',
  returnFlight: null,
  departureFlight: null,
  notes: null,
  ...CLEARED_CAR_LOCATION,
};

/** Keys of the audit details that carry the same data (field changes, landed flight). */
export const PERSONAL_AUDIT_KEYS = [...Object.keys(ANONYMIZED_TRAVELLER), 'flight'];
