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
import { cancellableUntil, formatDateTime, formatDateTimeAt, param, stayFromParams, stayQuery, validateStay } from "@/lib/dates";
import { EMPTY_FORM, type FormState } from "@/lib/forms";
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
  return {
    values: {
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerEmail: booking.customerEmail ?? "",
      plate: booking.plate,
      returnFlight: booking.returnFlight ?? "",
      passengers: String(booking.passengers),
      acceptTerms: "on",
    },
    fields: {},
    error: null,
  };
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
  const line = "flex justify-between gap-3 text-soft";

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pt-4 pb-10 md:px-12 md:pt-[26px] md:pb-12">
      <p className="text-sm">
        <Link href={parkingHref} className="inline-flex min-h-11 items-center underline md:min-h-8">
          {fr.booking.back}
        </Link>
      </p>
      {online && bookable && <BookingSteps current={1} />}
      <h1 className="font-title text-[30px] md:text-[40px]">{fr.booking.title}</h1>

      <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-10 lg:grid-cols-[1fr_380px]">
        <aside aria-labelledby="recap" className="self-start overflow-hidden rounded-[20px] border border-line md:col-start-2 md:row-start-1">
          <Photo src={parking.photo ?? parking.photos[0]} alt={parking.title} className="hidden h-[130px] w-full md:block" />
          <div className="flex flex-col gap-3 p-4 md:p-5">
            <h2 id="recap" className="font-title text-[22px]">
              {parking.title}
            </h2>
            <p className="text-[15px] leading-relaxed">
              {fr.booking.summaryDropOff} <b>{formatDateTime(arrivee)}</b>
              <br />
              {fr.booking.summaryPickUp} <b>{formatDateTime(retour)}</b>
            </p>
            <Link href={parkingHref} className="inline-flex min-h-11 items-center self-start text-sm font-semibold md:min-h-0">
              {fr.booking.modify}
            </Link>
            {bookable && (
              <>
                <div className="border-t border-line" />
                <div className={line}>
                  <span>{fr.parking.packageLine(offer.days)}</span>
                  <span>{formatEuros(offer.priceCents!)}</span>
                </div>
                <div className={line}>
                  <span>{fr.parking.serviceFee}</span>
                  <span>{formatEuros(0)}</span>
                </div>
                <div className="flex justify-between gap-3 text-lg font-bold">
                  <span>{t.booking.totalOnSite}</span>
                  <span>{formatEuros(offer.priceCents!)}</span>
                </div>
                <p
                  className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    isFreeCancellation(parking.cancellationPolicy) ? "bg-ok-bg text-ok" : "bg-tint text-soft"
                  }`}
                >
                  {until ? fr.manage.freeUntil(formatDateTimeAt(until)) : fr.cancellation[parking.cancellationPolicy]}
                </p>
              </>
            )}
          </div>
        </aside>

        <div className="md:col-start-1 md:row-start-1">
          {bookable && soon ? (
            <div role="status" className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-tint p-5">
              <h2 className="text-lg font-bold">{fr.parking.onlineSoon}</h2>
              <p className="text-soft">{fr.parking.onlineSoonHint}</p>
              <Link href={resultsHref} className="btn-secondary h-11 px-5 text-[15px]">
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
            <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] border border-danger-line bg-danger-bg p-5 text-danger">
              <h2 className="text-lg font-bold">{fr.booking.unavailableTitle}</h2>
              <p>{errorMessage(offer?.priceCents === null ? "no_price" : "overbooked")}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={resultsHref} className="btn-primary h-11 px-5 text-[15px]">
                  {fr.booking.seeOtherParkings}
                </Link>
                <Link href={parkingHref} className="btn-secondary h-11 px-5 text-[15px]">
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
