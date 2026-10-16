"use server";

import { api, ApiError } from "./api";
import type { FormState } from "./forms";

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
