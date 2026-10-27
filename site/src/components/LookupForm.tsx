"use client";

import { useActionState } from "react";
import { FieldError } from "./FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Find a booking with its number (Plazo's or the comparator's) and its email or phone (no account; 27/10/2026, direction A). */
export function LookupForm({ action, reference = "" }: { action: Action; reference?: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const v = state.values;
  const f = state.fields;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-3.5">
      {state.error && state.error !== "validation_failed" && (
        <p role="alert" className="rounded-field border border-danger-line bg-danger-bg px-3.5 py-3 text-sm leading-snug font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <div>
        <label htmlFor="m-reference" className="label">
          {fr.manage.reference}
        </label>
        <input
          id="m-reference"
          name="reference"
          type="text"
          required
          maxLength={40}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={v.reference ?? reference}
          aria-invalid={f.reference ? true : undefined}
          aria-describedby={f.reference ? "m-reference-error" : "m-reference-hint"}
          className="field font-semibold tracking-[.06em] uppercase"
        />
        <p id="m-reference-hint" className="mt-1.5 text-[13px] font-medium text-soft">
          {fr.manage.referenceHint}
        </p>
        <FieldError id="m-reference-error" code={f.reference} />
      </div>
      <div>
        <label htmlFor="m-contact" className="label">
          {fr.manage.contact}
        </label>
        <input
          id="m-contact"
          name="contact"
          type="text"
          required
          maxLength={254}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={v.contact}
          aria-invalid={f.contact ? true : undefined}
          aria-describedby={f.contact ? "m-contact-error" : undefined}
          className="field"
        />
        <FieldError id="m-contact-error" code={f.contact} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary mt-1 min-h-12 px-6 text-base">
        {pending ? fr.manage.finding : fr.manage.find}
      </button>
    </form>
  );
}
