import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ChildSeatIcon } from "@/components/ChildSeatIcon";
import { adminApi, ApiError } from "@/lib/api";
import {
  CHILD_SEAT_KINDS,
  CHILD_SEAT_LABELS,
  type ChildSeats,
  childSeatsTotal,
  hasChildSeats,
  MAX_CHILD_SEATS_PER_KIND,
  NO_CHILD_SEATS,
  sameChildSeats,
} from "@/lib/child-seats";
import { localParts, nightsBetween, shortDay } from "@/lib/datetime";
import { describeError, errorMessage, fr } from "@/lib/fr";
import { nameParts } from "@/lib/names";
import { centsToInput, isPriceLocked, parseEuros } from "@/lib/pricing";
import { PAYMENT_METHODS } from "@/lib/payment-method";
import type { Handover, ParsedBooking, PaymentMethod, Reservation, ReservationChannel, ReservationInput } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ValetIcon } from "@/lib/valet-icon";

const STAFF_CHANNELS: ReservationChannel[] = ["phone", "counter", "aggregator"];

type Form = {
  arrivalDate: string;
  arrivalTime: string;
  returnDate: string;
  returnTime: string;
  /** 09/10/2026: first and last name apart; the server builds the display name. */
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  plate: string;
  returnFlight: string;
  departureFlight: string;
  /** D-A: a stop's id, "" for the airport. */
  stopId: string;
  passengers: string;
  channel: ReservationChannel;
  channelDetail: string;
  notes: string;
  /** E (06/10/2026): the traveller's message and vehicle, as given at the counter or on the phone. */
  customerNote: string;
  vehicleModel: string;
  vehicleColour: string;
  /** 10/10/2026: the amount in euros as typed ("26,00"), "" for none. */
  price: string;
  /** « Sièges auto » (24/10/2026): the child seats to install in the shuttle. */
  childSeats: ChildSeats;
  /** « Voiturier au terminal » (27/10/2026). */
  handover: Handover;
  /** 29/10/2026 (« Payé par »): null when not said. */
  paymentMethod: PaymentMethod | null;
};

const split = (local?: string) => (local ? { date: local.slice(0, 10), time: local.slice(11, 16) } : { date: "", time: "" });

function initialForm(reservation?: Reservation, defaultDate?: string, prefill?: ParsedBooking): Form {
  if (prefill) {
    const a = split(prefill.arrivalAt);
    const r = split(prefill.returnAt);
    const name = nameParts(prefill.customerFirstName, prefill.customerLastName, prefill.customerName);
    return {
      arrivalDate: a.date,
      arrivalTime: a.time,
      returnDate: r.date,
      returnTime: r.time,
      customerFirstName: name.firstName,
      customerLastName: name.lastName,
      customerPhone: prefill.customerPhone ?? "",
      customerEmail: prefill.customerEmail ?? "",
      plate: prefill.plate ?? "",
      returnFlight: prefill.returnFlight ?? "",
      departureFlight: prefill.departureFlight ?? "",
      stopId: "",
      passengers: String(prefill.passengers ?? 1),
      channel: "aggregator",
      channelDetail: prefill.provider,
      // 25/10/2026: Park Hit's flights typed without their airline, the customer's comment.
      notes: prefill.notes ?? "",
      customerNote: "",
      // 10/10/2026: the car the comparator gives (the form's limits: 40 and 30 characters).
      vehicleModel: prefill.vehicleModel?.trim().slice(0, 40) ?? "",
      vehicleColour: prefill.vehicleColour?.trim().slice(0, 30) ?? "",
      // 10/10/2026: the amount read in the email, to check or correct before saving.
      price: prefill.priceCents != null ? centsToInput(prefill.priceCents) : "",
      childSeats: { ...NO_CHILD_SEATS },
      handover: "shuttle",
      paymentMethod: null,
    };
  }
  if (reservation) {
    const a = localParts(reservation.arrivalAt);
    const r = localParts(reservation.returnAt);
    const name = nameParts(reservation.customerFirstName, reservation.customerLastName, reservation.customerName);
    return {
      arrivalDate: a.date,
      arrivalTime: a.time,
      returnDate: r.date,
      returnTime: r.time,
      customerFirstName: name.firstName,
      customerLastName: name.lastName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail ?? "",
      plate: reservation.plate,
      returnFlight: reservation.returnFlight ?? "",
      departureFlight: reservation.departureFlight ?? "",
      stopId: reservation.stopId ?? "",
      passengers: String(reservation.passengers),
      channel: reservation.channel,
      channelDetail: reservation.channelDetail ?? "",
      notes: reservation.notes ?? "",
      customerNote: reservation.customerNote ?? "",
      vehicleModel: reservation.vehicleModel ?? "",
      vehicleColour: reservation.vehicleColour ?? "",
      price: reservation.priceCents != null ? centsToInput(reservation.priceCents) : "",
      childSeats: { ...NO_CHILD_SEATS, ...(reservation.childSeats ?? {}) },
      handover: reservation.handover ?? "shuttle",
      paymentMethod: reservation.paymentMethod ?? null,
    };
  }
  return {
    arrivalDate: defaultDate ?? "",
    arrivalTime: "",
    returnDate: "",
    returnTime: "",
    customerFirstName: "",
    customerLastName: "",
    customerPhone: "",
    customerEmail: "",
    plate: "",
    returnFlight: "",
    departureFlight: "",
    stopId: "",
    passengers: "1",
    channel: "phone",
    channelDetail: "",
    notes: "",
    customerNote: "",
    vehicleModel: "",
    vehicleColour: "",
    price: "",
    childSeats: { ...NO_CHILD_SEATS },
    handover: "shuttle",
    paymentMethod: null,
  };
}

const labelClass = "mb-1 block text-[13px] font-semibold uppercase tracking-wide text-muted-foreground";
const inputClass =
  "h-12 w-full border border-border bg-card px-3 text-lg text-foreground outline-none focus-visible:border-lime-deep aria-[invalid=true]:border-destructive";

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

/**
 * « Sièges auto pour la navette » (24/10/2026, direction B « par âge »): a collapsible block under the passengers, one
 * stepper per age group (0 to 4), opened by itself when the booking already asks for seats.
 */
function ChildSeatsBlock({
  seats,
  open,
  onToggle,
  onChange,
  error,
}: {
  seats: ChildSeats;
  open: boolean;
  onToggle: () => void;
  onChange: (seats: ChildSeats) => void;
  error: string | null;
}) {
  const t = fr.reservation.childSeats;
  const total = childSeatsTotal(seats);
  const stepClass =
    "flex h-11 w-11 shrink-0 items-center justify-center border border-border text-lime-deep hover:bg-accent disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <section data-testid="child-seats" className="border border-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="child-seats-steppers"
        onClick={onToggle}
        className="flex min-h-12 w-full items-center gap-2 px-3 text-left"
      >
        <ChildSeatIcon className="text-lime-deep" />
        <span className={cn(labelClass, "mb-0 flex-1")}>{t.title}</span>
        <span className="font-mono text-sm text-muted-foreground">{total > 0 ? total : t.none}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>
      {open && (
        <div id="child-seats-steppers" className="space-y-3 border-t border-border p-3">
          <p className="text-sm text-muted-foreground">{t.help}</p>
          {CHILD_SEAT_KINDS.map(kind => {
            const l = CHILD_SEAT_LABELS[kind];
            const n = seats[kind];
            return (
              <div key={kind} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{l.ages}</p>
                  <p className="text-sm text-muted-foreground">{l.hint}</p>
                </div>
                <div className="flex items-center">
                  <button type="button" aria-label={t.less(l.ages)} disabled={n === 0} onClick={() => onChange({ ...seats, [kind]: n - 1 })} className={stepClass}>
                    <Minus className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <output data-testid={`child-seats-${kind}`} aria-label={l.ages} className="tabular w-10 text-center font-mono text-lg font-bold">
                    {n}
                  </output>
                  <button
                    type="button"
                    aria-label={t.more(l.ages)}
                    disabled={n >= MAX_CHILD_SEATS_PER_KIND}
                    onClick={() => onChange({ ...seats, [kind]: n + 1 })}
                    className={stepClass}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <p role="alert" className="border-t border-border px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
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
  // A one-word name (older row, comparator email) is stored with an empty last name: an edit that leaves the name alone
  // must not require one, so the names are sent, and required, only on creation or once changed.
  const initialName = reservation ? nameParts(reservation.customerFirstName, reservation.customerLastName, reservation.customerName) : null;
  const nameRequired =
    !initialName || form.customerFirstName.trim() !== initialName.firstName || form.customerLastName.trim() !== initialName.lastName;

  // 10/10/2026 (« Pouvoir modifier le prix après l'intégration du mail »): the amount can be set or corrected, never a
  // Plazo booking's; an edit sends it only when it changed (null when emptied).
  const priceLocked = !!reservation && isPriceLocked(reservation);
  const priceCents = form.price.trim() ? parseEuros(form.price) : null;
  const priceInvalid = !!form.price.trim() && priceCents === null;
  // « Sièges auto » (24/10/2026): children count in the passengers, so a booking keeps at least one adult.
  const seatsTotal = childSeatsTotal(form.childSeats);
  const seatsExceed = seatsTotal > 0 && seatsTotal >= Number(form.passengers);
  const [seatsOpen, setSeatsOpen] = useState(() => hasChildSeats(reservation?.childSeats));

  const arrivalAt = form.arrivalDate && form.arrivalTime ? `${form.arrivalDate}T${form.arrivalTime}` : "";
  const returnAt = form.returnDate && form.returnTime ? `${form.returnDate}T${form.returnTime}` : "";
  const datesReady = !!arrivalAt && !!returnAt && returnAt > arrivalAt;

  // Debounced capacity preview.
  const [stay, setStay] = useState<{ a: string; r: string } | null>(null);
  useEffect(() => {
    const handle = setTimeout(() => setStay(datesReady ? { a: arrivalAt, r: returnAt } : null), 300);
    return () => clearTimeout(handle);
  }, [arrivalAt, returnAt, datesReady]);
  // D-A: the stops besides the airport; the field only shows when the parking has some.
  const stops = useQuery({ queryKey: ["stops"], queryFn: adminApi.getStops });
  const customStops = (stops.data?.data ?? []).filter(s => !s.builtIn && s.id);
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
      const names = { customerFirstName: form.customerFirstName.trim(), customerLastName: form.customerLastName.trim() };
      const input: Omit<ReservationInput, "customerFirstName" | "customerLastName"> = {
        channel: form.channel,
        channelDetail: form.channel === "aggregator" ? form.channelDetail || null : null,
        arrivalAt,
        returnAt,
        passengers: Number(form.passengers),
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail.trim() || null,
        plate: form.plate,
        returnFlight: form.returnFlight.trim() || null,
        departureFlight: form.departureFlight.trim() || null,
        stopId: form.handover === "valet" ? null : form.stopId || null,
        ...(!reservation || form.handover !== (reservation.handover ?? "shuttle") ? { handover: form.handover } : {}),
        notes: form.notes.trim() || null,
        customerNote: form.customerNote.trim() || null,
        vehicleModel: form.vehicleModel.trim() || null,
        vehicleColour: form.vehicleColour.trim() || null,
        ...(!reservation && prefill?.externalReference ? { externalReference: prefill.externalReference } : {}),
        ...(!reservation && priceCents !== null ? { priceCents } : {}),
        // The amount read in the email stays the comparator's, even if corrected here: its next change email keeps ours.
        ...(!reservation && prefill?.externalReference && prefill.priceCents != null ? { importedPriceCents: prefill.priceCents } : {}),
        ...(reservation && !priceLocked && priceCents !== reservation.priceCents ? { priceCents } : {}),
        ...(!reservation && form.paymentMethod ? { paymentMethod: form.paymentMethod } : {}),
        ...(reservation && !priceLocked && form.paymentMethod !== (reservation.paymentMethod ?? null) ? { paymentMethod: form.paymentMethod } : {}),
        // The seats go with a creation; an edit sends them only once changed (null when they are all gone).
        ...(!reservation ? { childSeats: form.childSeats } : {}),
        ...(reservation && !sameChildSeats(form.childSeats, reservation.childSeats)
          ? { childSeats: hasChildSeats(form.childSeats) ? form.childSeats : null }
          : {}),
        force: force || undefined,
      };
      return reservation
        ? adminApi.updateReservation(reservation.id, { ...input, ...(nameRequired ? names : {}) })
        : adminApi.createReservation({ ...input, ...names });
    },
    onSuccess: ({ data }) => onSaved(data),
    onError: (err: Error) => {
      setFieldErrors(err instanceof ApiError ? (err.fields ?? {}) : {});
      setFormError(err instanceof ApiError && err.code === "validation_failed" ? null : describeError(err));
      if (err instanceof ApiError && err.code === "overbooked") capacity.refetch();
    },
  });

  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm({ ...form, [key]: e.target.value });
  const missingDates = !arrivalAt ? fieldErrors.arrivalAt : !returnAt ? fieldErrors.returnAt : undefined;
  const nights = useMemo(() => (form.arrivalDate && form.returnDate ? nightsBetween(form.arrivalDate, form.returnDate) : null), [form.arrivalDate, form.returnDate]);

  return (
    <form
      className="space-y-5"
      onSubmit={e => {
        e.preventDefault();
        setFormError(null);
        if (priceInvalid) {
          setFieldErrors({ priceCents: "invalid_amount" });
          return;
        }
        if (seatsExceed) {
          setFieldErrors({ childSeats: "child_seats_exceed_passengers" });
          setSeatsOpen(true);
          return;
        }
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
              className="tabular h-10 w-full bg-transparent font-mono text-lg font-bold text-lime-deep outline-none [color-scheme:dark]"
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
              className="tabular h-10 w-full bg-transparent font-mono text-lg font-bold text-lime-deep outline-none [color-scheme:dark]"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="customerFirstName" label={t.customerFirstName} error={fieldErrors.customerFirstName}>
          <input
            id="customerFirstName"
            required={nameRequired}
            maxLength={60}
            autoComplete="off"
            value={form.customerFirstName}
            onChange={set("customerFirstName")}
            aria-invalid={!!fieldErrors.customerFirstName}
            className={inputClass}
          />
        </Field>
        <Field id="customerLastName" label={t.customerLastName} error={fieldErrors.customerLastName}>
          <input
            id="customerLastName"
            required={nameRequired}
            maxLength={60}
            autoComplete="off"
            value={form.customerLastName}
            onChange={set("customerLastName")}
            aria-invalid={!!fieldErrors.customerLastName}
            className={inputClass}
          />
        </Field>
      </div>
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
              // 15/10/2026: a comparator's booking may come without its plate (« Compléter »: read on arrival); a plate,
              // once typed, is never erased (the server refuses it), nor does a booking without one move to the phone or the
              // counter without it.
              required={!!reservation?.plate.trim() || (form.channel !== "aggregator" && form.channel !== reservation?.channel)}
              autoCapitalize="characters"
              value={form.plate}
              onChange={set("plate")}
              aria-invalid={!!fieldErrors.plate}
              placeholder="AB-123-CD"
              className="min-w-0 flex-1 bg-white px-3 text-xl font-bold uppercase tracking-wide text-[#0B0B0C] outline-none placeholder:text-[#9a9a95]"
            />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="departureFlight" label={t.departureFlight} error={fieldErrors.departureFlight} help={t.departureFlightHelp}>
            <input
              id="departureFlight"
              autoCapitalize="characters"
              value={form.departureFlight}
              onChange={set("departureFlight")}
              aria-invalid={!!fieldErrors.departureFlight}
              placeholder="AF 7641"
              className={cn(inputClass, "tabular font-mono uppercase")}
            />
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
        </div>
        {customStops.length > 0 && form.handover === "shuttle" && (
          <Field id="stopId" label={t.stop} error={fieldErrors.stopId}>
            <select id="stopId" value={form.stopId} onChange={set("stopId")} aria-invalid={!!fieldErrors.stopId} className={inputClass}>
              <option value="">{t.stopAirport}</option>
              {customStops.map(s => (
                <option key={s.id!} value={s.id!}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
        )}
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

      <fieldset data-testid="handover">
        <legend className={labelClass}>{t.handover}</legend>
        <div className="flex gap-1.5">
          {(["shuttle", "valet"] as const).map(h => (
            <button
              key={h}
              type="button"
              aria-pressed={form.handover === h}
              onClick={() => setForm({ ...form, handover: h })}
              className={cn(
                "flex h-11 flex-1 items-center justify-center gap-1.5 font-semibold",
                form.handover === h ? (h === "valet" ? "bg-info text-info-ink" : "bg-foreground text-background") : "border border-border hover:bg-accent",
              )}
            >
              {h === "valet" && <ValetIcon className="h-4 w-4" />}
              {t.handovers[h]}
            </button>
          ))}
        </div>
        {form.handover === "valet" && <p className="mt-1.5 text-sm text-muted-foreground">{t.handoverValetHelp}</p>}
        {fieldErrors.handover && <p className="mt-1.5 text-sm text-destructive">{errorMessage(fieldErrors.handover)}</p>}
      </fieldset>

      <ChildSeatsBlock
        seats={form.childSeats}
        open={seatsOpen}
        onToggle={() => setSeatsOpen(o => !o)}
        onChange={childSeats => setForm({ ...form, childSeats })}
        error={seatsExceed ? t.childSeats.exceed : fieldErrors.childSeats ? errorMessage(fieldErrors.childSeats) : null}
      />

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
      <Field id="price" label={t.pricePaid} error={fieldErrors.priceCents} help={priceLocked ? t.priceLocked : t.priceHelp}>
        <div className="flex items-center gap-2">
          <input
            id="price"
            inputMode="decimal"
            autoComplete="off"
            value={form.price}
            onChange={set("price")}
            disabled={priceLocked}
            placeholder="0,00"
            aria-invalid={!!fieldErrors.priceCents}
            className={cn(inputClass, "tabular w-40 text-right font-mono disabled:opacity-60")}
          />
          <span aria-hidden="true" className="text-lg text-muted-foreground">
            €
          </span>
        </div>
      </Field>
      {priceLocked ? null : (
        <fieldset data-testid="payment-method">
          <legend className={labelClass}>{t.paidBy}</legend>
          <div className="flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map(m => (
              <button
                key={m}
                type="button"
                aria-pressed={form.paymentMethod === m}
                onClick={() => setForm({ ...form, paymentMethod: form.paymentMethod === m ? null : m })}
                className={cn(
                  "h-10 rounded-full px-3.5 text-sm font-semibold",
                  form.paymentMethod === m ? "bg-foreground text-background" : "border border-border hover:bg-accent",
                )}
              >
                {fr.paidBy[m]}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{t.paidByHelp}</p>
          {fieldErrors.paymentMethod && <p className="mt-1.5 text-sm text-destructive">{errorMessage(fieldErrors.paymentMethod)}</p>}
        </fieldset>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field id="vehicleModel" label={t.vehicleModel} error={fieldErrors.vehicleModel}>
          <input id="vehicleModel" value={form.vehicleModel} onChange={set("vehicleModel")} maxLength={40} placeholder="Peugeot 308" className={inputClass} />
        </Field>
        <Field id="vehicleColour" label={t.vehicleColour} error={fieldErrors.vehicleColour}>
          <input id="vehicleColour" value={form.vehicleColour} onChange={set("vehicleColour")} maxLength={30} placeholder="grise" className={inputClass} />
        </Field>
      </div>
      <Field id="customerNote" label={t.customerNote} error={fieldErrors.customerNote}>
        <textarea id="customerNote" rows={2} maxLength={300} value={form.customerNote} onChange={set("customerNote")} className={cn(inputClass, "h-auto py-2 text-base")} />
      </Field>
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
