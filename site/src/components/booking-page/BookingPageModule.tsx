"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { bookOnBookingPage, nightsOnBookingPage, type PageBookingState, quoteOnBookingPage } from "@/lib/booking-page-actions";
import { addMonths, DROP_OFF_TIMES, HALF_HOURS, monthGrid, pick, type Range, RETURN_TIMES, selectable } from "@/lib/booking-calendar";
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

/** The browser's day, until the server gives the parking's: a past day is barred either way. */
function browserToday(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** « 12 déc. » */
function shortDay(day: string): string {
  const [, m, d] = day.split("-").map(Number);
  return `${d} ${fr.dates.months[m - 1]}`;
}

/**
 * Site du parking, niveau 3 (19/11/2026): Plazo's booking module on the parking's own site, at its colours.
 * 26/11/2026, direction B « Calendrier et trois étapes »: 1 Dates (a month calendar, the full nights barred, times in
 * pills, the price read as soon as both days are picked and kept in a bar), 2 Vous, 3 Paiement (Stripe's page in the
 * whole window: a payment page is never framed). No cookie: the payment's return carries the booking's key.
 */
export function BookingPageModule({
  page,
  idempotencyKey,
  embedded = false,
}: {
  page: BookingPageInfo;
  idempotencyKey: string;
  /** In a block of the parking's own site (22/11/2026): the site carries the title and the margins. */
  embedded?: boolean;
}) {
  const t = fr.bookingPage;
  useReportHeight(page.slug);
  const [today, setToday] = useState(browserToday);
  const [month, setMonth] = useState(() => browserToday().slice(0, 7));
  const [full, setFull] = useState<Record<string, string[]>>({});
  const [range, setRange] = useState<Range>({ from: null, to: null });
  const [dropTime, setDropTime] = useState("08:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [step, setStep] = useState<1 | 2>(1);
  const [passengers, setPassengers] = useState(1);
  // The last price read, with the stay it was read for: a changed stay shows nothing until its own price arrives.
  const [quoted, setQuoted] = useState<{ key: string; offer: Offer | null; error: string | null } | null>(null);
  const [quoting, startQuote] = useTransition();
  const [state, action, booking] = useActionState(bookOnBookingPage.bind(null, page.slug), EMPTY);

  // The full nights of the month shown (and the parking's own day), once per month.
  useEffect(() => {
    if (full[month]) return;
    let live = true;
    nightsOnBookingPage(page.slug, month).then(res => {
      if (!live) return;
      setFull(current => ({ ...current, [month]: res.full }));
      if (res.today) setToday(res.today);
    });
    return () => {
      live = false;
    };
  }, [page.slug, month, full]);

  const arrivalAt = range.from ? `${range.from}T${dropTime}` : "";
  const returnAt = range.to ? `${range.to}T${returnTime}` : "";

  // The price, read as soon as both days are picked and again on each change.
  const stayKey = arrivalAt && returnAt ? `${arrivalAt}|${returnAt}` : "";
  const offer = quoted && quoted.key === stayKey ? quoted.offer : null;
  const quoteError = quoted && quoted.key === stayKey ? quoted.error : null;
  useEffect(() => {
    if (!arrivalAt || !returnAt) return;
    let live = true;
    const timer = setTimeout(() => {
      startQuote(async () => {
        const res = await quoteOnBookingPage(page.slug, arrivalAt, returnAt);
        if (!live) return;
        setQuoted({ key: `${arrivalAt}|${returnAt}`, offer: res.offer, error: res.error });
      });
    }, 250);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [page.slug, arrivalAt, returnAt]);

  const fullSet = useMemo(() => new Set(Object.values(full).flat()), [full]);
  const weeks = useMemo(() => monthGrid(month), [month]);
  const firstMonth = today.slice(0, 7);
  const lastMonth = addMonths(firstMonth, 12);
  const [year, monthNumber] = month.split("-").map(Number);
  const weekdays = [1, 2, 3, 4, 5, 6, 0].map(i => fr.dates.weekdays[i]);

  const accent = { "--bp-accent": page.accent, "--bp-ink": page.accentInk } as React.CSSProperties;
  const button =
    "rounded-[12px] bg-[var(--bp-accent)] px-5 py-3 text-[15px] font-semibold text-[var(--bp-ink)] disabled:opacity-50";
  const input = "mt-1 w-full rounded-[10px] border border-line bg-paper px-3 py-2.5 text-[15px] text-ink";
  const pill = (on: boolean) =>
    `rounded-[8px] border px-2.5 py-1.5 font-mono text-[13px] ${
      on ? "border-[var(--bp-accent)] bg-[color-mix(in_srgb,var(--bp-accent)_12%,white)] font-bold text-ink" : "border-line bg-paper text-ink"
    }`;

  const bookable = !!offer?.available && offer.priceCents !== null;
  const total = offer?.priceCents != null ? formatEuros(offer.priceCents) : "";
  const stay = range.from && range.to ? `${shortDay(range.from)} → ${shortDay(range.to)}` : range.from ? shortDay(range.from) : "";
  const current = state.payUrl ? 3 : step;
  const fieldError = (name: string) =>
    state.fields[name] ? (
      <span role="alert" className="mt-1 block text-[13px] text-danger">
        {errorMessage(state.fields[name])}
      </span>
    ) : null;

  const timeChoice = (label: string, value: string, set: (v: string) => void, pills: string[], testId: string) => (
    <div role="group" aria-label={label}>
      <div className="mb-1.5 text-[12px] font-semibold text-soft">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {pills.map(time => (
          <button key={time} type="button" className={pill(value === time)} aria-pressed={value === time} onClick={() => set(time)} data-testid={`${testId}-${time}`}>
            {time}
          </button>
        ))}
        <select
          aria-label={`${label} · ${t.otherTime}`}
          className={`${pill(!pills.includes(value))} font-sans`}
          value={pills.includes(value) ? "" : value}
          onChange={e => e.target.value && set(e.target.value)}
          data-testid={`${testId}-other`}
        >
          <option value="">{t.otherTime}</option>
          {HALF_HOURS.map(time => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div style={accent} className={embedded ? "flex w-full flex-col gap-4 text-ink" : "mx-auto flex w-full max-w-[520px] flex-col gap-4 p-4 text-ink"}>
      {!embedded && <h1 className="text-[20px] font-semibold">{page.title}</h1>}

      <div className="overflow-hidden rounded-[16px] border border-line bg-paper">
        <ol className="grid grid-cols-3 border-b border-line text-center text-[13px]" data-testid="bp-steps">
          {t.steps.map((label, i) => (
            <li
              key={label}
              aria-current={current === i + 1 ? "step" : undefined}
              className={`px-2 py-3 ${current === i + 1 ? "border-b-[3px] border-[var(--bp-accent)] font-bold text-ink" : "font-semibold text-soft"}`}
            >
              {i + 1} · {label}
            </li>
          ))}
        </ol>

        {state.payUrl ? (
          <div className="flex flex-col gap-3 p-5" data-testid="bp-pay">
            <div className="flex justify-between text-[15px] font-semibold">
              <span>{stay}</span>
              <span className="font-mono">{total}</span>
            </div>
            <p className="text-[14px] text-soft">{t.held}</p>
            <a href={state.payUrl} target="_top" rel="noopener" className={`${button} text-center`}>
              {fr.pay.button(total)}
            </a>
            <p className="text-[13px] text-soft">{t.payNote}</p>
          </div>
        ) : step === 1 ? (
          <div className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                aria-label={t.prevMonth}
                className="h-10 w-10 rounded-[10px] border border-line text-[18px] disabled:opacity-30"
                disabled={month <= firstMonth}
                onClick={() => setMonth(addMonths(month, -1))}
              >
                ‹
              </button>
              <strong className="text-[16px] first-letter:uppercase" data-testid="bp-month">
                {fr.dates.longMonths[monthNumber - 1]} {year}
              </strong>
              <button
                type="button"
                aria-label={t.nextMonth}
                className="h-10 w-10 rounded-[10px] border border-line text-[18px] disabled:opacity-30"
                disabled={month >= lastMonth}
                onClick={() => setMonth(addMonths(month, 1))}
                data-testid="bp-next-month"
              >
                ›
              </button>
            </div>
            <table className="w-full table-fixed border-collapse text-center text-[14px]" data-testid="bp-calendar">
              <thead>
                <tr>
                  {weekdays.map(day => (
                    <th key={day} scope="col" className="pb-1 text-[12px] font-semibold uppercase text-soft">
                      {day.replace(/\.$/, "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, w) => (
                  <tr key={w}>
                    {week.map((day, d) => {
                      if (!day) return <td key={d} />;
                      const ends = day === range.from || day === range.to;
                      const inside = !!range.from && !!range.to && day > range.from && day < range.to;
                      const isFull = fullSet.has(day) && day >= today;
                      const can = selectable(range, day, today, fullSet);
                      return (
                        <td key={d} className={`p-0 py-0.5 ${inside ? "bg-[color-mix(in_srgb,var(--bp-accent)_12%,white)]" : ""}`}>
                          <button
                            type="button"
                            disabled={!can}
                            aria-pressed={ends}
                            aria-label={`${fr.dates.longDate(Number(day.slice(8)), fr.dates.longMonths[monthNumber - 1], year)}${isFull ? ` · ${t.full}` : ""}`}
                            onClick={() => {
                              setRange(r => pick(r, day));
                            }}
                            className={`h-10 w-full rounded-[10px] ${
                              ends ? "bg-[var(--bp-accent)] font-bold text-[var(--bp-ink)]" : "text-ink"
                            } disabled:cursor-not-allowed ${isFull ? "text-danger line-through" : "disabled:opacity-40"}`}
                            data-testid={`bp-day-${day}`}
                          >
                            {Number(day.slice(8))}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[12px] text-soft" aria-live="polite">
              {range.from && !range.to ? t.pickReturn : t.pickArrival} {fullSet.size ? t.fullDays : ""}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {timeChoice(t.dropTime, dropTime, setDropTime, DROP_OFF_TIMES, "bp-drop")}
              {timeChoice(t.returnTime, returnTime, setReturnTime, RETURN_TIMES, "bp-return")}
            </div>
            {offer && bookable && offer.nightFee ? (
              <div className="flex justify-between text-[14px] text-soft">
                <span>{t.nightFee}</span>
                <span className="font-mono">{formatEuros(offer.nightFee.totalCents)}</span>
              </div>
            ) : null}
            {offer && !bookable ? (
              <p role="alert" className="text-[14px] text-danger">
                {offer.priceCents === null && offer.available ? t.noPrice : t.full}
              </p>
            ) : null}
            {quoteError ? (
              <p role="alert" className="text-[14px] text-danger">
                {errorMessage(quoteError)}
              </p>
            ) : null}
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-3 p-5" noValidate>
            <div className="flex items-center justify-between rounded-[10px] bg-ground px-3 py-2.5 text-[14px]">
              <span>
                <strong>{stay}</strong> · {offer ? fr.pay.days(offer.days) : ""} · {total}
              </span>
              <button type="button" className="text-[13px] font-semibold underline" onClick={() => setStep(1)} data-testid="bp-edit">
                {t.edit}
              </button>
            </div>
            <input type="hidden" name="arrivalAt" value={arrivalAt} />
            <input type="hidden" name="returnAt" value={returnAt} />
            <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
            <input type="hidden" name="passengers" value={passengers} />
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
                <input name="plate" autoCapitalize="characters" className={`${input} font-mono`} defaultValue={state.values.plate} required />
                {fieldError("plate")}
              </label>
              <label className="text-[13px] font-semibold">
                {fr.booking.flight}
                <input name="returnFlight" autoCapitalize="characters" className={input} defaultValue={state.values.returnFlight} placeholder="TO 3627" />
                {fieldError("returnFlight")}
              </label>
            </div>
            <div className="flex items-center gap-3" role="group" aria-label={fr.booking.passengers}>
              <span className="text-[13px] font-semibold">{fr.booking.passengers}</span>
              <button type="button" aria-label={t.passengerLess} className="h-10 w-10 rounded-[10px] border border-line disabled:opacity-40" disabled={passengers <= 1} onClick={() => setPassengers(p => p - 1)}>
                −
              </button>
              <strong data-testid="bp-passengers">{passengers}</strong>
              <button type="button" aria-label={t.passengerMore} className="h-10 w-10 rounded-[10px] border border-line disabled:opacity-40" disabled={passengers >= 9} onClick={() => setPassengers(p => p + 1)}>
                +
              </button>
            </div>
            {fieldError("passengers")}
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
            {fieldError("arrivalAt")}
            {fieldError("returnAt")}
            {state.error && state.error !== "validation_failed" ? (
              <p role="alert" className="text-[14px] text-danger">
                {errorMessage(state.error)}
              </p>
            ) : null}
            <button type="submit" className={`${button} w-full`} disabled={booking} data-testid="bp-submit">
              {booking ? fr.booking.submitting : t.toPayment}
            </button>
          </form>
        )}

        {step === 1 && !state.payUrl ? (
          <div className="flex items-center justify-between gap-3 bg-[#1A1D23] px-5 py-3.5 text-white" data-testid="bp-bar">
            <div className="min-w-0">
              <div className="truncate text-[13px] opacity-75">
                {stay || t.pickArrival}
                {offer && bookable ? ` · ${fr.pay.days(offer.days)}` : ""}
              </div>
              <div className="font-mono text-[22px] font-bold" data-testid="bp-total">
                {quoting ? t.checking : bookable ? total : "—"}
              </div>
            </div>
            <button type="button" className={button} disabled={!bookable || quoting} onClick={() => setStep(2)} data-testid="bp-continue">
              {t.continue}
            </button>
          </div>
        ) : null}
      </div>
      <p className="text-center text-[12px] text-soft">{t.by}</p>
    </div>
  );
}
