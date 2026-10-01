import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminApi, ApiError } from "@/lib/api";
import { localParts, nightsBetween, shortDay } from "@/lib/datetime";
import { describeError, errorMessage, fr } from "@/lib/fr";
import type { ParsedBooking, Reservation, ReservationChannel, ReservationInput } from "@/lib/types";
import { cn } from "@/lib/utils";

const STAFF_CHANNELS: ReservationChannel[] = ["phone", "counter", "aggregator"];

type Form = {
  arrivalDate: string;
  arrivalTime: string;
  returnDate: string;
  returnTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  returnFlight: string;
  passengers: string;
  channel: ReservationChannel;
  channelDetail: string;
  notes: string;
};

const split = (local?: string) => (local ? { date: local.slice(0, 10), time: local.slice(11, 16) } : { date: "", time: "" });

function initialForm(reservation?: Reservation, defaultDate?: string, prefill?: ParsedBooking): Form {
  if (prefill) {
    const a = split(prefill.arrivalAt);
    const r = split(prefill.returnAt);
    return {
      arrivalDate: a.date,
      arrivalTime: a.time,
      returnDate: r.date,
      returnTime: r.time,
      customerName: prefill.customerName ?? "",
      customerPhone: prefill.customerPhone ?? "",
      customerEmail: prefill.customerEmail ?? "",
      plate: prefill.plate ?? "",
      returnFlight: prefill.returnFlight ?? "",
      passengers: String(prefill.passengers ?? 1),
      channel: "aggregator",
      channelDetail: prefill.provider,
      notes: "",
    };
  }
  if (reservation) {
    const a = localParts(reservation.arrivalAt);
    const r = localParts(reservation.returnAt);
    return {
      arrivalDate: a.date,
      arrivalTime: a.time,
      returnDate: r.date,
      returnTime: r.time,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail ?? "",
      plate: reservation.plate,
      returnFlight: reservation.returnFlight ?? "",
      passengers: String(reservation.passengers),
      channel: reservation.channel,
      channelDetail: reservation.channelDetail ?? "",
      notes: reservation.notes ?? "",
    };
  }
  return {
    arrivalDate: defaultDate ?? "",
    arrivalTime: "",
    returnDate: "",
    returnTime: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    plate: "",
    returnFlight: "",
    passengers: "1",
    channel: "phone",
    channelDetail: "",
    notes: "",
  };
}

const labelClass = "mb-1 block text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";
const inputClass =
  "h-12 w-full border border-border bg-card px-3 text-lg text-foreground outline-none focus-visible:border-primary aria-[invalid=true]:border-destructive";

function Field({ id, label, error, help, children }: { id: string; label: string; error?: string; help?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-destructive">{errorMessage(error)}</p> : help && <p className="mt-1 text-sm text-muted-foreground">{help}</p>}
    </div>
  );
}

/** Booking form (direction B). Checks capacity as soon as both dates are known. */
export function ReservationForm({
  reservation,
  defaultDate,
  prefill,
  onSaved,
}: {
  reservation?: Reservation;
  defaultDate?: string;
  /** Values read from a comparator email (import page). */
  prefill?: ParsedBooking;
  onSaved: (reservation: Reservation) => void;
}) {
  const [form, setForm] = useState<Form>(() => initialForm(reservation, defaultDate, prefill));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [force, setForce] = useState(false);
  const t = fr.reservation;

  const arrivalAt = form.arrivalDate && form.arrivalTime ? `${form.arrivalDate}T${form.arrivalTime}` : "";
  const returnAt = form.returnDate && form.returnTime ? `${form.returnDate}T${form.returnTime}` : "";
  const datesReady = !!arrivalAt && !!returnAt && returnAt > arrivalAt;

  // Debounced capacity preview.
  const [stay, setStay] = useState<{ a: string; r: string } | null>(null);
  useEffect(() => {
    const handle = setTimeout(() => setStay(datesReady ? { a: arrivalAt, r: returnAt } : null), 300);
    return () => clearTimeout(handle);
  }, [arrivalAt, returnAt, datesReady]);
  const capacity = useQuery({
    queryKey: ["capacity", stay?.a, stay?.r, reservation?.id],
    queryFn: () => adminApi.previewCapacity(stay!.a, stay!.r, reservation?.id),
    enabled: !!stay,
  });
  const fullNights = capacity.data?.fullNights ?? [];
  const minFree = capacity.data?.nights.length ? Math.min(...capacity.data.nights.map(n => n.free)) : null;
  useEffect(() => setForce(false), [stay?.a, stay?.r]);

  const save = useMutation({
    mutationFn: () => {
      const input: ReservationInput = {
        channel: form.channel,
        channelDetail: form.channel === "aggregator" ? form.channelDetail || null : null,
        arrivalAt,
        returnAt,
        passengers: Number(form.passengers),
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail.trim() || null,
        plate: form.plate,
        returnFlight: form.returnFlight.trim() || null,
        notes: form.notes.trim() || null,
        ...(!reservation && prefill?.externalReference ? { externalReference: prefill.externalReference } : {}),
        ...(!reservation && prefill?.priceCents !== undefined ? { priceCents: prefill.priceCents } : {}),
        force: force || undefined,
      };
      return reservation ? adminApi.updateReservation(reservation.id, input) : adminApi.createReservation(input);
    },
    onSuccess: ({ data }) => onSaved(data),
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      setFormError(err instanceof ApiError && err.code === "validation_failed" ? null : describeError(err));
      if (err instanceof ApiError && err.code === "overbooked") capacity.refetch();
    },
  });

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [key]: e.target.value });
  const missingDates = !arrivalAt ? fieldErrors.arrivalAt : !returnAt ? fieldErrors.returnAt : undefined;
  const nights = useMemo(() => (form.arrivalDate && form.returnDate ? nightsBetween(form.arrivalDate, form.returnDate) : null), [form.arrivalDate, form.returnDate]);

  return (
    <form
      className="space-y-5"
      onSubmit={e => {
        e.preventDefault();
        setFormError(null);
        save.mutate();
      }}
    >
      <fieldset className="grid grid-cols-2 gap-px bg-border">
        <legend className="sr-only">{t.stay}</legend>
        {(
          [
            ["arrival", t.arrival, "arrivalDate", "arrivalTime"],
            ["return", t.return, "returnDate", "returnTime"],
          ] as const
        ).map(([key, label, dateKey, timeKey]) => (
          <div key={key} className="space-y-1 bg-card p-3">
            <span className={labelClass}>{label}</span>
            <label htmlFor={`${key}-date`} className="sr-only">
              {label} — {t.date}
            </label>
            <input
              id={`${key}-date`}
              type="date"
              required
              value={form[dateKey]}
              onChange={set(dateKey)}
              aria-invalid={!!fieldErrors[`${key}At`]}
              className="tabular h-10 w-full bg-transparent font-mono text-lg font-bold text-primary outline-none [color-scheme:dark]"
            />
            <label htmlFor={`${key}-time`} className="sr-only">
              {label} — {t.time}
            </label>
            <input
              id={`${key}-time`}
              type="time"
              required
              value={form[timeKey]}
              onChange={set(timeKey)}
              className="tabular h-10 w-full bg-transparent font-mono text-lg font-bold text-primary outline-none [color-scheme:dark]"
            />
            {fieldErrors[`${key}At`] && <p className="text-sm text-destructive">{errorMessage(fieldErrors[`${key}At`])}</p>}
          </div>
        ))}
      </fieldset>
      {missingDates && <p className="text-sm text-destructive">{errorMessage(missingDates)}</p>}

      {fullNights.length > 0 ? (
        <div role="alert" className="space-y-2 bg-primary p-3 text-primary-foreground">
          <p className="text-lg font-bold uppercase">{t.full(fullNights.map(shortDay).join(", "))}</p>
          <p className="font-semibold">{capacity.data?.canForce ? t.fullHelp : t.fullNoForce}</p>
          {capacity.data?.canForce && (
            <label className="flex min-h-11 items-center gap-3 font-bold">
              <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="h-5 w-5 accent-black" />
              {t.force}
            </label>
          )}
        </div>
      ) : (
        minFree !== null && <p className="border border-border px-3 py-2 text-muted-foreground">{t.available(minFree)}</p>
      )}

      <Field id="customerName" label={t.customerName} error={fieldErrors.customerName}>
        <input id="customerName" required value={form.customerName} onChange={set("customerName")} aria-invalid={!!fieldErrors.customerName} className={inputClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="customerPhone" label={t.customerPhone} error={fieldErrors.customerPhone}>
          <input
            id="customerPhone"
            type="tel"
            required
            value={form.customerPhone}
            onChange={set("customerPhone")}
            aria-invalid={!!fieldErrors.customerPhone}
            className={cn(inputClass, "tabular font-mono")}
          />
        </Field>
        <Field id="customerEmail" label={t.customerEmail} error={fieldErrors.customerEmail}>
          <input
            id="customerEmail"
            type="email"
            value={form.customerEmail}
            onChange={set("customerEmail")}
            aria-invalid={!!fieldErrors.customerEmail}
            className={inputClass}
          />
        </Field>
        <Field id="plate" label={t.plate} error={fieldErrors.plate}>
          <div className="flex h-12 items-stretch overflow-hidden rounded-[4px] border-[1.5px] border-[#F3F3F0]">
            <span aria-hidden="true" className="flex w-5 items-end justify-center bg-plate-band pb-1 text-xs font-bold text-white">
              F
            </span>
            <input
              id="plate"
              required
              autoCapitalize="characters"
              value={form.plate}
              onChange={set("plate")}
              aria-invalid={!!fieldErrors.plate}
              placeholder="AB-123-CD"
              className="min-w-0 flex-1 bg-white px-3 text-xl font-bold uppercase tracking-wide text-[#0B0B0C] outline-none placeholder:text-[#9a9a95]"
            />
          </div>
        </Field>
        <Field id="returnFlight" label={t.returnFlight} error={fieldErrors.returnFlight} help={t.returnFlightHelp}>
          <input
            id="returnFlight"
            autoCapitalize="characters"
            value={form.returnFlight}
            onChange={set("returnFlight")}
            aria-invalid={!!fieldErrors.returnFlight}
            placeholder="TO 3627"
            className={cn(inputClass, "tabular font-mono uppercase")}
          />
        </Field>
        <Field id="passengers" label={t.passengers} error={fieldErrors.passengers}>
          <input
            id="passengers"
            type="number"
            inputMode="numeric"
            min={1}
            max={9}
            required
            value={form.passengers}
            onChange={set("passengers")}
            aria-invalid={!!fieldErrors.passengers}
            className={cn(inputClass, "tabular font-mono")}
          />
        </Field>
      </div>

      <fieldset>
        <legend className={labelClass}>{t.channel}</legend>
        <div className="flex gap-1.5">
          {STAFF_CHANNELS.map(c => (
            <button
              key={c}
              type="button"
              aria-pressed={form.channel === c}
              onClick={() => setForm({ ...form, channel: c })}
              className={cn(
                "h-11 flex-1 font-semibold uppercase tracking-wide",
                form.channel === c ? "bg-foreground text-background" : "border border-border hover:bg-accent",
              )}
            >
              {fr.channels[c]}
            </button>
          ))}
        </div>
      </fieldset>
      {form.channel === "aggregator" && (
        <Field id="channelDetail" label={t.channelDetail} error={fieldErrors.channelDetail}>
          <input id="channelDetail" value={form.channelDetail} onChange={set("channelDetail")} placeholder="Parkos, Onepark…" className={inputClass} />
        </Field>
      )}
      <Field id="notes" label={t.notes} error={fieldErrors.notes}>
        <textarea id="notes" rows={2} value={form.notes} onChange={set("notes")} className={cn(inputClass, "h-auto py-2 text-base")} />
      </Field>

      {formError && (
        <p role="alert" className="border border-destructive px-3 py-2 text-destructive">
          {formError}
        </p>
      )}
      <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <span className="text-lg uppercase text-muted-foreground">{nights ? t.nights(nights) : ""}</span>
        <button
          type="submit"
          disabled={save.isPending || (fullNights.length > 0 && !force)}
          className="h-[52px] bg-primary px-8 text-lg font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {t.save}
        </button>
      </div>
    </form>
  );
}
