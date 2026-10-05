import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import type {
  AirportResponse,
  BookingAccess,
  BookingInput,
  CheckoutResult,
  CreatedBooking,
  ParkingResponse,
  PublicBooking,
  SearchResponse, TravellerReturn } from "./types";

/**
 * Server-side client of the backend's public API. The browser never calls the API: pages (server
 * components) and server actions do, at BACKEND_URL (injected at runtime by the Vercel service binding).
 */

const DEFAULT_BACKEND_URL = "http://localhost:3005";
const TIMEOUT_MS = 10000;
// A booking (or a payment page, or a refund) waits for the parking lock, then for the confirmation email and SMS (5 s each at most,
// in parallel) before the API answers: give it more time than a page read, so that a booking made
// is not reported as failed (a retry would then return it anyway, see idempotencyKey).
const BOOKING_TIMEOUT_MS = 25000;

/** Error of an API call, with the backend's machine-readable codes (translated by fr.ts). */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string,
    public fields?: Record<string, string>,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Backend base URL without trailing slash. Read at call time: bindings exist at runtime only. */
export function backendBase(env: Record<string, string | undefined> = process.env): string {
  return (env.BACKEND_URL || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
}

/** Joins the base and an absolute API path by string ("/api/public/..."). */
export function backendUrl(path: string, env?: Record<string, string | undefined>): string {
  return `${backendBase(env)}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Key the API recognises the site by (x-plazo-site-key), so that it limits each traveller and not
 * the site as a whole. Required once deployed: without it, a few lookups would lock the form for
 * every traveller.
 */
export function siteApiKey(env: Record<string, string | undefined> = process.env): string {
  const key = env.SITE_API_KEY?.trim() ?? "";
  if (!key && env.VERCEL) throw new Error("SITE_API_KEY is not set (it must match the API's SITE_API_KEY)");
  return key;
}

/** The traveller's IP as seen by the site: first x-forwarded-for entry, else x-real-ip. */
export function clientIp(h: Pick<Headers, "get">): string | null {
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return h.get("x-real-ip")?.trim() || null;
}

function fallbackCode(status: number): string {
  if (status === 429) return "too_many_requests";
  if (status === 404) return "not_found";
  if (status >= 500) return "server_error";
  return "unknown";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Manage token of a booking, sent in a header (never in the URL: request logs). */
  bookingToken?: string;
  timeoutMs?: number;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const incoming = await headers();
  const outgoing: Record<string, string> = {
    accept: "application/json",
    "x-plazo-site-key": siteApiKey(),
  };
  const ip = clientIp(incoming);
  if (ip) outgoing["x-plazo-client-ip"] = ip;
  if (options.body !== undefined) outgoing["content-type"] = "application/json";
  if (options.bookingToken) outgoing["x-booking-token"] = options.bookingToken;

  let response: Response;
  try {
    response = await fetch(backendUrl(path), {
      method: options.method ?? "GET",
      headers: outgoing,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? TIMEOUT_MS),
    });
  } catch {
    throw new ApiError(0, "Backend unreachable", "network");
  }

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!response.ok) {
    const body = (data ?? {}) as { message?: string; code?: string; fields?: Record<string, string>; details?: unknown };
    throw new ApiError(response.status, body.message ?? response.statusText, body.code ?? fallbackCode(response.status), body.fields, body.details);
  }
  return data as T;
}

const seg = encodeURIComponent;

function query(params: Record<string, string | null | undefined>): string {
  const entries = Object.entries(params).filter((e): e is [string, string] => !!e[1]);
  return entries.length ? `?${new URLSearchParams(entries)}` : "";
}

export const api = {

  /** Airport page: published parkings with their lowest package price. Deduplicated per request. */
  airport: cache((slug: string) => apiRequest<AirportResponse>(`/api/public/airports/${seg(slug)}`)),

  /** Parkings for a stay, with availability and total price. */
  search: (airport: string, arrivalAt: string, returnAt: string) =>
    apiRequest<SearchResponse>(`/api/public/search${query({ airport, arrivalAt, returnAt })}`),

  /** A parking's page, with the offer for a stay when dates are given. Deduplicated per request. */
  parking: cache((airport: string, slug: string, arrivalAt?: string | null, returnAt?: string | null) =>
    apiRequest<ParkingResponse>(`/api/public/airports/${seg(airport)}/parkings/${seg(slug)}${query({ arrivalAt, returnAt })}`),
  ),

  createBooking: (input: BookingInput) =>
    apiRequest<CreatedBooking>("/api/public/bookings", { method: "POST", body: input, timeoutMs: BOOKING_TIMEOUT_MS }),

  lookupBooking: (reference: string, email: string) =>
    apiRequest<BookingAccess>("/api/public/bookings/lookup", { method: "POST", body: { reference, email } }),

  booking: cache((reference: string, token: string) =>
    apiRequest<PublicBooking>(`/api/public/bookings/${seg(reference)}`, { bookingToken: token }),
  ),

  /** The return day of a booking (the app's live block), for the booking page's first paint. */
  returnState: (reference: string, token: string) => apiRequest<TravellerReturn>(`/api/public/bookings/${seg(reference)}/return`, { bookingToken: token }),

  changeFlight: (reference: string, token: string, returnFlight: string | null) =>
    apiRequest<PublicBooking>(`/api/public/bookings/${seg(reference)}/flight`, {
      method: "PATCH",
      body: { returnFlight },
      bookingToken: token,
    }),

  /** Stripe Checkout page of a booking holding its place (or { paid: true }). */
  checkout: (reference: string, token: string) =>
    apiRequest<CheckoutResult>(`/api/public/bookings/${seg(reference)}/checkout`, { method: "POST", body: {}, bookingToken: token, timeoutMs: BOOKING_TIMEOUT_MS }),

  /** Ends the hold of a booking not paid yet (the traveller goes back to edit the form). */
  releaseBooking: (reference: string, token: string) =>
    apiRequest<PublicBooking>(`/api/public/bookings/${seg(reference)}/release`, { method: "POST", body: {}, bookingToken: token }),

  cancelBooking: (reference: string, token: string) =>
    apiRequest<PublicBooking>(`/api/public/bookings/${seg(reference)}/cancel`, {
      method: "POST",
      body: {},
      bookingToken: token,
      // A booking paid online is refunded before the API answers.
      timeoutMs: BOOKING_TIMEOUT_MS,
    }),
};
