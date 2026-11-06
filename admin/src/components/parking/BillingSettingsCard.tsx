import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, fr, invoiceFr } from "@/lib/fr";
import type { BillingSettings } from "@/lib/types";

const t = invoiceFr.settings;

interface Form {
  legalName: string;
  address: string;
  siret: string;
  vatNumber: string;
  vatExempt: boolean;
  vatRate: string;
  mention: string;
  prefix: string;
}

const formOf = (s: BillingSettings): Form => ({
  legalName: s.legalName ?? "",
  address: s.address ?? "",
  siret: s.siret ? s.siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4") : "",
  vatNumber: s.vatNumber ?? "",
  vatExempt: s.vatExempt,
  vatRate: String(s.vatRatePercent).replace(".", ","),
  mention: s.mention ?? "",
  prefix: s.prefix,
});

const fieldError = (field: string, code: string | undefined) => (code ? t.errors[field] ?? t.errors[code] ?? t.errors.invalid : undefined);


type FieldProps = React.ComponentProps<typeof Input> & { id: string; label: string; help?: string; error?: string };

/** Label, input, then the help or the error text (already in French). */
function Field({ id, label, help, error, ...input }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || help ? `${id}-help` : undefined}
        className={`h-11 text-base ${error ? "border-destructive" : ""}`}
        {...input}
      />
      {(error || help) && (
        <p id={`${id}-help`} className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {error ?? help}
        </p>
      )}
    </div>
  );
}

/**
 * « Informations de facturation » (06/11/2026, « une facture au nom du parking avec son logo », direction A): the
 * company that invoices the parking's customers. Filled once by a manager; read-only in the demo.
 */
export function BillingSettingsCard() {
  const { user } = useAuth();
  const readOnly = !!user?.demo;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["billing-settings"], queryFn: () => adminApi.billingSettings() });
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (query.data && !form) setForm(formOf(query.data));
  }, [query.data, form]);

  const save = useMutation({
    mutationFn: (f: Form) =>
      adminApi.updateBillingSettings({
        legalName: f.legalName.trim() || null,
        address: f.address.trim() || null,
        siret: f.siret.trim() || null,
        vatNumber: f.vatNumber.trim() || null,
        vatExempt: f.vatExempt,
        vatRatePercent: Number(f.vatRate.replace(",", ".")),
        mention: f.mention.trim() || null,
        prefix: f.prefix.trim(),
      }),
    onSuccess: (data) => {
      setErrors({});
      setForm(formOf(data));
      queryClient.setQueryData(["billing-settings"], data);
      void queryClient.invalidateQueries({ queryKey: ["reservation-invoices"] });
      toast.success(t.saved);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else toast.error(describeError(err, t.errors));
    },
  });

  const s = query.data;
  if (!s || !form) return null;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(form);
  };
  const year = new Date().getFullYear();
  const example = `${form.prefix.trim().toUpperCase() || "F"}-${year}-0001`;

  return (
    <Card data-testid="billing-settings-card">
      <CardContent className="pt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold">{t.title}</h2>
            <p className="text-sm text-muted-foreground">{readOnly ? t.errors.demo_read_only : t.intro}</p>
            <p className="text-sm text-muted-foreground">{s.hasLogo ? t.logoOn : t.logoOff}</p>
          </div>
          <fieldset disabled={readOnly || save.isPending} className="flex flex-col gap-4">
            <Field
              id="billing-legal-name"
              label={t.legalName}
              value={form.legalName}
              maxLength={120}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              help={t.legalNameHelp}
              error={fieldError("legalName", errors.legalName)}
            />
            <div className="space-y-1.5">
              <Label htmlFor="billing-address">{t.address}</Label>
              <textarea
                id="billing-address"
                value={form.address}
                maxLength={300}
                rows={2}
                placeholder={s.parkingAddress ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                aria-describedby="billing-address-help"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-base"
              />
              <p id="billing-address-help" className="text-sm text-muted-foreground">
                {t.addressHelp(s.parkingAddress)}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="billing-siret"
                label={t.siret}
                inputMode="numeric"
                value={form.siret}
                onChange={(e) => setForm({ ...form, siret: e.target.value })}
                help={t.siretHelp}
                error={fieldError("siret", errors.siret)}
              />
              <Field
                id="billing-prefix"
                label={t.prefix}
                value={form.prefix}
                maxLength={6}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                help={t.prefixHelp(example)}
                error={fieldError("prefix", errors.prefix)}
              />
            </div>
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={form.vatExempt}
                onChange={(e) => setForm({ ...form, vatExempt: e.target.checked })}
              />
              {t.vatExempt}
            </label>
            {!form.vatExempt && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="billing-vat-number"
                  label={t.vatNumber}
                  value={form.vatNumber}
                  onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                  error={fieldError("vatNumber", errors.vatNumber)}
                />
                <Field
                  id="billing-vat-rate"
                  label={t.vatRate}
                  inputMode="decimal"
                  value={form.vatRate}
                  onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                  help={t.vatRateHelp}
                  error={fieldError("vatRatePercent", errors.vatRatePercent)}
                />
              </div>
            )}
            <Field
              id="billing-mention"
              label={t.mention}
              value={form.mention}
              maxLength={300}
              onChange={(e) => setForm({ ...form, mention: e.target.value })}
              help={t.mentionHelp}
            />
          </fieldset>
          <p
            data-testid="billing-state"
            className={`text-sm font-medium ${s.complete ? "text-ok-text" : "text-warn-text"}`}
          >
            {s.complete ? t.complete : t.missing(s.missing.map((f) => t.fields[f] ?? f).join(", "))}
          </p>
          {!readOnly && (
            <div>
              <Button type="submit" className="h-11 text-base" disabled={save.isPending}>
                {fr.common.save}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
