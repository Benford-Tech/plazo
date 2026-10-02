"use client";

import { useActionState } from "react";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** "Payer 55,00 € ›": the server action sends the traveller to Stripe's payment page. */
export function PayForm({ action, total }: { action: Action; total: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      {state.error && (
        <p role="alert" className="rounded-[14px] bg-danger-bg p-3 text-sm font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary h-[58px] text-[19px]">
        {pending ? fr.pay.redirecting : fr.pay.button(total)}
      </button>
      <p className="text-center text-[13px] text-soft">{fr.pay.redirectNote}</p>
    </form>
  );
}

/** A server action as a link-looking button ("Modifier"), or a secondary button ("Recommencer"). */
export function EditForm({ action, label, variant }: { action: Action; label: string; variant: "link" | "button" }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <form action={formAction} className={variant === "button" ? "flex flex-col gap-2" : "inline"}>
      <button
        type="submit"
        disabled={pending}
        className={
          variant === "link"
            ? "inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-accent md:min-h-0"
            : "btn-primary h-[52px] px-6 text-base"
        }
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
