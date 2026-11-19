"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { bookOnBookingPage, type PageBookingState, quoteOnBookingPage } from "@/lib/booking-page-actions";
import { errorMessage, fr } from "@/lib/fr";
import { formatEuros } from "@/lib/money";
import type { BookingPageInfo, Offer } from "@/lib/types";

const EMPTY: PageBookingState = { values: {}, fields: {}, error: null };

/** The page in an iframe tells the parking's site its height (embed.js sets the frame to it). */
function useReportHeight(slug: string) {
  useEffect(() => {
    if (window.parent === window) return;
    const send = () => window.parent.postMessage({ plazo: "height", slug, height: document.documentElement.scrollHeight }, "*");
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.body);
    return () => observer.disconnect();
  }, [slug]);
}

/**
 * Site du parking, niveau 3 (19/11/2026, choix « 2 et 3 »): Plazo's booking module on the parking's own site, at its
 * colours. Dates, price and places from Plazo, the traveller's details, then « Payer » opens Stripe's page in the whole
 * window (a payment page is never framed). No cookie: the payment's return carries the booking's key.
 */
export function BookingPageModule({ page, idempotencyKey }: { page: BookingPageInfo; idempotencyKey: string }) {
  const t = fr.bookingPage;
  useReportHeight(page.slug);
  const [arrivalAt, setArrivalAt] = useState("");
  const [returnAt, setReturnAt] = useState("");
  const [offer, setOffer] = useState<Offer | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoting, startQuote] = useTransition();
  const [state, action, booking] = useActionState(bookOnBookingPage.bind(null, page.slug), EMPTY);

  const accent = { "--bp-accent": page.accent, "--bp-ink": page.accentInk } as React.CSSProperties;
  const button = "w-full rounded-[10px] bg-[var(--bp-accent)] px-4 py-3 text-[15px] font-semibold text-[var(--bp-ink)] disabled:opacity-60";
  const input = "mt-1 w-full rounded-[10px] border border-line bg-paper px-3 py-2 text-[15px] text-ink";

  const quote = () => {
    setQuoteError(null);
    startQuote(async () => {
      const res = await quoteOnBookingPage(page.slug, arrivalAt, returnAt);
      setOffer(res.offer);
      setQuoteError(res.error);
    });
  };
  const bookable = !!offer?.available && offer.priceCents !== null;
  const total = offer?.priceCents != null ? formatEuros(offer.priceCents) : "";
  const fieldError = (name: string) =>
    state.fields[name] ? (
      <span role="alert" className="mt-1 block text-[13px] text-danger">
        {errorMessage(state.fields[name])}
      </span>
    ) : null;

  return (
    <div style={accent} className="mx-auto flex w-full max-w-[520px] flex-col gap-4 p-4 text-ink">
      <h1 className="text-[20px] font-semibold">{page.title}</h1>

      {state.payUrl ? (
        <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-paper p-4" data-testid="bp-pay">
          <div className="flex justify-between text-[15px] font-semibold">
            <span>{fr.pay.total}</span>
            <span className="font-mono">{total}</span>
          </div>
          <p className="text-[14px] text-soft">{t.held}</p>
          <a href={state.payUrl} target="_top" rel="noopener" className={`${button} text-center`}>
            {fr.pay.button(total)}
          </a>
          <p className="text-[13px] text-soft">{t.payNote}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-paper p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-[13px] font-semibold">
                {t.dropOff}
                <input
                  type="datetime-local"
                  className={input}
                  value={arrivalAt}
                  onChange={e => {
                    setArrivalAt(e.target.value);
                    setOffer(null);
                  }}
                  data-testid="bp-arrival"
                />
              </label>
              <label className="text-[13px] font-semibold">
                {t.pickUp}
                <input
                  type="datetime-local"
                  className={input}
                  value={returnAt}
                  min={arrivalAt || undefined}
                  onChange={e => {
                    setReturnAt(e.target.value);
                    setOffer(null);
                  }}
                  data-testid="bp-return"
                />
              </label>
            </div>
            {offer ? (
              bookable ? (
                <div className="flex flex-col gap-1 text-[15px]" data-testid="bp-offer">
                  <div className="flex justify-between">
                    <span>{fr.pay.days(offer.days)}</span>
                    <span className="font-mono">{formatEuros(offer.basePriceCents ?? offer.priceCents!)}</span>
                  </div>
                  {offer.nightFee ? (
                    <div className="flex justify-between text-soft">
                      <span>{fr.bookingPage.nightFee}</span>
                      <span className="font-mono">{formatEuros(offer.nightFee.totalCents)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-line pt-2 font-semibold">
                    <span>{fr.pay.total}</span>
                    <span className="font-mono">{total}</span>
                  </div>
                </div>
              ) : (
                <p role="alert" className="text-[14px] text-danger">
                  {offer.priceCents === null && offer.available ? t.noPrice : t.full}
                </p>
              )
            ) : (
              <button type="button" className={button} disabled={!arrivalAt || !returnAt || quoting} onClick={quote} data-testid="bp-quote">
                {quoting ? t.checking : t.seePrice}
              </button>
            )}
            {quoteError ? (
              <p role="alert" className="text-[14px] text-danger">
                {errorMessage(quoteError)}
              </p>
            ) : null}
          </div>

          {bookable ? (
            <form action={action} className="flex flex-col gap-3 rounded-[14px] border border-line bg-paper p-4" noValidate>
              <h2 className="text-[16px] font-semibold">{t.yourDetails}</h2>
              <input type="hidden" name="arrivalAt" value={arrivalAt} />
              <input type="hidden" name="returnAt" value={returnAt} />
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-[13px] font-semibold">
                  {fr.booking.firstName}
                  <input name="customerFirstName" autoComplete="given-name" className={input} defaultValue={state.values.customerFirstName} required />
                  {fieldError("customerFirstName")}
                </label>
                <label className="text-[13px] font-semibold">
                  {fr.booking.lastName}
                  <input name="customerLastName" autoComplete="family-name" className={input} defaultValue={state.values.customerLastName} required />
                  {fieldError("customerLastName")}
                </label>
              </div>
              <label className="text-[13px] font-semibold">
                {fr.booking.phone}
                <input name="customerPhone" type="tel" autoComplete="tel" className={input} defaultValue={state.values.customerPhone} required />
                {fieldError("customerPhone")}
              </label>
              <label className="text-[13px] font-semibold">
                {fr.booking.email}
                <input name="customerEmail" type="email" autoComplete="email" className={input} defaultValue={state.values.customerEmail} required />
                {fieldError("customerEmail")}
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-[13px] font-semibold">
                  {fr.booking.plate}
                  <input name="plate" autoCapitalize="characters" className={input} defaultValue={state.values.plate} required />
                  {fieldError("plate")}
                </label>
                <label className="text-[13px] font-semibold">
                  {fr.booking.passengers}
                  <select name="passengers" className={input} defaultValue={state.values.passengers || "1"}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  {fieldError("passengers")}
                </label>
              </div>
              <label className="text-[13px] font-semibold">
                {fr.booking.flight}
                <input name="returnFlight" autoCapitalize="characters" className={input} defaultValue={state.values.returnFlight} placeholder="TO 3627" />
                {fieldError("returnFlight")}
              </label>
              <label className="flex items-start gap-2 text-[13px]">
                <input type="checkbox" name="acceptTerms" className="mt-1 h-4 w-4" />
                <span>
                  {fr.booking.termsBefore}
                  <a href="/conditions" target="_blank" rel="noopener" className="underline">
                    {fr.booking.termsLink}
                  </a>
                  {fr.booking.termsAfter}
                </span>
              </label>
              {fieldError("acceptTerms")}
              {state.error && state.error !== "validation_failed" ? (
                <p role="alert" className="text-[14px] text-danger">
                  {errorMessage(state.error)}
                </p>
              ) : null}
              <button type="submit" className={button} disabled={booking} data-testid="bp-submit">
                {booking ? fr.booking.submitting : fr.booking.submit}
              </button>
            </form>
          ) : null}
        </>
      )}
      <p className="text-center text-[12px] text-soft">{t.by}</p>
    </div>
  );
}
