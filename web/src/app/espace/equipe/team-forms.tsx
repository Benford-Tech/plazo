"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaffAction, resetStaffPasswordAction, updateStaffAction } from "@/app/actions/team";
import { Alert, Button, Field } from "@/components/ui";
import type { StaffRole } from "@/db/schema";
import { STAFF_ROLES } from "@/domain/roles";
import { errorMessage, fr } from "@/i18n/fr";

function RoleSelect({ name, defaultValue, id }: { name: string; defaultValue?: StaffRole; id: string }) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? "agent"}
      className="block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
    >
      {STAFF_ROLES.map((r) => (
        <option key={r} value={r}>
          {fr.roles[r]}
        </option>
      ))}
    </select>
  );
}

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(createStaffAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  const err = state?.fieldErrors ?? {};
  const v = state?.ok ? undefined : state?.values;
  const t = fr.team;
  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state?.ok && <Alert tone="success">{t.created}</Alert>}
      {state?.code && !state.ok && <Alert tone="error">{errorMessage(state.code)}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t.name} name="name" required defaultValue={v?.name} error={err.name} />
        <Field label={t.email} name="email" type="email" required defaultValue={v?.email} error={err.email} />
        <Field label={t.phone} name="phone" type="tel" defaultValue={v?.phone} error={err.phone} />
        <div className="space-y-1">
          <label htmlFor="new-role" className="block text-sm font-medium text-slate-700">
            {t.role}
          </label>
          <RoleSelect id="new-role" name="role" defaultValue={v?.role as StaffRole | undefined} key={v?.role} />
        </div>
        <Field
          label={t.password}
          name="password"
          type="text"
          autoComplete="off"
          required
          help={t.passwordHelp}
          error={err.password}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {t.create}
      </Button>
    </form>
  );
}

export function MemberActions({ member }: { member: { id: string; role: StaffRole; active: boolean } }) {
  const [updateState, updateAction, updating] = useActionState(updateStaffAction, undefined);
  const [resetState, resetAction, resetting] = useActionState(resetStaffPasswordAction, undefined);
  const t = fr.team;
  return (
    <div className="w-full space-y-2 sm:w-72">
      {updateState?.code && <Alert tone="error">{errorMessage(updateState.code)}</Alert>}
      <form action={updateAction} className="flex gap-2">
        <input type="hidden" name="userId" value={member.id} />
        <label htmlFor={`role-${member.id}`} className="sr-only">
          {t.changeRole}
        </label>
        <RoleSelect id={`role-${member.id}`} name="role" defaultValue={member.role} />
        <Button type="submit" variant="secondary" disabled={updating}>
          {fr.common.save}
        </Button>
      </form>
      <form action={updateAction}>
        <input type="hidden" name="userId" value={member.id} />
        <input type="hidden" name="active" value={member.active ? "false" : "true"} />
        <Button type="submit" variant={member.active ? "danger" : "secondary"} disabled={updating} className="w-full">
          {member.active ? t.deactivate : t.reactivate}
        </Button>
      </form>
      <form action={resetAction} className="flex gap-2">
        <input type="hidden" name="userId" value={member.id} />
        <label htmlFor={`pwd-${member.id}`} className="sr-only">
          {t.resetPassword}
        </label>
        <input
          id={`pwd-${member.id}`}
          name="password"
          placeholder={t.resetPassword}
          autoComplete="off"
          className="block min-h-11 w-full rounded-lg border border-slate-300 px-3 text-base"
        />
        <Button type="submit" variant="secondary" disabled={resetting}>
          OK
        </Button>
      </form>
      {resetState?.ok && <Alert tone="success">{t.passwordReset}</Alert>}
      {resetState && !resetState.ok && (
        <Alert tone="error">{errorMessage(resetState.code ?? resetState.fieldErrors?.password)}</Alert>
      )}
    </div>
  );
}
