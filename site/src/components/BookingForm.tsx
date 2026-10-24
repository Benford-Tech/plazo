"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ChildSeatIcon, ChildSeatSteppers } from "./ChildSeatsFields";
import { FieldError } from "./FieldError";
import { PlateInput } from "./PlateInput";
import { childSeatsFromValues, childSeatsProblem, hasChildSeats } from "@/lib/child-seats";
import { formatDay } from "@/lib/dates";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr, texts } from "@/lib/fr";
import type { ChildSeats } from "@/lib/types";

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
  const seatsRef = useRef<HTMLDivElement>(null);
  const v = state.values;
  const f = state.fields;
  // Child seats (24/10/2026): the block is on when the refilled form asked for some; the passengers are watched
  // for the rule « fewer seats than passengers » (children count in the passengers).
  const [seatsOn, setSeatsOn] = useState(() => hasChildSeats(childSeatsFromValues(initialState.values)));
  const [seats, setSeats] = useState<ChildSeats>(() => childSeatsFromValues(initialState.values));
  const [passengers, setPassengers] = useState(initialState.values.passengers || "1");
  const seatsProblem = seatsOn ? childSeatsProblem(seats, Number(passengers)) : null;
  const seatsError = seatsProblem ?? (state.error === "child_seats_exceed_passengers" ? state.error : null);

  useEffect(() => {
    if (state.error) alertRef.current?.focus();
  }, [state]);

  const field = (name: string) => ({
    id: `b-${name}`,
    name,
    "aria-invalid": f[name] ? true : undefined,
    "aria-describedby": f[name] ? `b-${name}-error` : undefined,
  });
  // A server that still knows only the full name (`customerName`) reports it there: shown under « Prénom ».
  const firstNameError = f.customerFirstName ?? f.customerName;
  const hiddenErrors = HIDDEN_FIELDS.filter(name => f[name]);
  const unavailable = state.error !== null && UNAVAILABLE.includes(state.error);
  const sectionClass = "card flex flex-col gap-4 p-4 md:p-[22px]";
  const sectionTitle = "font-title text-[22px] leading-tight md:text-2xl";
  // Groups of fields inside the card are separated by the inner hairline.
  const group = "border-t border-line-soft pt-4";
  const t = texts(online);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-[18px]"
      noValidate
      onSubmit={e => {
        // The seats rule is known here: no round trip for it.
        if (seatsProblem) {
          e.preventDefault();
          seatsRef.current?.focus();
        }
      }}
    >
      {HIDDEN_FIELDS.map(name => (
        <input key={name} type="hidden" name={name} value={stay[name]} />
      ))}
      {idempotencyKey && <input type="hidden" name="idempotencyKey" value={idempotencyKey} />}

      {state.error && (
        <div ref={alertRef} tabIndex={-1} role="alert" className="flex flex-col gap-2 rounded-card border border-danger-line bg-danger-bg p-4 text-danger md:p-5">
          {unavailable ? (
            <>
              <p className="font-bold">{fr.booking.unavailableTitle}</p>
              <p>{errorMessage(state.error)}</p>
              {state.fullNights && state.fullNights.length > 0 && <p>{fr.booking.fullNights(state.fullNights.map(formatDay).join(", "))}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href={links.results} className="btn-secondary px-4 text-[15px]">
                  {fr.booking.seeOtherParkings}
                </Link>
                <Link href={links.parking} className="btn-secondary px-4 text-[15px]">
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
                <Link href={links.parking} className="link inline-flex min-h-11 items-center self-start md:min-h-0">
                  {fr.booking.changeDates}
                </Link>
              )}
            </>
          )}
        </div>
      )}

      <section className={sectionClass} aria-labelledby="b-infos">
        <h2 id="b-infos" className={sectionTitle}>
          {!online && <span className="text-soft">1.</span>} {fr.booking.yourDetails}
        </h2>
        {/* Two short fields that belong together: side by side, on a phone too. */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <label htmlFor="b-customerFirstName" className="label">
              {fr.booking.firstName}
            </label>
            <input
              {...field("customerFirstName")}
              aria-invalid={firstNameError ? true : undefined}
              aria-describedby={firstNameError ? "b-customerFirstName-error" : undefined}
              type="text"
              required
              maxLength={60}
              autoComplete="given-name"
              autoCapitalize="words"
              spellCheck={false}
              defaultValue={v.customerFirstName}
              className="field"
            />
            <FieldError id="b-customerFirstName-error" code={firstNameError} />
          </div>
          <div className="min-w-0">
            <label htmlFor="b-customerLastName" className="label">
              {fr.booking.lastName}
            </label>
            <input
              {...field("customerLastName")}
              type="text"
              required
              maxLength={60}
              autoComplete="family-name"
              autoCapitalize="words"
              spellCheck={false}
              defaultValue={v.customerLastName}
              className="field"
            />
            <FieldError id="b-customerLastName-error" code={f.customerLastName} />
          </div>
        </div>
        {/* Phone and email each on their own row: the email keeps the whole width, as before the name split. */}
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
        <div>
          <label htmlFor="b-customerEmail" className="label">
            {fr.booking.email}
          </label>
          <input {...field("customerEmail")} type="email" required maxLength={254} autoComplete="email" defaultValue={v.customerEmail} className="field" />
          <FieldError id="b-customerEmail-error" code={f.customerEmail} />
        </div>
        {/* The car and the trip: the plate with the passengers beside it, then the two flights. */}
        <div className={`grid grid-cols-[minmax(0,1fr)_104px] gap-3 sm:grid-cols-[minmax(0,1fr)_140px] md:grid-cols-[minmax(0,320px)_140px] ${group}`}>
          <div className="min-w-0">
            <label htmlFor="b-plate" className="label">
              {fr.booking.plate}
            </label>
            <PlateInput id="b-plate" name="plate" defaultValue={v.plate} invalid={!!f.plate} describedBy={f.plate ? "b-plate-error" : undefined} />
            <FieldError id="b-plate-error" code={f.plate} />
          </div>
          <div className="min-w-0">
            <label htmlFor="b-passengers" className="label">
              {fr.booking.passengers}
            </label>
            <select {...field("passengers")} value={passengers} onChange={e => setPassengers(e.target.value)} className="field">
              {Array.from({ length: 9 }, (_, i) => String(i + 1)).map(n => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <FieldError id="b-passengers-error" code={f.passengers} />
          </div>
        </div>
        {/* Child seats for the shuttle (24/10/2026, direction B « par âge »). */}
        <div ref={seatsRef} tabIndex={-1} className="-mt-1 flex flex-col gap-1.5 outline-none" data-testid="child-seats">
          <div className={`rounded-field border px-3.5 py-3 ${seatsError ? "border-danger" : "border-line"}`}>
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-10 flex-none items-center justify-center rounded-field bg-tint text-ink">
                <ChildSeatIcon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p id="b-childSeats-title" className="text-[15px] font-bold leading-snug">
                  {fr.booking.childSeats.title}
                </p>
                <p className="text-[13px] leading-snug text-soft">{fr.booking.childSeats.subtitle}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={seatsOn}
                aria-labelledby="b-childSeats-title"
                aria-describedby={seatsError ? "b-childSeats-error" : "b-childSeats-hint"}
                onClick={() => setSeatsOn(on => !on)}
                className="-mr-1 flex h-11 w-14 flex-none cursor-pointer items-center justify-center"
              >
                <span className={`relative block h-7 w-12 rounded-full transition-colors ${seatsOn ? "bg-accent" : "bg-line"}`}>
                  <span className={`absolute top-0.5 block size-6 rounded-full bg-white shadow-pin transition-transform ${seatsOn ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                </span>
              </button>
            </div>
            {seatsOn && (
              <div className="mt-2 border-t border-line-soft">
                <ChildSeatSteppers value={seats} onChange={setSeats} idPrefix="b-childSeats" withFields />
              </div>
            )}
          </div>
          {seatsError ? (
            <FieldError id="b-childSeats-error" code={seatsError} />
          ) : (
            <p id="b-childSeats-hint" className="text-[13px] leading-snug text-soft">
              {fr.booking.childSeats.hint}
            </p>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 md:gap-3">
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
        </div>
        {/* E (06/10/2026): the vehicle (so the valet spots it) and a word for the parking. */}
        <p className={`text-[15px] font-bold ${group}`}>{fr.booking.vehicleTitle}</p>
        <div className="-mt-1 grid gap-4 md:grid-cols-2 md:gap-3">
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
        <label htmlFor="b-acceptTerms" className="flex min-h-11 cursor-pointer items-start gap-3 text-[14.5px] leading-normal">
          <input
            id="b-acceptTerms"
            name="acceptTerms"
            type="checkbox"
            required
            defaultChecked={v.acceptTerms === "on"}
            aria-invalid={f.acceptTerms ? true : undefined}
            aria-describedby={f.acceptTerms ? "b-acceptTerms-error" : undefined}
            className="mt-0.5 size-5 flex-none cursor-pointer accent-dark"
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

      <button type="submit" disabled={pending} aria-disabled={pending} className="btn-primary h-[54px] px-6 text-[17px]">
        {pending ? t.booking.submitting : t.booking.submit}
      </button>
      {online && (
        <p className="-mt-2 text-center text-[13px] font-medium text-soft">
          <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 inline-block align-[-2px]">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
          </svg>
          {fr.booking.paymentNext(total)}
        </p>
      )}
      <p className="text-center text-[13px] font-medium text-soft">{fr.booking.noAccount}</p>
    </form>
  );
}
