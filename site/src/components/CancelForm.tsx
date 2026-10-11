"use client";

import { useActionState } from "react";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Two-step cancellation (the confirmation is a <details>, so it works without JavaScript). */
export function CancelForm({ action, confirmText = fr.manage.cancelConfirmText }: { action: Action; confirmText?: string }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <div className="flex flex-col gap-2">
      {state.error && (
        <p role="alert" className="text-[13.5px] leading-snug font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <details className="group">
        <summary className="flex min-h-12 list-none items-center justify-center rounded-full border border-danger-line bg-white px-5 text-[15px] font-bold text-danger hover:border-danger group-open:border-danger group-open:bg-danger-bg [&::-webkit-details-marker]:hidden">
          {fr.manage.cancelButton}
        </summary>
        <form action={formAction} className="mt-2.5 flex flex-col gap-3 rounded-field border border-danger-line bg-danger-bg p-3.5">
          <p className="text-sm leading-relaxed text-ink">{confirmText}</p>
          <button type="submit" disabled={pending} className="min-h-12 cursor-pointer rounded-full bg-danger px-5 text-[15px] font-bold text-white hover:bg-danger/90 disabled:cursor-progress disabled:opacity-60">
            {pending ? fr.manage.cancelling : fr.manage.cancelConfirm}
          </button>
        </form>
      </details>
    </div>
  );
}
