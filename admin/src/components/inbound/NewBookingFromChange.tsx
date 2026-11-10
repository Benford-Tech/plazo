import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ApiError, adminApi } from "@/lib/api";
import { describeError, fr, inboundNewBookingFr as t } from "@/lib/fr";
import { nameParts } from "@/lib/names";
import { centsToInput, parseEuros } from "@/lib/pricing";
import { prefillOf } from "@/lib/inbound-new-booking";
import type { InboundEmail, ParsedBooking, Reservation } from "@/lib/types";
import { cn } from "@/lib/utils";

/** The fields of the form, as typed. */
interface Form {
  firstName: string;
  lastName: string;
  phone: string;
  arrivalAt: string;
  returnAt: string;
  plate: string;
  returnFlight: string;
  vehicle: string;
  passengers: string;
  price: string;
}

const local = (value: unknown) => (typeof value === "string" ? value.slice(0, 16) : "");
const text = (value: unknown) => (value === null || value === undefined ? "" : String(value));

function formOf(p: ParsedBooking): Form {
  const name = nameParts(p.customerFirstName, p.customerLastName, p.customerName);
  return {
    firstName: name.firstName,
    lastName: name.lastName,
    phone: text(p.customerPhone),
    arrivalAt: local(p.arrivalAt),
    returnAt: local(p.returnAt),
    plate: text(p.plate),
    returnFlight: text(p.returnFlight),
    vehicle: text(p.vehicleModel),
    passengers: String(p.passengers ?? 1),
    price: p.priceCents != null ? centsToInput(p.priceCents) : "",
  };
}

const INPUT =
  "h-10 w-full min-w-0 rounded-[8px] border border-panel-line bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-lime-deep";

/**
 * 10/11/2026 (« ici propose des champs à modifier et valider pour créer la résa », choice A): under a change left to the
 * staff because its booking is closed, the new values of the mail in fields to correct, then « Créer la réservation »:
 * a new booking of the comparator with its number, the mail attached to it; the closed booking stays as it is.
 */
export function NewBookingFromChange({ email }: { email: InboundEmail }) {
  const queryClient = useQueryClient();
  const prefill = prefillOf(email);
  const [form, setForm] = useState<Form>(() => formOf(prefill));
  const [fields, setFields] = useState<Record<string, string>>({});
  const [force, setForce] = useState(false);
  const [needsForce, setNeedsForce] = useState(false);
  const [created, setCreated] = useState<Reservation | null>(null);
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }));

  const price = form.price.trim() ? parseEuros(form.price) : null;
  const priceInvalid = form.price.trim() !== "" && price === null;

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await adminApi.createReservation({
        channel: "aggregator",
        channelDetail: prefill.provider || null,
        arrivalAt: form.arrivalAt,
        returnAt: form.returnAt,
        passengers: Math.max(1, Number(form.passengers) || 1),
        customerFirstName: form.firstName.trim(),
        customerLastName: form.lastName.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: prefill.customerEmail ?? null,
        plate: form.plate.trim(),
        returnFlight: form.returnFlight.trim() || null,
        departureFlight: prefill.departureFlight ?? null,
        vehicleModel: form.vehicle.trim() || null,
        vehicleColour: prefill.vehicleColour ?? null,
        notes: prefill.notes ?? null,
        ...(prefill.externalReference ? { externalReference: prefill.externalReference, takeReferenceFromClosed: true } : {}),
        ...(price !== null ? { priceCents: price } : {}),
        ...(prefill.externalReference && prefill.priceCents != null ? { importedPriceCents: prefill.priceCents } : {}),
        force: force || undefined,
      });
      await adminApi.attachInboundEmail(email.id, data.id).catch(() => undefined);
      return data;
    },
    onSuccess: data => {
      setCreated(data);
      toast.success(t.created(data.reference));
      queryClient.invalidateQueries({ queryKey: ["inbound-emails"] });
      queryClient.invalidateQueries({ queryKey: ["planning"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      setFields(err instanceof ApiError ? (err.fields ?? {}) : {});
      if (err instanceof ApiError && err.code === "overbooked") setNeedsForce(true);
      toast.error(describeError(err));
    },
  });

  if (created) {
    return (
      <p data-testid="inbound-new-booking-done" className="mx-5 mb-4 rounded-[10px] bg-ok-soft px-4 py-3 text-sm font-medium text-ok-text">
        {t.done}{" "}
        <Link to={`/reservations/${created.id}`} className="font-semibold underline">
          {created.reference}
        </Link>
      </p>
    );
  }

  const missing = !form.firstName.trim() && !form.lastName.trim();
  const ready = form.arrivalAt && form.returnAt && form.returnAt > form.arrivalAt && !missing && !priceInvalid;
  const field = (key: keyof Form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, error?: string) => (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted-foreground">
      {label}
      <input data-testid={`inbound-new-${key}`} value={form[key]} onChange={set(key)} className={cn(INPUT, error && "border-bad")} {...props} />
      {error && <span className="font-normal text-bad">{error}</span>}
    </label>
  );
  const err = (key: string) => (fields[key] ? (fr.errors[fields[key] as keyof typeof fr.errors] ?? t.invalid) : undefined);

  return (
    <form
      data-testid="inbound-new-booking"
      aria-labelledby="inbound-new-booking-title"
      className="mx-5 mb-4 space-y-3 rounded-[10px] border border-panel-line bg-white px-4 py-3"
      onSubmit={e => {
        e.preventDefault();
        if (ready) create.mutate();
      }}
    >
      <div>
        <h3 id="inbound-new-booking-title" className="text-sm font-semibold">
          {t.title}
        </h3>
        <p className="text-xs text-muted-foreground">{t.intro(prefill.provider || t.comparator, prefill.externalReference ?? null)}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("arrivalAt", t.arrival, { type: "datetime-local", required: true }, err("arrivalAt"))}
        {field("returnAt", t.return, { type: "datetime-local", required: true }, err("returnAt"))}
        {field("firstName", t.firstName, {}, err("customerFirstName"))}
        {field("lastName", t.lastName, {}, err("customerLastName"))}
        {field("phone", t.phone, { type: "tel" }, err("customerPhone"))}
        {field("plate", t.plate, { autoCapitalize: "characters" }, err("plate"))}
        {field("returnFlight", t.returnFlight, {}, err("returnFlight"))}
        {field("vehicle", t.vehicle, { maxLength: 40 }, err("vehicleModel"))}
        {field("passengers", t.passengers, { type: "number", min: 1, max: 9, inputMode: "numeric" }, err("passengers"))}
        {field("price", t.price, { inputMode: "decimal", placeholder: "54,00" }, priceInvalid ? t.priceInvalid : err("priceCents"))}
      </div>
      {needsForce && (
        <label className="flex items-center gap-2 text-sm font-medium text-warn-text">
          <input type="checkbox" checked={force} onChange={e => setForce(e.target.checked)} className="h-5 w-5" data-testid="inbound-new-force" />
          {t.force}
        </label>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          data-testid="inbound-new-create"
          disabled={!ready || create.isPending || (needsForce && !force)}
          className="flex h-10 items-center rounded-full bg-primary px-4 text-sm font-bold text-primary-foreground hover:brightness-110 disabled:opacity-60"
        >
          {create.isPending ? t.creating : t.create}
        </button>
        <span className="text-xs text-muted-foreground">{t.closedStays}</span>
      </div>
    </form>
  );
}
