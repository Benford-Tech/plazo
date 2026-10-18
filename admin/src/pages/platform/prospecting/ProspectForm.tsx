import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, errorMessage, fr } from "@/lib/fr";
import type { Prospect, ProspectInput } from "@/lib/types";
import { Modal } from "./Modal";

const t = fr.platform.prospecting;
type Form = Record<keyof ProspectInput, string>;
const KEYS: (keyof ProspectInput)[] = ["companyName", "contactFirstName", "contactLastName", "email", "town", "airportCode", "phone", "notes"];

const formOf = (p: Prospect | null): Form =>
  Object.fromEntries(KEYS.map(k => [k, (p?.[k] as string | null) ?? ""])) as Form;

/** « + Ajouter un prospect » and « Modifier »: the same form. */
export function ProspectForm({ prospect, onClose }: { prospect: Prospect | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Form>(() => formOf(prospect));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => {
      const input = Object.fromEntries(KEYS.map(k => [k, form[k].trim() || null])) as unknown as ProspectInput;
      return prospect ? adminApi.updateProspect(prospect.id, input) : adminApi.createProspect(input);
    },
    onSuccess: () => {
      toast.success(prospect ? t.updated : t.added);
      queryClient.invalidateQueries({ queryKey: ["platform", "prospects"] });
      onClose();
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && (err.code === "prospect_exists" || err.code === "suppressed")) setErrors({ email: err.code });
      else setErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      toast.error(describeError(err));
    },
  });
  const field = (key: keyof ProspectInput, props: React.InputHTMLAttributes<HTMLInputElement> & { help?: string } = {}) => (
    <FormField
      id={`prospect-${key}`}
      label={t.fields[key]}
      value={form[key]}
      error={errors[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      {...props}
    />
  );
  return (
    <Modal title={prospect ? t.formEdit : t.formAdd} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={e => {
          e.preventDefault();
          save.mutate();
        }}
      >
        {field("companyName", { required: true, maxLength: 120 })}
        <div className="grid gap-3 sm:grid-cols-2">
          {field("contactFirstName", { maxLength: 60 })}
          {field("contactLastName", { maxLength: 60 })}
        </div>
        {field("email", { required: true, type: "email", maxLength: 254 })}
        <div className="grid gap-3 sm:grid-cols-2">
          {field("town", { maxLength: 80 })}
          {field("airportCode", { maxLength: 3, help: t.airportHelp, className: "uppercase" })}
        </div>
        {field("phone", { type: "tel", maxLength: 30 })}
        <div className="space-y-1.5">
          <Label htmlFor="prospect-notes">{t.fields.notes}</Label>
          <textarea
            id="prospect-notes"
            className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-base"
            maxLength={1000}
            value={form.notes}
            aria-invalid={!!errors.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
          {errors.notes && <p className="text-sm text-destructive">{errorMessage(errors.notes)}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button type="submit" className="h-11" disabled={save.isPending}>
            {t.save}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
