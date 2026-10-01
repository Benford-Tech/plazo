"use client";

import { useActionState } from "react";
import { changeOwnPasswordAction } from "@/app/actions/team";
import { Alert, Button, Field } from "@/components/ui";
import { errorMessage, fr } from "@/i18n/fr";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changeOwnPasswordAction, undefined);
  const err = state?.fieldErrors ?? {};
  return (
    <form action={action} className="max-w-sm space-y-4">
      {state?.code && <Alert tone="error">{errorMessage(state.code)}</Alert>}
      <Field
        label={fr.account.currentPassword}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
        error={err.currentPassword}
      />
      <Field
        label={fr.account.newPassword}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        error={err.newPassword}
      />
      <Button type="submit" disabled={pending}>
        {fr.account.submit}
      </Button>
    </form>
  );
}
