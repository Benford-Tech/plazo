import { ReservationChannel } from '@/database';

/**
 * 02/11/2026 (« marquer les réservations en direct pour les stats et une icône parlante »): a booking made with the
 * parking itself, with no one in between: by phone, at the counter or on the parking's own website. Plazo and the
 * comparators (and a file import, whose source is unknown) are not direct. No commission is ever taken on these.
 */
export const DIRECT_CHANNELS: readonly ReservationChannel[] = ['phone', 'counter', 'website'];

export function isDirectBooking(channel: ReservationChannel): boolean {
  return DIRECT_CHANNELS.includes(channel);
}
