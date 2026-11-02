import type { ReservationChannel } from "./types";

/**
 * 02/11/2026 (« marquer les réservations en direct pour les stats et une icône parlante »): booked with the parking
 * itself, nobody in between (phone, counter, its own website), so no commission. Mirror of the server's
 * `domain/direct-booking.ts`.
 */
export const DIRECT_CHANNELS: readonly ReservationChannel[] = ["phone", "counter", "website"];

export const isDirectBooking = (channel: ReservationChannel): boolean => DIRECT_CHANNELS.includes(channel);
