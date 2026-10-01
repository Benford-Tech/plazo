"use client";

import { useActionState } from "react";
import { FieldError } from "./FieldError";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Change (or clear) the return flight followed by the shuttle. */
export function FlightForm({ action, flight }: { action: Action; flight: string | null }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  const error = state.fields.returnFlight ?? (state.error && state.error !== "validation_failed" ? state.error : null);
  return (
    <form action={formAction} noValidate className="flex flex-col gap-2.5">
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
