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
import { formatDay, formatDateTimeAt, param, parseLocal } from "@/lib/dates";
import { paymentHref } from "@/lib/forms";
import { fr, texts } from "@/lib/fr";
import { directionsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { chargedNightFee } from "@/lib/night-fees";
import { managePath as manageHrefFor, REFERENCE_RE } from "@/lib/manage-access";
import { manageTokenFor } from "@/lib/manage-session";
import { formatPhone, greetingName, isFrenchMobile } from "@/lib/phone";
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
    <div className="flex items-center justify-between gap-3 py-3 text-[15px]">
      <dt className="text-soft">{label}</dt>
      <dd className="text-right font-semibold">{children}</dd>
    </div>
  );
}

/** "jeu. 8 oct. · 06:30", the hour in JetBrains Mono (Boutique: hours only). */
function DateTime({ local }: { local: string }) {
  const parsed = parseLocal(local);
  if (!parsed) return <>{local}</>;
  return (
    <>
      {formatDay(parsed.date)} · <span className="font-hour">{parsed.time}</span>
    </>
  );
}

/** Small stroked check mark (replaces the « ✓ » glyph). */
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`flex-none ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** The lookup form under a title on the ivory ground (lookup page, unknown booking). */
function LookupShell({ title, lead, reference }: { title: string; lead: string; reference: string }) {
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">{title}</h1>
        <p className="text-[15px] leading-snug font-medium text-soft">{lead}</p>
      </div>
      <div className="card p-4 md:p-6">
        <LookupForm action={lookupAction} reference={reference} />
      </div>
    </main>
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
    return <LookupShell title={fr.manage.notFoundTitle} lead={fr.manage.notFoundText} reference={reference.toUpperCase()} />;
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
      <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
        <meta httpEquiv="refresh" content="3" />
        <section role="status" className="card flex flex-col items-start gap-3 p-5 md:p-7">
          <span aria-hidden="true" className="size-8 animate-spin rounded-full border-[3px] border-tint border-t-accent motion-reduce:animate-none" />
          <h1 className="font-title text-[26px] leading-[1.15] md:text-[32px]">{fr.pay.verifyingTitle}</h1>
          <p className="text-[15px] leading-snug text-soft">{fr.pay.verifyingText}</p>
          <a href={`${manageHrefFor(b.reference)}?paiement=retour`} className="btn-secondary min-h-11 px-5 text-[15px]">
            {fr.pay.refresh}
          </a>
        </section>
      </main>
    );
  }
  const confirmed = (param(query, "confirmee") === "1" || returning) && b.status === "upcoming";
  const total = b.priceCents === null ? null : formatEuros(b.priceCents);
  // The night fees charged at booking (frozen on the reservation), « dont 15,00 € de frais de nuit » under the amount.
  const nightFee = chargedNightFee(b.nightFee);
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
        <section className="on-dark mx-auto w-full max-w-[720px] px-4 pt-6 md:pt-10">
          {/* Boutique: the confirmation hero is espresso (bg-hero), the check in a sage disc, the reference on white. */}
          <div className="flex flex-col gap-3 rounded-card bg-hero px-5 pt-5 pb-5 text-white md:px-7 md:pt-7 md:pb-7">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-full bg-ok text-white">
              <CheckIcon className="size-6" />
            </span>
            <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">{fr.manage.confirmedTitle(greetingName(b))}</h1>
            <p className="text-[15px] leading-snug text-lilac/80">{fr.manage.confirmedText(b.customerEmail, isFrenchMobile(b.customerPhone) ? formatPhone(b.customerPhone) : null)}</p>
            <div className="mt-1 flex items-center justify-between gap-3 rounded-field bg-white px-4 py-3 text-ink">
              <span className="eyebrow">{fr.manage.reference}</span>
              <b className="text-[22px] font-extrabold tracking-[.1em]">{b.reference}</b>
            </div>
          </div>
        </section>
      ) : (
        <div className="mx-auto w-full max-w-[720px] px-4 pt-6 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">{fr.manage.title}</h1>
            <StatusBadge status={b.status} />
          </div>
          <p className="mt-2 text-[13.5px] leading-snug font-semibold text-soft">
            <span className="text-ink">{b.parking.title}</span> · {fr.manage.reference}{" "}
            <span className="font-extrabold tracking-[.08em] text-ink">{b.reference}</span>
            {active && (
              <>
                {" "}
                · {fr.manage.pickUp} {formatDay(b.returnAt.slice(0, 10))}
              </>
            )}
          </p>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-5 pb-12 md:gap-5 md:pb-20">
        {onSite && <ReturnLive reference={b.reference} token={token} initial={returnState} />}
        {/* D (06/10/2026): the app's day-J gestures on the site — the blocks hide themselves outside their window. */}
        {active && <ArrivalBlock reference={b.reference} token={token} />}
        {active && <StayShuttles reference={b.reference} token={token} />}
        {b.status === "cancelled" && (
          <p role="status" className="rounded-card border border-danger-line bg-danger-bg p-4 leading-snug font-semibold text-danger">
            {justCancelled ? (refunded ? t.manage.cancelledNow : fr.manage.cancelledNow) : refunded ? fr.manage.cancelledRefunded : fr.manage.cancelled}
          </p>
        )}

        <section aria-labelledby="recap" className="card px-4 pt-4 pb-3 md:px-6 md:pt-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recap" className="font-title text-[21px] leading-tight md:text-[23px]">
              {b.parking.title}
            </h2>
            {/* Outside the confirmation, the status sits next to the page title. */}
            {confirmed && <StatusBadge status={b.status} />}
          </div>
          <dl className="mt-1.5 divide-y divide-line-soft">
            <Row label={fr.manage.dropOff}>
              <DateTime local={b.arrivalAt} />
            </Row>
            <Row label={fr.manage.pickUp}>
              <DateTime local={b.returnAt} />
            </Row>
            {b.departureFlight && (
              <Row label={fr.manage.outbound}>
                {b.departureFlight}
                {b.outbound?.status && <span className="font-normal text-soft"> · {fr.manage.outboundStatus[b.outbound.status] ?? b.outbound.status}</span>}
                {b.outbound?.shuttleAt && <span className="block text-[13.5px] font-normal text-soft">{fr.manage.outboundShuttle(b.outbound.shuttleAt.slice(11, 16))}</span>}
              </Row>
            )}
            <Row label={fr.manage.flight}>{b.returnFlight ?? <span className="font-normal text-soft">{fr.manage.noFlight}</span>}</Row>
            <Row label={fr.manage.vehicle}>
              <Plate plate={b.plate} size="sm" />
              {(b.vehicle?.model || b.vehicle?.colour) && <span className="mt-1 block text-[13.5px] font-normal text-soft">{fr.manage.vehicleDetails(b.vehicle.model, b.vehicle.colour)}</span>}
            </Row>
            {b.customerNote && (
              <Row label={fr.manage.message}>
                <span className="font-normal">{b.customerNote}</span>
              </Row>
            )}
            <Row label={fr.manage.passengers}>{b.passengers}</Row>
            {total && (
              <Row label={totalLabel}>
                {b.status === "cancelled" && !refunded ? (
                  <s className="font-normal text-soft">{total}</s>
                ) : (
                  <>
                    <span className="font-extrabold tabular-nums">{total}</span>
                    {nightFee && (
                      <span className="mt-0.5 block text-[13px] font-medium text-soft tabular-nums">{fr.manage.nightFeeIncluded(formatEuros(nightFee.totalCents))}</span>
                    )}
                  </>
                )}
              </Row>
            )}
          </dl>
          {b.status === "upcoming" && (
            <p className={`flex items-start gap-1.5 border-t border-line-soft pt-3 pb-1 text-[13.5px] leading-snug font-semibold ${until ? "text-ok" : "text-danger"}`}>
              {until && <CheckIcon className="mt-0.5 size-4" />}
              <span>{until ? fr.manage.freeUntil(until) : fr.manage.nonRefundable}</span>
            </p>
          )}
        </section>

        {b.status === "upcoming" && (
          <section aria-labelledby="jour-j" className="flex flex-col gap-3">
            <h2 id="jour-j" className="font-title text-[22px] leading-tight md:text-[24px]">
              {fr.manage.dayTitle}
            </h2>
            <ol className="card divide-y divide-line-soft">
              {steps.map(([title, text], i) => (
                <li key={title} className="grid grid-cols-[28px_1fr] gap-3 p-4 md:px-6">
                  <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-tint text-[13px] font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <div>
                    <b className="text-[15px] leading-snug">{title}</b>
                    <p className="mt-0.5 text-sm leading-relaxed text-soft">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {active && (
          <div className="flex flex-col gap-2.5 md:flex-row">
            {/* One orange button per screen: on the return day the live blocks carry it, the route to the parking is secondary. */}
            <a
              href={directionsUrl(destination)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${onSite ? "btn-secondary" : "btn-primary"} min-h-[52px] px-6 text-center text-base md:min-h-12 md:flex-1 md:text-[15px]`}
            >
              {fr.manage.itinerary}
              <span className="sr-only"> {fr.a11y.opensNewTab}</span>
            </a>
            <div className="flex flex-col gap-2.5 sm:flex-row md:contents">
              <a href={calendarHref} className="btn-secondary min-h-12 flex-1 px-4 text-center text-[15px]">
                {fr.manage.addToCalendar}
              </a>
              {confirmed && (
                <a href="#gerer" className="btn-secondary min-h-12 flex-1 px-4 text-center text-[15px]">
                  {fr.manage.manageLink}
                </a>
              )}
            </div>
          </div>
        )}

        <div id="gerer" className="flex scroll-mt-4 flex-col gap-4 md:gap-5">
          {active && (
            <section aria-labelledby="vol" className="card flex flex-col gap-3 p-4 md:p-6">
              <h2 id="vol" className="text-base font-extrabold">
                {fr.manage.flightTitle}
              </h2>
              {b.canEditFlight ? (
                <FlightForm action={changeFlightAction.bind(null, b.reference)} flight={b.returnFlight} outbound={b.departureFlight} />
              ) : (
                <p className="text-sm leading-snug text-soft">{fr.manage.flightLocked}</p>
              )}
            </section>
          )}

          {b.status === "upcoming" && (
            <section aria-labelledby="annuler" className="card flex flex-col gap-2.5 border-danger-line p-4 md:p-6">
              <h2 id="annuler" className="text-base font-extrabold">
                {fr.manage.cancelTitle}
              </h2>
              {b.canCancel && until ? (
                <>
                  <p className="text-sm leading-relaxed">{t.manage.cancelText(until)}</p>
                  <CancelForm action={cancelAction.bind(null, b.reference)} confirmText={t.manage.cancelConfirmText} />
                </>
              ) : (
                <p className="text-sm leading-relaxed">
                  {until ? fr.manage.cancelClosed(until) : fr.manage.cancelNonRefundable}
                  {contactParking}
                </p>
              )}
            </section>
          )}
        </div>

        {b.status === "upcoming" && b.canCancel && until && <p className="text-center text-[13px] leading-snug text-soft">{fr.manage.changeDates(until)}</p>}

        {active && phoneLink && (
          <p className="text-center text-[13px] leading-snug text-soft">
            {fr.manage.dayQuestion(b.parking.title)} {phoneLink}
          </p>
        )}
      </main>
    </>
  );
}
