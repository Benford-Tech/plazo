import { splitName } from "./phone";
import type { PublicBooking } from "./types";

/** State of a form handled by a server action (useActionState). */
export interface FormState {
  /** Submitted values, to refill the form after an error (React resets uncontrolled fields). */
  values: Record<string, string>;
  /** Error code per field, translated by fr.errors. */
  fields: Record<string, string>;
  /** General error code (e.g. "overbooked"), translated by fr.errors. */
  error: string | null;
  /** Local dates of the full nights when the stay is overbooked. */
  fullNights?: string[];
  /** Success notice (e.g. "flight_saved"). */
  notice?: string | null;
}

export const EMPTY_FORM: FormState = { values: {}, fields: {}, error: null };

/**
 * The booking form refilled from a booking (back from the payment step with « Modifier »). A booking
 * from an older API has the full name only: it is split as the API splits it (first word, then the rest).
 */
export function bookingFormValues(booking: PublicBooking): Record<string, string> {
  const typed = booking.customerFirstName || booking.customerLastName;
  const name = typed ? { firstName: booking.customerFirstName ?? "", lastName: booking.customerLastName ?? "" } : splitName(booking.customerName);
  return {
    customerFirstName: name.firstName,
    customerLastName: name.lastName,
    customerPhone: booking.customerPhone,
    customerEmail: booking.customerEmail ?? "",
    plate: booking.plate,
    returnFlight: booking.returnFlight ?? "",
    departureFlight: booking.departureFlight ?? "",
    passengers: String(booking.passengers),
    vehicleModel: booking.vehicle?.model ?? "",
    vehicleColour: booking.vehicle?.colour ?? "",
    customerNote: booking.customerNote ?? "",
    acceptTerms: "on",
  };
}

/** Address of a booking's page. The manage key never goes in it: it is kept in a cookie (see manage-access.ts). */
export function manageHref(reference: string, confirmed = false): string {
  const base = `/ma-reservation/${encodeURIComponent(reference.toUpperCase())}`;
  return confirmed ? `${base}?confirmee=1` : base;
}

/** The payment step of a booking holding its place. */
export function paymentHref(reference: string): string {
  return `/ma-reservation/${encodeURIComponent(reference.toUpperCase())}/paiement`;
}
