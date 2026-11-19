"use server";

import { api, ApiError } from "./api";
import { manageHref } from "./forms";
import { localizedPath } from "./i18n/locales";
import { actionLocale } from "./i18n/server";
import { formatPlate } from "./plate";
import { siteUrl } from "./site";
import type { Offer } from "./types";

// Site du parking, niveau 3 (19/11/2026): the actions of a parking's own booking page (/r/<slug>). The page lives in the
// parking's site, in an iframe: no cookie is set (a third-party frame may not keep one), the payment page opens in the
// whole window, and Stripe's return carries the booking's key. Never log the submitted values (personal data).

export type QuoteState = { offer: Offer | null; error: string | null };

/** The price and places of a stay on the parking of this page. */
export async function quoteOnBookingPage(slug: string, arrivalAt: string, returnAt: string): Promise<QuoteState> {
  try {
    const page = await api.bookingPage(slug);
    const res = await api.parking(page.airport, page.parking, arrivalAt, returnAt);
    return { offer: res.offer, error: null };
  } catch (error) {
    // A date refused names its field: its own message (« arrival_in_past »…) says more than « validation_failed ».
    const field = error instanceof ApiError && error.fields ? Object.values(error.fields)[0] : null;
    return { offer: null, error: field ?? (error instanceof ApiError ? error.code : "unknown") };
  }
}

export interface PageBookingState {
  values: Record<string, string>;
  fields: Record<string, string>;
  error: string | null;
  /** Once the place is held: where « Payer » goes (Stripe's page, in the whole window), and the amount. */
  payUrl?: string;
  reference?: string;
}

const FIELDS = ["arrivalAt", "returnAt", "customerFirstName", "customerLastName", "customerPhone", "customerEmail", "plate", "returnFlight", "passengers", "idempotencyKey"] as const;
const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9-]{16,64}$/;

export async function bookOnBookingPage(slug: string, _previous: PageBookingState, formData: FormData): Promise<PageBookingState> {
  const values: Record<string, string> = {};
  for (const name of FIELDS) {
    const value = formData.get(name);
    values[name] = typeof value === "string" ? value.trim() : "";
  }
  const acceptTerms = formData.get("acceptTerms") === "on";
  if (values.plate) values.plate = formatPlate(values.plate);
  try {
    const page = await api.bookingPage(slug);
    const created = await api.createBooking({
      airport: page.airport,
      parking: page.parking,
      arrivalAt: values.arrivalAt,
      returnAt: values.returnAt,
      customerFirstName: values.customerFirstName,
      customerLastName: values.customerLastName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      plate: values.plate,
      returnFlight: values.returnFlight || undefined,
      passengers: values.passengers ? Number(values.passengers) : 1,
      acceptTerms,
      idempotencyKey: IDEMPOTENCY_KEY_RE.test(values.idempotencyKey) ? values.idempotencyKey : undefined,
      bookingPage: slug,
    });
    const checkout = await api.checkout(created.reference, created.manageToken);
    const manage = `${siteUrl()}${localizedPath(await actionLocale(), manageHref(created.reference))}?cle=${encodeURIComponent(created.manageToken)}`;
    return { values, fields: {}, error: null, reference: created.reference, payUrl: "url" in checkout ? checkout.url : manage };
  } catch (error) {
    if (error instanceof ApiError) return { values, fields: error.fields ?? {}, error: error.code };
    console.error("[booking-page] unexpected error", error instanceof Error ? error.name : typeof error);
    return { values, fields: {}, error: "unknown" };
  }
}
