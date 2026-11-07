import type { ChildSeats, PublicBooking } from "./types";

/**
 * Browser-side calls to a booking's public routes (the manage token in the x-booking-token header,
 * as the server-side `api` does): the live blocks of "Ma réservation" poll and act from the page.
 */
export class BookingClientError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

export async function bookingRequest<T>(reference: string, path: string, token: string, body?: unknown, method?: "POST" | "PUT" | "PATCH"): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/public/bookings/${encodeURIComponent(reference)}${path}`, {
      method: body === undefined ? "GET" : (method ?? "POST"),
      headers: { "x-booking-token": token, ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BookingClientError(0, "network");
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = (data ?? {}) as { code?: string; fields?: Record<string, string> };
    throw new BookingClientError(res.status, err.code ?? (err.fields ? Object.values(err.fields)[0] : null) ?? (res.status >= 500 ? "server_error" : "unknown"));
  }
  return data as T;
}

/**
 * PUT /public/bookings/:ref/child-seats (24/10/2026): the child seats the traveller asks for the shuttle, while the
 * booking is « Attendu » (409 `child_seats_locked` after; 400 `child_seats_exceed_passengers`). Answers the booking.
 */
export function updateChildSeats(reference: string, token: string, seats: ChildSeats): Promise<PublicBooking> {
  return bookingRequest<PublicBooking>(reference, "/child-seats", token, seats, "PUT");
}

/** 07/11/2026: an invoice or credit note of the booking, as the traveller sees it. */
export interface TravellerInvoice {
  id: string;
  kind: "invoice" | "credit_note";
  number: string;
  issuedAt: string;
  totalTtcCents: number;
  issuer: string;
  creditOf: string | null;
  creditedBy: string | null;
}

export interface TravellerInvoices {
  invoices: TravellerInvoice[];
  request: { at: string; company: string | null; address: string | null } | null;
  canRequest: boolean;
  refusal: "reservation_cancelled" | "no_price" | "invoice_exists" | "already_requested" | "anonymized" | null;
}

/** GET /public/bookings/:ref/invoices */
export function bookingInvoices(reference: string, token: string): Promise<TravellerInvoices> {
  return bookingRequest<TravellerInvoices>(reference, "/invoices", token);
}

/** POST /public/bookings/:ref/invoices/request { company?, address? }: the parking is told. */
export function requestInvoice(reference: string, token: string, body: { company?: string; address?: string }): Promise<TravellerInvoices> {
  return bookingRequest<TravellerInvoices>(reference, "/invoices/request", token, body);
}

/** GET /public/bookings/:ref/invoices/:id/pdf, saved by the browser (the token goes in a header, not in a link). */
export async function downloadInvoice(reference: string, token: string, invoice: TravellerInvoice): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`/api/public/bookings/${encodeURIComponent(reference)}/invoices/${encodeURIComponent(invoice.id)}/pdf`, {
      headers: { "x-booking-token": token },
      cache: "no-store",
    });
  } catch {
    throw new BookingClientError(0, "network");
  }
  if (!res.ok) throw new BookingClientError(res.status, "unknown");
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.kind === "credit_note" ? "Avoir" : "Facture"}-${invoice.number}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** "14:05" in the parking's time (every parking is in France for now). */
export const hhmm = (iso: string) => new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/** "mar. 7 oct. 08:00" for "à partir de …". */
export const dayAndTime = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date(iso));

/** "1 h 12 min", "38 min". */
export function durationLabel(seconds: number): string {
  const m = Math.max(0, Math.round(seconds / 60));
  if (m < 60) return `${m} min`;
  const rest = m % 60;
  return rest ? `${Math.floor(m / 60)} h ${String(rest).padStart(2, "0")} min` : `${Math.floor(m / 60)} h`;
}
