"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api, ApiError } from "./api";
import { encodeQueryValue } from "./dates";
import { type FormState, manageHref, paymentHref } from "./forms";
import { resumeCookie, secureCookies } from "./manage-access";
import { manageTokenFor, rememberManageToken } from "./manage-session";
import { formatPlate } from "./plate";
import type { CreatedBooking, BookingAccess } from "./types";

// Server actions of the traveller site. They only forward what the traveller typed: prices,
// availability and every rule are decided by the API. Never log the submitted values (personal data).

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function failure(values: Record<string, string>, error: unknown): FormState {
  if (error instanceof ApiError) {
    const details = error.details as { fullNights?: unknown } | undefined;
    const fullNights = Array.isArray(details?.fullNights) ? details.fullNights.filter((d): d is string => typeof d === "string") : undefined;
    return { values, fields: error.fields ?? {}, error: error.code, fullNights };
  }
  // Unexpected: log the error type only (the submitted values are personal data).
  console.error("[actions] unexpected error", error instanceof Error ? error.name : typeof error);
  return { values, fields: {}, error: "unknown" };
}

const BOOKING_FIELDS = [
  "airport",
  "parking",
  "arrivalAt",
  "returnAt",
  "customerName",
  "customerPhone",
  "customerEmail",
  "plate",
  "returnFlight",
  "passengers",
] as const;

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9-]{16,64}$/;

export async function bookAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values: Record<string, string> = {};
  for (const name of BOOKING_FIELDS) values[name] = text(formData, name);
  values.acceptTerms = formData.get("acceptTerms") === "on" ? "on" : "";
  if (values.plate) values.plate = formatPlate(values.plate);

  // Every rule (required fields, formats, terms) is checked by the API, which reports all fields at once.
  const passengers = values.passengers ? Number(values.passengers) : 1;
  const idempotencyKey = text(formData, "idempotencyKey");

  let created: CreatedBooking;
  try {
    created = await api.createBooking({
      airport: values.airport,
      parking: values.parking,
      arrivalAt: values.arrivalAt,
      returnAt: values.returnAt,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      customerEmail: values.customerEmail,
      plate: values.plate,
      returnFlight: values.returnFlight || undefined,
      passengers,
      acceptTerms: values.acceptTerms === "on",
      // Same key for every submission of this page: a retry returns the booking already made.
      idempotencyKey: IDEMPOTENCY_KEY_RE.test(idempotencyKey) ? idempotencyKey : undefined,
    });
  } catch (error) {
    return failure(values, error);
  }
  await rememberManageToken(created.reference, created.manageToken);
  // Paid online: the place is held, the payment step comes next.
  if (created.booking.status === "pending_payment") redirect(paymentHref(created.reference));
  redirect(manageHref(created.reference, true));
}

/** "Payer" on the payment step: off to Stripe's payment page (or to the booking, if already paid). */
export async function payAction(reference: string, _previous: FormState): Promise<FormState> {
  const token = await tokenFor(reference);
  let target: string;
  try {
    const result = await api.checkout(reference, token);
    target = "url" in result ? result.url : `${manageHref(reference)}?paiement=retour`;
  } catch (error) {
    // The hold ended meanwhile: the payment step says so.
    if (error instanceof ApiError && error.code === "hold_expired") redirect(paymentHref(reference));
    return failure({}, error);
  }
  redirect(target);
}

/**
 * "Modifier" (or "Recommencer" once the hold expired): the place is released and the booking form
 * opens again with what the traveller typed.
 */
export async function editBookingAction(reference: string, _previous: FormState): Promise<FormState> {
  const token = await tokenFor(reference);
  try {
    await api.releaseBooking(reference, token);
  } catch (error) {
    // Paid in the meantime: nothing to edit, the booking is confirmed.
    if (error instanceof ApiError && error.code === "already_paid") redirect(`${manageHref(reference)}?paiement=retour`);
    return failure({}, error);
  }
  let booking;
  try {
    booking = await api.booking(reference, token);
  } catch (error) {
    return failure({}, error);
  }
  const { slug: parking, airport } = booking.parking;
  const cookie = resumeCookie(airport.slug, parking, reference, token, secureCookies());
  (await cookies()).set(cookie.name, cookie.value, cookie.options);
  redirect(`/${airport.slug}/${parking}/reserver?arrivee=${encodeQueryValue(booking.arrivalAt)}&retour=${encodeQueryValue(booking.returnAt)}&reprise=1`);
}

export async function lookupAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { reference: text(formData, "reference").toUpperCase(), email: text(formData, "email") };
  const fields: Record<string, string> = {};
  if (!values.reference) fields.reference = "required";
  if (!values.email) fields.email = "required";
  if (Object.keys(fields).length) return { values, fields, error: "validation_failed" };

  let access: BookingAccess;
  try {
    access = await api.lookupBooking(values.reference, values.email);
  } catch (error) {
    const state = failure(values, error);
    return state.error === "not_found" ? { ...state, error: "lookup_not_found" } : state;
  }
  await rememberManageToken(access.reference, access.manageToken);
  redirect(manageHref(access.reference));
}

/** The booking's key kept by this browser; the API answers "not_found" without it. */
async function tokenFor(reference: string): Promise<string> {
  return (await manageTokenFor(reference)) ?? "";
}

export async function changeFlightAction(reference: string, _previous: FormState, formData: FormData): Promise<FormState> {
  const values = { returnFlight: text(formData, "returnFlight") };
  const token = await tokenFor(reference);
  try {
    const booking = await api.changeFlight(reference, token, values.returnFlight || null);
    refresh();
    return { values: { returnFlight: booking.returnFlight ?? "" }, fields: {}, error: null, notice: "flight_saved" };
  } catch (error) {
    return failure(values, error);
  }
}

export async function cancelAction(reference: string, _previous: FormState): Promise<FormState> {
  const token = await tokenFor(reference);
  try {
    await api.cancelBooking(reference, token);
  } catch (error) {
    return failure({}, error);
  }
  // The page says that the cancellation email is on its way only right after this action.
  redirect(`${manageHref(reference)}?annulee=1`);
}
