import { CarLocation } from '@/domain/car-location';
import { ChildSeats } from '@/domain/child-seats';
import { CancellationPolicy, PaymentStatus, ReservationStatus } from '@/database';

/**
 * A booking as its traveller sees it on the site (only with its manage token). Dates are local to
 * the parking ("2026-10-04T06:30").
 */
export interface PublicBooking {
  reference: string;
  status: ReservationStatus;
  /** "online": paid by card on the site (Stripe); "on_site": the traveller pays at the parking. */
  paymentMode: 'on_site' | 'online';
  /** Online payment state; null when paid at the parking. */
  payment: {
    status: PaymentStatus;
    /** End of the place's hold (UTC, ISO 8601) while the payment is pending, else null. */
    holdExpiresAt: string | null;
    /** Seconds left on the hold when the API answered (immune to the traveller's clock), else null. */
    holdSecondsLeft: number | null;
  } | null;
  parking: {
    title: string;
    slug: string;
    airport: { slug: string; name: string };
    address: string | null;
    shuttleMinutes: number | null;
    openingHours: string | null;
    /** Phone travellers can call, when the parking gave one. */
    phone: string | null;
    /** The return meeting point (B, 06/10/2026): the parking's label and directions, or null when not set. */
    meetingLabel: string | null;
    meetingInstructions: string | null;
  };
  arrivalAt: string;
  returnAt: string;
  days: number;
  /** What the traveller pays in total (« tout compris »), night fees included. */
  priceCents: number | null;
  /** The grid price: `priceCents` minus the night fees; null when there is no price. */
  basePriceCents: number | null;
  /** Night fees included in the total (12/10/2026), frozen at booking (0 for an end that pays nothing); null when none. */
  nightFee: { arrivalCents: number; returnCents: number; totalCents: number } | null;
  /** 21/10/2026: services for the car asked with the booking and paid with it, on top of `priceCents` (0: none). */
  extrasCents: number;
  /** Display form "Prénom Nom", recomputed by the server from the two fields below (09/10/2026). */
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string | null;
  customerPhone: string;
  /** Display form, e.g. AB-123-CD. */
  plate: string;
  returnFlight: string | null;
  departureFlight: string | null;
  /** E (06/10/2026): the traveller's message for the parking, and their vehicle. */
  customerNote: string | null;
  vehicle: { model: string | null; colour: string | null };
  /** Child car seats for the shuttle (24/10/2026), per age group; all zero when none. */
  childSeats: ChildSeats;
  /** Where the car is parked (06/10/2026), recorded by the traveller or the valet; null until then. */
  car: CarLocation | null;
  /** The outbound flight as tracked, and when the shuttle to the terminal is planned to leave (local). */
  outbound: {
    status: string | null;
    scheduledAt: string | null;
    estimatedAt: string | null;
    terminal: string | null;
    shuttleAt: string | null;
  } | null;
  passengers: number;
  cancellationPolicy: CancellationPolicy;
  /** Last moment to cancel online; null when the policy allows no online cancellation. */
  cancellableUntil: string | null;
  canCancel: boolean;
  canEditFlight: boolean;
}
