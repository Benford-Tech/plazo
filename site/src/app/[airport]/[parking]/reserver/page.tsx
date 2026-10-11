import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { BookingSteps } from "@/components/BookingSteps";
import { Photo } from "@/components/Photo";
import { api, ApiError } from "@/lib/api";
import { bookAction } from "@/lib/actions";
import { cancellableUntil, formatDateTimeAt, formatDay, param, stayFromParams, stayQuery, validateStay } from "@/lib/dates";
import { bookingFormValues, EMPTY_FORM, type FormState } from "@/lib/forms";
import { errorMessage, fr, texts } from "@/lib/fr";
import { isFreeCancellation } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { parseResumeCookie, RESUME_COOKIE } from "@/lib/manage-access";
import { SLUG_RE } from "@/lib/site";
import type { PublicBooking } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: fr.meta.bookingTitle, robots: { index: false, follow: false } };

/**
 * Back from the payment step ("Modifier" / "Recommencer", ?reprise=1): what the traveller typed, read
 * again from their booking (whose key the edit action left in a cookie for this form only).
 */
async function resumedValues(parkingSlug: string): Promise<FormState> {
  const resume = parseResumeCookie((await cookies()).get(RESUME_COOKIE)?.value);
  if (!resume) return EMPTY_FORM;
  let booking: PublicBooking;
  try {
    booking = await api.booking(resume.reference, resume.token);
  } catch {
    return EMPTY_FORM;
  }
  if (booking.parking.slug !== parkingSlug) return EMPTY_FORM;
  return { values: bookingFormValues(booking), fields: {}, error: null };
}

export default async function BookingPage({ params, searchParams }: PageProps<"/[airport]/[parking]/reserver">) {
  const { airport: airportSlug, parking: parkingSlug } = await params;
  if (!SLUG_RE.test(airportSlug) || !SLUG_RE.test(parkingSlug)) notFound();
  const query = await searchParams;
  const stay = stayFromParams(query);
  const parkingHref = `/${airportSlug}/${parkingSlug}${stayQuery(stay)}`;
  const errors = validateStay(stay.arrivee, stay.retour);
  // Dates are chosen on the parking page, which explains what is wrong with them.
  if (errors.arrivalAt || errors.returnAt) redirect(parkingHref);

  let data;
  try {
    data = await api.parking(airportSlug, parkingSlug, stay.arrivee, stay.retour);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.code === "validation_failed") redirect(parkingHref);
    throw error;
  }
  const { airport, parking, offer } = data;
  const online = parking.payment === "online";
  const soon = parking.payment === "unavailable";
  const t = texts(online);
  const initialState = online && param(query, "reprise") === "1" ? await resumedValues(parking.slug) : EMPTY_FORM;
  const arrivee = stay.arrivee!;
  const retour = stay.retour!;
  const resultsHref = `/${airport.slug}/recherche${stayQuery(stay)}`;
  const bookable = !!offer && offer.available && offer.priceCents !== null;
  const until = cancellableUntil(parking.cancellationPolicy, arrivee);
  const free = isFreeCancellation(parking.cancellationPolicy);
  const line = "flex justify-between gap-3 text-soft";
  // "2026-10-17T08:00": the day in words, the hour in the mono face of the hours.
  const when = (local: string) => (
    <>
      <span>{formatDay(local.slice(0, 10))}</span> <span className="font-hour text-[13.5px]">{local.slice(11, 16)}</span>
    </>
  );

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pt-3 pb-10 md:gap-5 md:px-12 md:pt-[26px] md:pb-12">
      <p className="text-[14px]">
        <Link href={parkingHref} className="link inline-flex min-h-11 items-center gap-1 md:min-h-8">
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
          {fr.booking.back}
        </Link>
      </p>
      {online && bookable && <BookingSteps current={1} />}
      <h1 className="font-title text-[30px] leading-tight md:text-[40px]">{fr.booking.title}</h1>

      <div className="grid gap-5 md:grid-cols-[1fr_340px] md:gap-10 lg:grid-cols-[1fr_380px]">
        <aside aria-labelledby="recap" className="card self-start overflow-hidden md:sticky md:top-6 md:col-start-2 md:row-start-1">
          <Photo src={parking.photo ?? parking.photos[0]} alt={parking.title} className="hidden h-[140px] w-full md:flex" />
          <div className="flex flex-col gap-3.5 p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 id="recap" className="pt-1.5 font-title text-[20px] leading-tight md:text-[22px]">
                {parking.title}
              </h2>
              <Link href={parkingHref} className="link inline-flex min-h-11 flex-none items-center text-[14px]">
                {fr.booking.modify}
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-2">
              <div className="rounded-field bg-tint px-3 py-2.5">
                <dt className="eyebrow">{fr.booking.summaryDropOff}</dt>
                <dd className="mt-1 text-[14.5px] leading-snug font-bold">{when(arrivee)}</dd>
              </div>
              <div className="rounded-field bg-tint px-3 py-2.5">
                <dt className="eyebrow">{fr.booking.summaryPickUp}</dt>
                <dd className="mt-1 text-[14.5px] leading-snug font-bold">{when(retour)}</dd>
              </div>
            </dl>
            {bookable && (
              <>
                <dl className="flex flex-col gap-2 border-t border-line-soft pt-3.5 text-[14.5px] font-medium">
                  <div className={line}>
                    <dt>{fr.parking.packageLine(offer.days)}</dt>
                    <dd className="tabular-nums">{formatEuros(offer.priceCents!)}</dd>
                  </div>
                  <div className={line}>
                    <dt>{fr.parking.serviceFee}</dt>
                    <dd className="tabular-nums">{formatEuros(0)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between gap-3 border-t border-line-soft pt-3 text-[18px] font-extrabold text-ink">
                    <dt>{t.booking.totalOnSite}</dt>
                    <dd className="tabular-nums">{formatEuros(offer.priceCents!)}</dd>
                  </div>
                </dl>
                <p className={`flex items-start gap-2 rounded-field px-3 py-2.5 text-[13.5px] font-semibold ${free ? "bg-ok-bg text-ok" : "bg-tint text-soft"}`}>
                  {free && (
                    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-none">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                  )}
                  <span>{until ? fr.manage.freeUntil(formatDateTimeAt(until)) : fr.cancellation[parking.cancellationPolicy]}</span>
                </p>
              </>
            )}
          </div>
        </aside>

        <div className="md:col-start-1 md:row-start-1">
          {bookable && soon ? (
            <div role="status" className="flex flex-col items-start gap-3 card p-5">
              <h2 className="text-lg font-bold">{fr.parking.onlineSoon}</h2>
              <p className="text-soft">{fr.parking.onlineSoonHint}</p>
              <Link href={resultsHref} className="btn-secondary px-5 text-[15px]">
                {fr.booking.seeOtherParkings}
              </Link>
            </div>
          ) : bookable ? (
            <BookingForm
              action={bookAction}
              stay={{ airport: airport.slug, parking: parking.slug, arrivalAt: arrivee, returnAt: retour }}
              total={formatEuros(offer.priceCents!)}
              links={{ results: resultsHref, parking: parkingHref }}
              idempotencyKey={randomUUID()}
              online={online}
              initialState={initialState}
            />
          ) : (
            <div role="alert" className="flex flex-col items-start gap-3 rounded-card border border-danger-line bg-danger-bg p-5 text-danger">
              <h2 className="text-lg font-bold">{fr.booking.unavailableTitle}</h2>
              <p>{errorMessage(offer?.priceCents === null ? "no_price" : "overbooked")}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={resultsHref} className="btn-primary px-5 text-[15px]">
                  {fr.booking.seeOtherParkings}
                </Link>
                <Link href={parkingHref} className="btn-secondary px-5 text-[15px]">
                  {fr.booking.changeDates}
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
