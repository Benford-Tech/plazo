import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { adminApi, ApiError } from "@/lib/api";
import { describeError, surchargesFr as t } from "@/lib/fr";
import type { Surcharge, SurchargeKind, SurchargeSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Row {
  id?: string;
  kind: SurchargeKind;
  enabled: boolean;
  amount: string;
  minutes: string;
  label: string;
  note: string;
}

const euros = (cents: number) =>
  cents % 100 === 0
    ? String(cents / 100)
    : (cents / 100).toFixed(2).replace(".", ",");
/** « 10 », « 12,50 » → cents; null when not an amount. */
function centsOf(text: string): number | null {
  const v = text.replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  const c = Math.round(Number(v) * 100);
  return c > 0 ? c : null;
}
const eurosShort = (c: number) =>
  c % 100 === 0
    ? `${c / 100} €`
    : `${(c / 100).toFixed(2).replace(".", ",")} €`;
const hourLabel = (hhmm: string) =>
  `${Number(hhmm.slice(0, 2))}h${hhmm.endsWith(":00") ? "" : hhmm.slice(3)}`;

const rowOf = (s: Surcharge): Row => ({
  id: s.kind === "custom" ? s.id : undefined,
  kind: s.kind,
  enabled: s.enabled,
  amount: euros(s.amountCents),
  minutes: s.minutes !== null ? String(s.minutes) : "",
  label: s.label ?? "",
  note: s.note ?? "",
});

/** The sentence the server will write, live while typing (same wording as `surchargeSentence` of the API). */
function previewOf(
  rows: Row[],
  night: { start: string; end: string },
): string | null {
  const parts = rows
    .filter((r) => r.enabled)
    .map((r) => {
      const amount = centsOf(r.amount);
      if (!amount) return null;
      const note = r.note.trim() ? ` (${r.note.trim()})` : "";
      if (r.kind === "late")
        return r.minutes
          ? `Retard de plus de ${r.minutes} minutes : supplément de ${eurosShort(amount)}${note}`
          : null;
      if (r.kind === "night")
        return night.start && night.end
          ? `Prise en charge ou restitution entre ${hourLabel(night.start)} et ${hourLabel(night.end)} : supplément de ${eurosShort(amount)}`
          : null;
      if (r.kind === "breakdown")
        return `Service de dépannage${note} : ${eurosShort(amount)}`;
      return r.label.trim()
        ? `${r.label.trim()}${note} : ${eurosShort(amount)}`
        : null;
    })
    .filter((p): p is string => !!p);
  return parts.length ? parts.join(" ; ") : null;
}

const input =
  "h-11 rounded-lg border border-panel-line bg-white px-3 text-sm disabled:opacity-60";

/**
 * « Suppléments et conditions » of Parking › Réglages (12/11/2026, « les conditions pénalisantes doivent être
 * paramétrables », choix A): late arrival, night, breakdown and the parking's own, each switched on and set once; Plazo
 * writes the sentence of {conditions}. Information only: no price changes.
 */
export function SurchargesCard({ parkingId }: { parkingId: string }) {
  const { user } = useAuth();
  const readOnly = !!user?.demo;
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["surcharges", parkingId],
    queryFn: () => adminApi.surcharges(parkingId),
  });
  const [rows, setRows] = useState<Row[] | null>(null);
  const [night, setNight] = useState({ start: "22:00", end: "06:00" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!query.data) return;
    setRows(query.data.surcharges.map(rowOf));
    if (query.data.night) setNight(query.data.night);
  }, [query.data]);

  const save = useMutation({
    mutationFn: (list: Row[]) =>
      adminApi.setSurcharges(parkingId, {
        surcharges: list.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          kind: r.kind,
          enabled: r.enabled,
          amountCents: centsOf(r.amount) ?? 0,
          minutes: r.kind === "late" && r.minutes ? Number(r.minutes) : null,
          label: r.kind === "custom" ? r.label : null,
          note: r.kind === "night" ? null : r.note,
        })),
        night,
      }),
    onSuccess: (data: SurchargeSettings) => {
      setErrors({});
      queryClient.setQueryData(["surcharges", parkingId], data);
      toast.success(t.saved);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.fields) setErrors(err.fields);
      else toast.error(describeError(err));
    },
  });

  const preview = useMemo(
    () => (rows ? previewOf(rows, night) : null),
    [rows, night],
  );
  if (!rows) return null;

  const set = (i: number, patch: Partial<Row>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const keyOf = (r: Row, i: number) =>
    r.kind === "custom" ? `custom.${i}` : r.kind;
  const err = (r: Row, i: number, field: string) => {
    const code = errors[`surcharges.${keyOf(r, i)}.${field}`];
    return code ? (t.fieldErrors[code] ?? t.fieldErrors.invalid) : null;
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const bad = rows.some(
      (r) => (r.enabled || r.kind === "custom") && !centsOf(r.amount),
    );
    if (bad) {
      toast.error(t.amountInvalid);
      return;
    }
    save.mutate(rows);
  };

  return (
    <Card data-testid="surcharges-card">
      <CardContent className="pt-6">
        <form
          onSubmit={submit}
          className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
        >
          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">{t.title}</h2>
              <p className="text-sm text-muted-foreground">
                {readOnly ? t.demo : t.intro}
              </p>
            </div>
            <fieldset
              disabled={readOnly || save.isPending}
              className="flex flex-col gap-3"
            >
              {rows.map((r, i) => {
                const name =
                  r.kind === "custom"
                    ? r.label || t.kinds.custom
                    : t.kinds[r.kind];
                const id = `surcharge-${r.kind === "custom" ? `custom-${i}` : r.kind}`;
                return (
                  <div
                    key={r.id ?? `${r.kind}-${i}`}
                    data-testid={id}
                    className="flex flex-col gap-3 rounded-xl border border-panel-line p-4"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={r.enabled}
                        aria-label={t.toggle(name)}
                        onClick={() => set(i, { enabled: !r.enabled })}
                        className={cn(
                          "flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-colors",
                          r.enabled
                            ? "justify-end bg-primary"
                            : "justify-start bg-[#D1D5DB]",
                        )}
                      >
                        <span
                          className={cn(
                            "h-5 w-5 rounded-full",
                            r.enabled ? "bg-[#0F2A14]" : "bg-white",
                          )}
                        />
                      </button>
                      <strong className="min-w-0 flex-1 truncate text-[15px]">
                        {name}
                      </strong>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          r.enabled
                            ? "bg-ok-soft text-ok-text"
                            : "bg-panel-2 text-muted-foreground",
                        )}
                      >
                        {r.enabled ? t.on : t.off}
                      </span>
                      {r.kind === "custom" && (
                        <button
                          type="button"
                          onClick={() =>
                            setRows(rows.filter((_, j) => j !== i))
                          }
                          className="text-sm font-medium text-lime-deep hover:underline"
                        >
                          {t.remove}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                      {r.kind === "custom" && (
                        <Field label={t.label} error={err(r, i, "label")} grow>
                          <input
                            className={input}
                            value={r.label}
                            maxLength={60}
                            placeholder={t.labelPlaceholder}
                            onChange={(e) => set(i, { label: e.target.value })}
                          />
                        </Field>
                      )}
                      {r.kind === "late" && (
                        <Field label={t.minutes} error={err(r, i, "minutes")}>
                          <input
                            className={cn(input, "w-28 font-mono")}
                            inputMode="numeric"
                            value={r.minutes}
                            onChange={(e) =>
                              set(i, {
                                minutes: e.target.value.replace(/\D/g, ""),
                              })
                            }
                          />
                        </Field>
                      )}
                      {r.kind === "night" && (
                        <>
                          <Field
                            label={t.from}
                            error={
                              errors["night.start"]
                                ? (t.fieldErrors[errors["night.start"]] ??
                                  t.fieldErrors.invalid)
                                : null
                            }
                          >
                            <input
                              type="time"
                              className={cn(input, "w-28 font-mono")}
                              value={night.start}
                              onChange={(e) =>
                                setNight({ ...night, start: e.target.value })
                              }
                            />
                          </Field>
                          <Field
                            label={t.to}
                            error={
                              errors["night.end"]
                                ? (t.fieldErrors[errors["night.end"]] ??
                                  t.fieldErrors.invalid)
                                : null
                            }
                          >
                            <input
                              type="time"
                              className={cn(input, "w-28 font-mono")}
                              value={night.end}
                              onChange={(e) =>
                                setNight({ ...night, end: e.target.value })
                              }
                            />
                          </Field>
                        </>
                      )}
                      <Field label={t.amount} error={err(r, i, "amountCents")}>
                        <input
                          className={cn(input, "w-28 font-mono")}
                          inputMode="decimal"
                          value={r.amount}
                          onChange={(e) => set(i, { amount: e.target.value })}
                        />
                      </Field>
                      {r.kind !== "night" && (
                        <Field label={t.note} error={err(r, i, "note")} grow>
                          <input
                            className={input}
                            value={r.note}
                            maxLength={80}
                            placeholder={
                              r.kind === "custom"
                                ? ""
                                : t.notePlaceholder[r.kind]
                            }
                            onChange={(e) => set(i, { note: e.target.value })}
                          />
                        </Field>
                      )}
                    </div>
                    {r.kind === "night" && (
                      <p className="text-xs text-muted-foreground">
                        {query.data?.nightFeesCharged
                          ? `${t.nightShared} ${t.nightCharged}`
                          : t.nightShared}
                      </p>
                    )}
                  </div>
                );
              })}
              {rows.filter((r) => r.kind === "custom").length < 6 && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[#C9CDC7] px-4 py-3">
                  <span className="flex-1 text-sm text-muted-foreground">
                    {t.addOwn}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRows([
                        ...rows,
                        {
                          kind: "custom",
                          enabled: true,
                          amount: "",
                          minutes: "",
                          label: "",
                          note: "",
                        },
                      ])
                    }
                    className="h-11 rounded-full border border-panel-line bg-white px-4 text-sm font-semibold hover:bg-panel-2"
                  >
                    {t.add}
                  </button>
                </div>
              )}
            </fieldset>
            {!readOnly && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={save.isPending}
                  className="flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-105 disabled:opacity-50"
                >
                  {t.save}
                </button>
              </div>
            )}
          </div>
          <aside className="flex min-w-0 flex-col gap-3 rounded-xl bg-panel-2 p-4 lg:self-start">
            <h3 className="text-sm font-semibold">{t.preview}</h3>
            <p className="text-xs text-muted-foreground">{t.previewWhere}</p>
            <p
              data-testid="surcharges-preview"
              className="rounded-xl bg-[#E7F7DC] p-3.5 text-sm leading-relaxed"
            >
              {preview ? `À savoir : ${preview}.` : t.previewNone}
            </p>
            <p className="text-xs text-muted-foreground">{t.info}</p>
          </aside>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  grow,
  children,
}: {
  label: string;
  error: string | null;
  grow?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 text-xs text-muted-foreground",
        grow && "min-w-[160px] flex-1",
      )}
    >
      {label}
      {children}
      {error && <span className="text-xs text-bad-text">{error}</span>}
    </label>
  );
}
