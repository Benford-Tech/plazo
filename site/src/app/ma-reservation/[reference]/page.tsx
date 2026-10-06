import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CancelForm } from "@/components/CancelForm";
import { FlightForm } from "@/components/FlightForm";
import { LookupForm } from "@/components/LookupForm";
import { Plate } from "@/components/Plate";
import { ArrivalBlock } from "@/components/ArrivalBlock";
import { ReturnLive } from "@/components/ReturnLive";
import { StayShuttles } from "@/components/StayShuttles";
import { StatusBadge } from "@/components/StatusBadge";
import { api, ApiError } from "@/lib/api";
import { cancelAction, changeFlightAction, lookupAction } from "@/lib/actions";
import { formatDateTime, formatDateTimeAt, param } from "@/lib/dates";
import { paymentHref } from "@/lib/forms";
import { fr, texts } from "@/lib/fr";
import { directionsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { managePath as manageHrefFor, REFERENCE_RE } from "@/lib/manage-access";
import { manageTokenFor } from "@/lib/manage-session";
import { firstName, formatPhone, isFrenchMobile } from "@/lib/phone";
import type { PublicBooking, TravellerReturn } from "@/lib/types";

export const dynamic = "force-dynamic";

// Personal data: never indexed, never sent to another site as a Referer.
export const metadata: Metadata = {
  title: fr.meta.manageTitle,
  robots: { index: false, follow: false },
  referrer: "same-origin",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 text-[15px]">
      <dt className="text-soft">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

export default async function ManageBookingPage({ params, searchParams }: PageProps<"/ma-reservation/[reference]">) {
  const { reference } = await params;
  const query = await searchParams;
  // The key arrived once in the link and is kept in a cookie (see src/proxy.ts).
  const token = REFERENCE_RE.test(reference) ? await manageTokenFor(reference) : null;
  if (!token) redirect(`/ma-reservation?reference=${encodeURIComponent(reference.slice(0, 12))}`);

  let booking: PublicBooking | null = null;
  try {
    booking = await api.booking(reference, token);
  } catch (error) {
    if (!(error instanceof ApiError && (error.status === 404 || error.status === 400))) throw error;
  }

  if (!booking) {
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-6 md:py-12">
        <section className="flex flex-col gap-2.5 rounded-[22px] bg-white p-4 md:p-6">
          <h1 className="font-title text-2xl md:text-[30px]">{fr.manage.notFoundTitle}</h1>
          <p className="text-sm leading-snug text-soft">{fr.manage.notFoundText}</p>
          <LookupForm action={lookupAction} reference={reference.toUpperCase()} />
        </section>
      </main>
    );
  }

  const b = booking;
  const online = b.paymentMode === "online";
  const t = texts(online);
  // Back from Stripe's payment page (success_url).
  const returning = param(query, "paiement") === "retour";
  // Not paid yet, or the hold ended: the payment step says where things stand.
  if ((b.status === "pending_payment" && !returning) || (online && b.payment?.status === "expired")) redirect(paymentHref(b.reference));
  if (b.status === "pending_payment") {
    // Paid on Stripe, not confirmed yet (the API asks Stripe on every read): check again shortly.
    return (
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-8 md:py-12">
        <meta httpEquiv="refresh" content="3" />
        <section role="status" className="flex flex-col items-start gap-3 rounded-[22px] bg-white p-5 md:p-6">
          <span aria-hidden="true" className="size-8 animate-spin rounded-full border-[3px] border-lilac border-t-accent" />
          <h1 className="font-title text-[26px] md:text-[30px]">{fr.pay.verifyingTitle}</h1>
          <p className="text-soft">{fr.pay.verifyingText}</p>
          <a href={`${manageHrefFor(b.reference)}?paiement=retour`} className="btn-secondary h-11 px-5 text-[15px]">
            {fr.pay.refresh}
          </a>
        </section>
      </main>
    );
  }
  const confirmed = (param(query, "confirmee") === "1" || returning) && b.status === "upcoming";
  const total = b.priceCents === null ? null : formatEuros(b.priceCents);
  const until = b.cancellableUntil ? formatDateTimeAt(b.cancellableUntil) : null;
  const destination = b.parking.address ?? `${b.parking.title}, ${b.parking.airport.name}`;
  const calendarHref = `/ma-reservation/${encodeURIComponent(b.reference)}/agenda`;
  const active = b.status !== "cancelled" && b.status !== "no_show" && b.status !== "returned";
  const justCancelled = param(query, "annulee") === "1";
  const refunded = b.payment?.status === "refunded";
  const totalLabel =
    b.status === "cancelled"
      ? refunded
        ? fr.manage.refunded
        : fr.manage.nothingToPay
      : active || b.payment?.status === "paid"
        ? t.manage.toPayOnSite
        : fr.manage.stayPrice;
  const phone = b.parking.phone ? formatPhone(b.parking.phone) : null;
  const phoneLink = phone && (
    <a href={`tel:${b.parking.phone!.replace(/[^\d+]/g, "")}`} className="font-semibold whitespace-nowrap underline">
      {phone}
    </a>
  );
  const contactParking = phoneLink ? (
    <>
      {" "}
      {fr.manage.contactParkingPhone} {phoneLink}.
    </>
  ) : (
    ` ${fr.manage.contactParkingDesk}`
  );
  // The vehicle is at the parking: the live return block (the landing, the shuttle, the car's spot).
  const onSite = b.status === "arrived" || b.status === "shuttled_out" || b.status === "return_requested" || b.status === "back_at_parking";
  let returnState: TravellerReturn | null = null;
  if (onSite) {
    try {
      returnState = await api.returnState(b.reference, token);
    } catch {
      returnState = null;
    }
  }
  const steps: [string, string][] = [
    [fr.manage.step1Title, fr.manage.step1Text(b.parking.address, b.parking.shuttleMinutes)],
    [fr.manage.step2Title, t.manage.step2Text(total)],
    [fr.manage.step3Title, fr.manage.step3Text(b.returnFlight)],
  ];

  return (
    <>
      {confirmed ? (
        <section className="on-dark mx-auto w-full max-w-[720px] px-4 pt-6">
          <div className="flex flex-col gap-2.5 rounded-[22px] bg-hero px-5 pt-5 pb-6 text-white shadow-[0_18px_40px_-18px_rgba(255,102,0,.5)]">
            <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-full bg-white/20 text-2xl">
              ✓
            </span>
            <h1 className="font-title text-[32px] leading-tight md:text-[40px]">{fr.manage.confirmedTitle(firstName(b.customerName))}</h1>
            <p className="text-[15px] text-lilac">{fr.manage.confirmedText(b.customerEmail, isFrenchMobile(b.customerPhone) ? formatPhone(b.customerPhone) : null)}</p>
            <div className="mt-1.5 flex items-center justify-between rounded-[22px] bg-white px-3.5 py-3 text-ink">
              <span className="text-[13px] text-soft">{fr.manage.reference}</span>
              <b className="text-2xl tracking-[.08em]">{b.reference}</b>
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-[720px] px-4 pt-6">
          <h1 className="font-title text-[28px] md:text-[34px]">{fr.manage.title}</h1>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-[18px] px-4 py-[18px] md:pb-12">
        {onSite && <ReturnLive reference={b.reference} token={token} initial={returnState} />}
        {/* D (06/10/2026): the app's day-J gestures on the site — the blocks hide themselves outside their window. */}
        {active && <ArrivalBlock reference={b.reference} token={token} />}
        {active && <StayShuttles reference={b.reference} token={token} />}
        {b.status === "cancelled" && (
          <p role="status" className="rounded-[22px] bg-danger-bg p-4 font-semibold text-danger">
            {justCancelled ? (refunded ? t.manage.cancelledNow : fr.manage.cancelledNow) : refunded ? fr.manage.cancelledRefunded : fr.manage.cancelled}
          </p>
        )}

        <section aria-labelledby="recap" className="card px-4 py-4 md:px-[22px]">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recap" className="font-title text-[21px]">
              {b.parking.title}
            </h2>
            <StatusBadge status={b.status} />
          </div>
          <dl className="mt-1.5">
            {!confirmed && <Row label={fr.manage.reference}>{b.reference}</Row>}
            <Row label={fr.manage.dropOff}>{formatDateTime(b.arrivalAt)}</Row>
            <Row label={fr.manage.pickUp}>{formatDateTime(b.returnAt)}</Row>
            {b.departureFlight && (
              <Row label={fr.manage.outbound}>
                {b.departureFlight}
                {b.outbound?.status && <span className="font-normal text-soft"> · {fr.manage.outboundStatus[b.outbound.status] ?? b.outbound.status}</span>}
                {b.outbound?.shuttleAt && <span className="block font-normal text-soft">{fr.manage.outboundShuttle(b.outbound.shuttleAt.slice(11, 16))}</span>}
              </Row>
            )}
            <Row label={fr.manage.flight}>{b.returnFlight ?? <span className="font-normal text-soft">{fr.manage.noFlight}</span>}</Row>
            <Row label={fr.manage.vehicle}>
              <Plate plate={b.plate} size="sm" />
              {(b.vehicle?.model || b.vehicle?.colour) && <span className="block font-normal text-soft">{fr.manage.vehicleDetails(b.vehicle.model, b.vehicle.colour)}</span>}
            </Row>
            {b.customerNote && (
              <Row label={fr.manage.message}>
                <span className="font-normal">{b.customerNote}</span>
              </Row>
            )}
            <Row label={fr.manage.passengers}>{b.passengers}</Row>
            {total && (
              <Row label={totalLabel}>
                {b.status === "cancelled" && !refunded ? <s className="font-normal text-soft">{total}</s> : total}
              </Row>
            )}
          </dl>
          {b.status === "upcoming" && (
            <p className={`mt-2.5 text-[13px] font-semibold ${until ? "text-ok" : "text-soft"}`}>
              {until ? fr.manage.freeUntil(until) : fr.manage.nonRefundable}
            </p>
          )}
        </section>

        {b.status === "upcoming" && (
          <section aria-labelledby="jour-j" className="flex flex-col gap-3.5">
            <h2 id="jour-j" className="font-title text-[21px]">
              {fr.manage.dayTitle}
            </h2>
            <ol className="flex flex-col gap-3.5">
              {steps.map(([title, text], i) => (
                <li key={title} className="grid grid-cols-[30px_1fr] gap-2.5">
                  <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-tint font-bold text-accent">
                    {i + 1}
                  </span>
                  <div>
                    <b>{title}</b>
                    <p className="mt-0.5 text-sm leading-normal text-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {active && (
          <div className="flex flex-col gap-2.5">
            <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-primary h-[52px] text-base">
              {fr.manage.itinerary}
              <span className="sr-only"> {fr.a11y.opensNewTab}</span>
            </a>
            <div className="flex gap-2.5">
              <a href={calendarHref} className="btn-secondary h-12 flex-1 px-2 text-[15px]">
                {fr.manage.addToCalendar}
              </a>
              {confirmed && (
                <a href="#gerer" className="btn-secondary h-12 flex-1 px-2 text-[15px]">
                  {fr.manage.manageLink}
                </a>
              )}
            </div>
          </div>
        )}

        <div id="gerer" className="flex scroll-mt-4 flex-col gap-4">
          {active && (
            <section aria-labelledby="vol" className="flex flex-col gap-2.5 card px-4 py-3.5">
              <h2 id="vol" className="text-base font-bold">
                {fr.manage.flightTitle}
              </h2>
              {b.canEditFlight ? (
                <FlightForm action={changeFlightAction.bind(null, b.reference)} flight={b.returnFlight} outbound={b.departureFlight} />
              ) : (
                <p className="text-sm text-soft">{fr.manage.flightLocked}</p>
              )}
            </section>
          )}

          {b.status === "upcoming" && (
            <section aria-labelledby="annuler" className="flex flex-col gap-2 rounded-[22px] border border-danger-line px-4 py-3.5">
              <h2 id="annuler" className="text-base font-bold">
                {fr.manage.cancelTitle}
              </h2>
              {b.canCancel && until ? (
                <>
                  <p className="text-sm leading-normal">{t.manage.cancelText(until)}</p>
                  <CancelForm action={cancelAction.bind(null, b.reference)} confirmText={t.manage.cancelConfirmText} />
                </>
              ) : (
                <p className="text-sm leading-normal">
                  {until ? fr.manage.cancelClosed(until) : fr.manage.cancelNonRefundable}
                  {contactParking}
                </p>
              )}
            </section>
          )}
        </div>

        {b.status === "upcoming" && b.canCancel && until && <p className="text-center text-[13px] text-soft">{fr.manage.changeDates(until)}</p>}

        {active && phoneLink && (
          <p className="text-center text-[13px] text-soft">
            {fr.manage.dayQuestion(b.parking.title)} {phoneLink}
          </p>
        )}
      </main>
    </>
  );
}
