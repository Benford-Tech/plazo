"use client";

import { useActionState } from "react";
import { FieldError } from "./FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Find a booking with its reference and email (no account). */
export function LookupForm({ action, reference = "" }: { action: Action; reference?: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const v = state.values;
  const f = state.fields;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-2.5">
      {state.error && state.error !== "validation_failed" && (
        <p role="alert" className="rounded-xl bg-danger-bg px-3 py-2.5 text-sm font-semibold text-danger">
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
          maxLength={12}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          defaultValue={v.reference ?? reference}
          aria-invalid={f.reference ? true : undefined}
          aria-describedby={f.reference ? "m-reference-error" : undefined}
          className="field font-semibold tracking-[.06em] uppercase"
        />
        <FieldError id="m-reference-error" code={f.reference} />
      </div>
      <div>
        <label htmlFor="m-email" className="label">
          {fr.manage.email}
        </label>
        <input
          id="m-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={v.email}
          aria-invalid={f.email ? true : undefined}
          aria-describedby={f.email ? "m-email-error" : undefined}
          className="field"
        />
        <FieldError id="m-email-error" code={f.email} />
      </div>
      <button type="submit" disabled={pending} className="btn-primary h-12 text-base">
        {pending ? fr.manage.finding : fr.manage.find}
      </button>
    </form>
  );
}
