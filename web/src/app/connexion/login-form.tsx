"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Alert, Button, Field } from "@/components/ui";
import { errorMessage, fr } from "@/i18n/fr";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {state?.code && <Alert tone="error">{errorMessage(state.code)}</Alert>}
      <Field label={fr.login.email} name="email" type="email" autoComplete="username" required defaultValue={state?.values?.email} error={state?.fieldErrors?.email} />
      <Field
        label={fr.login.password}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state?.fieldErrors?.password}
      />
      <Button type="submit" disabled={pending} className="w-full">
        {fr.login.submit}
      </Button>
    </form>
  );
}
