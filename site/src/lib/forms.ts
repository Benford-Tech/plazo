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

/** Address of a booking's page. The manage key never goes in it: it is kept in a cookie (see manage-access.ts). */
export function manageHref(reference: string, confirmed = false): string {
  const base = `/ma-reservation/${encodeURIComponent(reference.toUpperCase())}`;
  return confirmed ? `${base}?confirmee=1` : base;
}

/** The payment step of a booking holding its place. */
export function paymentHref(reference: string): string {
  return `/ma-reservation/${encodeURIComponent(reference.toUpperCase())}/paiement`;
}
