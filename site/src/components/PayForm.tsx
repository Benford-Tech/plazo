"use client";

import { useActionState } from "react";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Boutique: drawn pictograms rather than typographic glyphs, so the « › » of the label becomes a stroked arrow. */
function withoutGlyph(label: string): string {
  return label.replace(/\s*›$/, "");
}

/** "Payer 55,00 €" and an arrow: the server action sends the traveller to Stripe's payment page. */
export function PayForm({ action, total }: { action: Action; total: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      {state.error && (
        <p role="alert" className="rounded-field border border-danger-line bg-danger-bg p-3 text-sm font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary h-[54px] px-6 text-[17px]">
        {pending ? (
          fr.pay.redirecting
        ) : (
          <>
            {withoutGlyph(fr.pay.button(total))}
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="flex-none">
              <path d="M5 12h13M13 6l6 6-6 6" />
            </svg>
          </>
        )}
      </button>
      <p className="text-center text-[13px] font-medium text-soft">
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block align-[-2px]">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
        </svg>
        {fr.pay.redirectNote}
      </p>
    </form>
  );
}

/** A server action as a text action ("Modifier"), or the main button ("Recommencer"). */
export function EditForm({ action, label, variant }: { action: Action; label: string; variant: "link" | "button" }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <form action={formAction} className={variant === "button" ? "flex flex-col gap-2" : "inline"}>
      <button
        type="submit"
        disabled={pending}
        className={variant === "link" ? "link inline-flex min-h-11 items-center text-[14px] disabled:opacity-60" : "btn-primary h-[52px] px-6 text-base"}
      >
        {label}
      </button>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
    </form>
  );
}
