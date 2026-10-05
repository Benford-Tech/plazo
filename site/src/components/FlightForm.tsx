"use client";

import { useActionState } from "react";
import { FieldError } from "./FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Change (or clear) the return flight followed by the shuttle, and the outbound flight (V-A). */
export function FlightForm({ action, flight, outbound = null }: { action: Action; flight: string | null; outbound?: string | null }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const error = state.fields.returnFlight ?? (state.error && state.error !== "validation_failed" ? state.error : null);
  const outboundError = state.fields.departureFlight ?? null;
  return (
    <form action={formAction} noValidate className="flex flex-col gap-2.5">
      <div>
        <label htmlFor="m-outbound" className="label">
          {fr.manage.outboundLabel}
        </label>
        <input
          id="m-outbound"
          name="departureFlight"
          type="text"
          maxLength={10}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="AF 7641"
          defaultValue={state.values.departureFlight ?? outbound ?? ""}
          aria-invalid={outboundError ? true : undefined}
          aria-describedby={outboundError ? "m-outbound-error" : undefined}
          className="field font-semibold uppercase placeholder:font-normal placeholder:normal-case"
        />
        {outboundError && <FieldError id="m-outbound-error" code={outboundError} />}
      </div>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor="m-flight" className="label">
            {fr.manage.flightLabel}
          </label>
          <input
            id="m-flight"
            name="returnFlight"
            type="text"
            maxLength={10}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="TO 3627"
            defaultValue={state.values.returnFlight ?? flight ?? ""}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "m-flight-error" : "m-flight-help"}
            className="field font-semibold uppercase placeholder:font-normal placeholder:normal-case"
          />
        </div>
        <button type="submit" disabled={pending} aria-busy={pending || undefined} className="btn-secondary h-12 flex-none px-4 text-[15px]">
          {pending ? fr.manage.flightSaving : flight ? fr.manage.flightEdit : fr.manage.flightSave}
        </button>
      </div>
      {error ? (
        <FieldError id="m-flight-error" code={error} />
      ) : (
        <p id="m-flight-help" className="text-[13px] text-soft">
          {fr.manage.flightHelp}
        </p>
      )}
      <p role="status" className="text-sm font-semibold text-ok empty:hidden">
        {state.notice === "flight_saved" ? fr.manage.flightSaved : ""}
      </p>
    </form>
  );
}
