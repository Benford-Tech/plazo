"use client";

import { useActionState } from "react";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

/** Two-step cancellation (the confirmation is a <details>, so it works without JavaScript). */
export function CancelForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, EMPTY_FORM);
  return (
    <div className="flex flex-col gap-2">
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-danger">
          {errorMessage(state.error)}
        </p>
      )}
      <details className="group">
        <summary className="flex h-12 list-none items-center justify-center rounded-full border border-danger bg-white text-[15px] font-bold text-danger [&::-webkit-details-marker]:hidden">
          {fr.manage.cancelButton}
        </summary>
        <form action={formAction} className="mt-2.5 flex flex-col gap-2.5 rounded-[14px] bg-danger-bg p-3">
          <p className="text-sm">{fr.manage.cancelConfirmText}</p>
          <button type="submit" disabled={pending} className="h-12 rounded-full bg-danger text-[15px] font-bold text-white disabled:opacity-60">
            {pending ? fr.manage.cancelling : fr.manage.cancelConfirm}
          </button>
        </form>
      </details>
    </div>
  );
}
