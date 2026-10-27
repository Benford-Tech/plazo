"use server";

import { api, ApiError } from "./api";
import type { FormState } from "./forms";
import { formatEuros } from "./money";
import { DEFAULT_PLAN, PRO_OPTIONS, PRO_PLANS, selectionSummary, type OptionId, type PlanId } from "./pro-pricing";

// Footer A (15/10/2026): the contact form and « La lettre Plazo ». Like the other forms of the site they go through the
// site's server (server actions), which forwards the site key and the visitor's address to the API's per-visitor
// limits and works without JavaScript. Never log what was typed: names, addresses and messages are personal data.

const CONTACT_LIMITS = { name: 80, email: 254, reference: 20, message: 2000 } as const;
const MESSAGE_MIN = 10;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Field codes of the API, worded for each field (« invalid » on the e-mail is « Adresse email invalide. »). */
function fieldCodes(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, code] of Object.entries(fields)) {
    if (field === "email" && (code === "invalid" || code === "invalid_email")) out[field] = "invalid_email";
    else if (field === "message" && (code === "too_short" || code === "too_long")) out[field] = `message_${code}`;
    else out[field] = code;
  }
  return out;
}

function failure(values: Record<string, string>, error: unknown): FormState {
  if (error instanceof ApiError) return { values, fields: fieldCodes(error.fields ?? {}), error: error.code };
  // Unexpected: the error type only.
  console.error("[contact-actions] unexpected error", error instanceof Error ? error.name : typeof error);
  return { values, fields: {}, error: "unknown" };
}

/** /contact: name, e-mail, booking reference (optional) and message, sent by e-mail to the service client. */
export async function contactAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = {
    name: text(formData, "name"),
    email: text(formData, "email"),
    reference: text(formData, "reference").toUpperCase(),
    message: text(formData, "message"),
  };
  // The quick checks before a round trip; the API checks everything again (formats, lengths).
  const fields: Record<string, string> = {};
  for (const name of ["name", "email", "message"] as const) if (!values[name]) fields[name] = "required";
  for (const name of ["name", "reference", "message"] as const) {
    if (!fields[name] && values[name].length > CONTACT_LIMITS[name]) fields[name] = "too_long";
  }
  if (!fields.message && values.message.length < MESSAGE_MIN) fields.message = "too_short";
  if (Object.keys(fields).length) return { values, fields: fieldCodes(fields), error: "validation_failed" };

  try {
    await api.contact({
      name: values.name,
      email: values.email,
      reference: values.reference || undefined,
      message: values.message,
      website: text(formData, "website"),
    });
  } catch (error) {
    return failure(values, error);
  }
  return { values: {}, fields: {}, error: null, notice: "contact_sent" };
}

/**
 * « S'inscrire »: the form says that subscribing means agreeing to receive the letter (its only use), so submitting it is
 * the consent; Brevo then asks the reader to confirm by e-mail (double opt-in) before the first letter.
 */
export async function newsletterAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };
  if (!values.email) return { values, fields: { email: "required" }, error: "validation_failed" };
  if (values.email.length > CONTACT_LIMITS.email) return { values, fields: { email: "invalid_email" }, error: "validation_failed" };
  try {
    await api.newsletter({ email: values.email, consent: true, website: text(formData, "website") });
  } catch (error) {
    return failure(values, error);
  }
  return { values: {}, fields: {}, error: null, notice: "newsletter_sent" };
}

/**
 * « Demander un devis » of the Plazo Pro pricing page (27/10/2026): the operator's details and the selection made on the
 * page, sent like the contact form to the support address (the visitor in Reply-To). The selection is read again
 * here from its ids, never taken as text from the browser.
 */
export async function quoteAction(_previous: FormState, formData: FormData): Promise<FormState> {
  const values = {
    firstName: text(formData, "firstName"),
    lastName: text(formData, "lastName"),
    parking: text(formData, "parking"),
    email: text(formData, "email"),
    phone: text(formData, "phone"),
    airport: text(formData, "airport"),
  };
  const fields: Record<string, string> = {};
  for (const name of ["firstName", "lastName", "parking", "email"] as const) if (!values[name]) fields[name] = "required";
  for (const name of ["firstName", "lastName", "parking", "phone", "airport"] as const) {
    if (!fields[name] && values[name].length > 80) fields[name] = "too_long";
  }
  if (Object.keys(fields).length) return { values, fields: fieldCodes(fields), error: "validation_failed" };

  const options = formData.getAll("options").filter((o): o is OptionId => typeof o === "string" && PRO_OPTIONS.some(p => p.id === o));
  const planValue = text(formData, "plan");
  const selection = {
    plan: (PRO_PLANS.some(p => p.id === planValue) ? planValue : DEFAULT_PLAN) as PlanId,
    yearly: text(formData, "yearly") === "1",
    marketplace: text(formData, "marketplace") === "1",
    options,
  };
  const message = [
    "Demande de devis Plazo Pro",
    `Parking : ${values.parking}`,
    `Aéroport : ${values.airport || "non précisé"}`,
    `Téléphone : ${values.phone || "non précisé"}`,
    "",
    selectionSummary(selection, formatEuros),
  ].join("\n");
  try {
    await api.contact({
      name: `${values.firstName} ${values.lastName}`.slice(0, CONTACT_LIMITS.name),
      email: values.email,
      message: message.slice(0, CONTACT_LIMITS.message),
      website: text(formData, "website"),
    });
  } catch (error) {
    return failure(values, error);
  }
  return { values: {}, fields: {}, error: null, notice: "quote_sent" };
}
