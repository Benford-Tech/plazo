"use client";

import { useActionState, useState } from "react";
import { updateParkingAction } from "@/app/actions/parking";
import { Alert, Button, Field } from "@/components/ui";
import { bookableCapacity } from "@/domain/capacity";
import { errorMessage, fr } from "@/i18n/fr";

type Values = {
  name: string;
  address: string;
  totalCapacity: number;
  safetyMarginPct: number;
  shuttleTravelMinutes: number;
};

function preview(total: number, margin: number): number | null {
  try {
    return bookableCapacity(total, margin);
  } catch {
    return null;
  }
}

export function ParkingForm({ initial }: { initial: Values }) {
  const [state, action, pending] = useActionState(updateParkingAction, undefined);
  const [total, setTotal] = useState(String(initial.totalCapacity));
  const [margin, setMargin] = useState(String(initial.safetyMarginPct));
  const bookable = preview(Number(total), Number(margin));
  const t = fr.parking;
  const err = state?.fieldErrors ?? {};
  const v = state?.values;

  return (
    <form action={action} className="space-y-4">
      {state?.ok && <Alert tone="success">{fr.common.saved}</Alert>}
      {state?.code && <Alert tone="error">{errorMessage(state.code)}</Alert>}
      <Field label={t.name} name="name" defaultValue={v?.name ?? initial.name} required error={err.name} />
      <Field label={t.address} name="address" defaultValue={v?.address ?? initial.address} error={err.address} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label={t.totalCapacity}
          name="totalCapacity"
          type="number"
          inputMode="numeric"
          min={1}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
          error={err.totalCapacity}
        />
        <Field
          label={t.safetyMarginPct}
          name="safetyMarginPct"
          type="number"
          inputMode="numeric"
          min={0}
          max={50}
          value={margin}
          onChange={(e) => setMargin(e.target.value)}
          required
          help={t.safetyMarginHelp}
          error={err.safetyMarginPct}
        />
        <Field
          label={t.shuttleTravelMinutes}
          name="shuttleTravelMinutes"
          type="number"
          inputMode="numeric"
          min={1}
          max={120}
          defaultValue={v?.shuttleTravelMinutes ?? initial.shuttleTravelMinutes}
          required
          help={t.shuttleHelp}
          error={err.shuttleTravelMinutes}
        />
      </div>
      {bookable !== null && <Alert tone="info">{t.bookablePreview(bookable)}</Alert>}
      <Button type="submit" disabled={pending}>
        {fr.common.save}
      </Button>
    </form>
  );
}
