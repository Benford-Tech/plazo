"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { FieldError } from "./FieldError";
import { PlateInput } from "./PlateInput";
import { formatDay } from "@/lib/dates";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr, texts } from "@/lib/fr";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const UNAVAILABLE = ["overbooked", "no_price", "not_found"];
const HIDDEN_FIELDS = ["airport", "parking", "arrivalAt", "returnAt"] as const;

/**
 * "Vos informations" + terms, step 1 of 2 ("Continuer vers le paiement"): the payment page comes
 * next. Submitted to a server action; the price is never sent: the API computes it. Field errors
 * come back from the action and show under each field.
 */
export function BookingForm({
  action,
  stay,
  total,
  links,
  idempotencyKey,
  online = true,
  initialState = EMPTY_FORM,
}: {
  action: Action;
  stay: { airport: string; parking: string; arrivalAt: string; returnAt: string };
  /** Total to pay, already formatted (display only). */
  total: string;
  links: { results: string; parking: string };
  /** Random key of this page's form: a second submission returns the booking already made. */
  idempotencyKey?: string;
  /** Paid by card on the next step (always, kept for the callers). */
  online?: boolean;
  initialState?: FormState;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const alertRef = useRef<HTMLDivElement>(null);
  const v = state.values;
  const f = state.fields;

  useEffect(() => {
    if (state.error) alertRef.current?.focus();
  }, [state]);

  const field = (name: string) => ({
    id: `b-${name}`,
    name,
    "aria-invalid": f[name] ? true : undefined,
    "aria-describedby": f[name] ? `b-${name}-error` : undefined,
  });
  const hiddenErrors = HIDDEN_FIELDS.filter(name => f[name]);
  const unavailable = state.error !== null && UNAVAILABLE.includes(state.error);
  const sectionClass = "card flex flex-col gap-3.5 p-4 md:p-[22px]";
  const sectionTitle = "font-title text-[22px] md:text-2xl";
  const t = texts(online);

  return (
    <form action={formAction} className="flex flex-col gap-[18px]" noValidate>
      {HIDDEN_FIELDS.map(name => (
        <input key={name} type="hidden" name={name} value={stay[name]} />
      ))}
      {idempotencyKey && <input type="hidden" name="idempotencyKey" value={idempotencyKey} />}

      {state.error && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="flex flex-col gap-2 rounded-[22px] border border-danger-line bg-danger-bg p-4 text-danger">
          {unavailable ? (
            <>
              <p className="font-bold">{fr.booking.unavailableTitle}</p>
              <p>{errorMessage(state.error)}</p>
              {state.fullNights && state.fullNights.length > 0 && <p>{fr.booking.fullNights(state.fullNights.map(formatDay).join(", "))}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={links.results} className="btn-secondary h-11 px-4 text-[15px]">
                  {fr.booking.seeOtherParkings}
                </Link>
                <Link href={links.parking} className="btn-secondary h-11 px-4 text-[15px]">
                  {fr.booking.changeDates}
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="font-bold">{state.error === "validation_failed" ? fr.booking.fixErrors : errorMessage(state.error)}</p>
              {hiddenErrors.map(name => (
                <p key={name}>{errorMessage(f[name])}</p>
              ))}
              {hiddenErrors.length > 0 && (
                <Link href={links.parking} className="font-semibold">
                  {fr.booking.changeDates}
                </Link>
              )}
            </>
          )}
        </div>
      )}

      <section className={sectionClass} aria-labelledby="b-infos">
        <h2 id="b-infos" className={sectionTitle}>
          {!online && <span className="text-accent">1.</span>} {fr.booking.yourDetails}
        </h2>
        <div className="grid gap-3.5 md:grid-cols-2 md:gap-3">
          <div>
            <label htmlFor="b-customerName" className="label">
              {fr.booking.name}
            </label>
            <input {...field("customerName")} type="text" required maxLength={120} autoComplete="name" defaultValue={v.customerName} className="field" />
            <FieldError id="b-customerName-error" code={f.customerName} />
          </div>
          <div>
            <label htmlFor="b-customerPhone" className="label">
              {fr.booking.phone}
            </label>
            <input
              {...field("customerPhone")}
              type="tel"
              required
              maxLength={20}
              inputMode="tel"
              autoComplete="tel"
              defaultValue={v.customerPhone}
              className="field font-semibold tabular-nums"
            />
            <FieldError id="b-customerPhone-error" code={f.customerPhone} />
          </div>
        </div>
        <div>
          <label htmlFor="b-customerEmail" className="label">
            {fr.booking.email}
          </label>
          <input {...field("customerEmail")} type="email" required maxLength={254} autoComplete="email" defaultValue={v.customerEmail} className="field" />
          <FieldError id="b-customerEmail-error" code={f.customerEmail} />
        </div>
        <div className="grid gap-3.5 md:grid-cols-[1fr_1fr_120px] md:gap-3">
          <div>
            <label htmlFor="b-plate" className="label">
              {fr.booking.plate}
            </label>
            <PlateInput id="b-plate" name="plate" defaultValue={v.plate} invalid={!!f.plate} describedBy={f.plate ? "b-plate-error" : undefined} />
            <FieldError id="b-plate-error" code={f.plate} />
          </div>
          <div>
            <label htmlFor="b-departureFlight" className="label">
              {fr.booking.outboundFlight}
            </label>
            <input
              {...field("departureFlight")}
              aria-describedby={f.departureFlight ? "b-departureFlight-error" : "b-departureFlight-hint"}
              type="text"
              maxLength={10}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="AF 7641"
              defaultValue={v.departureFlight}
              className="field font-semibold uppercase placeholder:font-normal placeholder:normal-case"
            />
            {f.departureFlight ? (
              <FieldError id="b-departureFlight-error" code={f.departureFlight} />
            ) : (
              <p id="b-departureFlight-hint" className="mt-1.5 text-[13px] text-soft">
                {fr.booking.outboundFlightHint}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="b-returnFlight" className="label">
              {fr.booking.flight}
            </label>
            <input
              {...field("returnFlight")}
              aria-describedby={f.returnFlight ? "b-returnFlight-error" : "b-returnFlight-hint"}
              type="text"
              maxLength={10}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="TO 3627"
              defaultValue={v.returnFlight}
              className="field font-semibold uppercase placeholder:font-normal placeholder:normal-case"
            />
            {f.returnFlight ? (
              <FieldError id="b-returnFlight-error" code={f.returnFlight} />
            ) : (
              <p id="b-returnFlight-hint" className="mt-1.5 text-[13px] text-soft">
                {fr.booking.flightHint}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="b-passengers" className="label">
              {fr.booking.passengers}
            </label>
            <select {...field("passengers")} defaultValue={v.passengers || "1"} className="field">
              {Array.from({ length: 9 }, (_, i) => String(i + 1)).map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <FieldError id="b-passengers-error" code={f.passengers} />
          </div>
        </div>
        {/* E (06/10/2026): the vehicle (so the valet spots it) and a word for the parking. */}
        <p className="pt-1 text-[15px] font-bold">{fr.booking.vehicleTitle}</p>
        <div className="grid gap-3.5 md:grid-cols-2 md:gap-3">
          <div>
            <label htmlFor="b-vehicleModel" className="label">
              {fr.booking.vehicleModel}
            </label>
            <input {...field("vehicleModel")} type="text" maxLength={40} autoComplete="off" placeholder={fr.booking.vehicleModelHint} defaultValue={v.vehicleModel} className="field" />
            <FieldError id="b-vehicleModel-error" code={f.vehicleModel} />
          </div>
          <div>
            <label htmlFor="b-vehicleColour" className="label">
              {fr.booking.vehicleColour}
            </label>
            <input {...field("vehicleColour")} type="text" maxLength={30} autoComplete="off" placeholder={fr.booking.vehicleColourHint} defaultValue={v.vehicleColour} className="field" />
            <FieldError id="b-vehicleColour-error" code={f.vehicleColour} />
          </div>
        </div>
        <div>
          <label htmlFor="b-customerNote" className="label">
            {fr.booking.message}
          </label>
          <textarea {...field("customerNote")} maxLength={300} rows={2} defaultValue={v.customerNote} aria-describedby={f.customerNote ? "b-customerNote-error" : "b-customerNote-hint"} className="field min-h-[72px] py-2.5" />
          {f.customerNote ? (
            <FieldError id="b-customerNote-error" code={f.customerNote} />
          ) : (
            <p id="b-customerNote-hint" className="mt-1.5 text-[13px] text-soft">
              {fr.booking.messageHint}
            </p>
          )}
        </div>
      </section>

      <div>
        <label htmlFor="b-acceptTerms" className="flex min-h-11 items-start gap-2.5 text-sm leading-normal">
          <input
            id="b-acceptTerms"
            name="acceptTerms"
            type="checkbox"
            required
            defaultChecked={v.acceptTerms === "on"}
            aria-invalid={f.acceptTerms ? true : undefined}
            aria-describedby={f.acceptTerms ? "b-acceptTerms-error" : undefined}
            className="mt-0.5 size-5 flex-none accent-accent"
          />
          <span>
            {fr.booking.termsBefore}
            <a href="/conditions" target="_blank" rel="noopener">
              {fr.booking.termsLink}
              <span className="sr-only"> {fr.a11y.opensNewTab}</span>
            </a>
            {fr.booking.termsAfter}
          </span>
        </label>
        <FieldError id="b-acceptTerms-error" code={f.acceptTerms} />
      </div>

      <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary h-[58px] text-[19px]">
        {pending ? t.booking.submitting : t.booking.submit}
      </button>
      {online && <p className="-mt-2 text-center text-[13px] text-soft">{fr.booking.paymentNext(total)}</p>}
      <p className="text-center text-[13px] text-soft">{fr.booking.noAccount}</p>
    </form>
  );
}
