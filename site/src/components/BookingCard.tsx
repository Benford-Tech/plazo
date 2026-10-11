import Link from "next/link";
import { StayFields } from "./StayFields";
import { cancellableUntil, formatDateTimeAt, stayQuery } from "@/lib/dates";
import { fr, fromPriceUnit, texts } from "@/lib/fr";
import { perDayLabel } from "@/lib/highlights";
import { formatEuros } from "@/lib/money";
import type { CancellationPolicy, Offer, ParkingPayment } from "@/lib/types";

/**
 * Booking card of a parking page: dates, availability, price lines and the "Book" button. Without
 * dates it asks for them. The date form is a GET form to /recherche (works without JavaScript).
 */
export function BookingCard({
  airportSlug,
  parkingSlug,
  stay,
  offer,
  fromPriceCents,
  fromDays,
  policy,
  minDate,
  errors,
  payment = "unavailable",
  docked = false,
}: {
  airportSlug: string;
  parkingSlug: string;
  stay: { arrivee: string | null; retour: string | null };
  offer: Offer | null;
  fromPriceCents: number | null;
  /** Days covered by the cheapest package. */
  fromDays?: number | null;
  policy: CancellationPolicy;
  minDate: string;
  errors: { arrivalAt?: string; returnAt?: string };
  /** "unavailable": payments are online but this parking cannot take them yet (no "Réserver"). */
  payment?: ParkingPayment;
  /**
   * The page shows the fixed bottom bar (« Total à payer en ligne · Réserver ») on phones: the big price at the top of
   * the card is then hidden under md, since the bar already carries it. The price lines and the total stay.
   */
  docked?: boolean;
}) {
  const t = texts(true);
  const bookable = !!offer && offer.available && offer.priceCents !== null;
  const until = bookable && stay.arrivee ? cancellableUntil(policy, stay.arrivee) : null;
  const query = stayQuery(stay);
  const line = "flex justify-between gap-3";

  return (
    <aside aria-labelledby="reserver-titre" className="card flex flex-col gap-4 p-4 md:p-[22px] md:shadow-float">
      <h2 id="reserver-titre" className="sr-only">
        {fr.parking.book}
      </h2>
      {offer && offer.priceCents !== null ? (
        <div className={docked ? "max-md:hidden" : undefined}>
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <b className="text-[28px] leading-none font-extrabold tracking-[-.01em] tabular-nums md:text-[30px]">{formatEuros(offer.priceCents)}</b>
            <span className="text-[14.5px] font-medium text-soft">{fr.parking.forStay(offer.days)}</span>
          </p>
          <p className="mt-1.5 text-[13px] text-soft tabular-nums">
            <b className="font-bold text-ink">{perDayLabel(offer.priceCents, offer.days)}</b>
          </p>
        </div>
      ) : (
        fromPriceCents !== null && (
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-[14.5px] font-medium text-soft">{fr.parking.from}</span>{" "}
            <b className="text-[28px] leading-none font-extrabold tracking-[-.01em] tabular-nums">{formatEuros(fromPriceCents)}</b>
            {fromDays ? <span className="text-[14.5px] font-medium text-soft"> {fromPriceUnit(fromDays)}</span> : null}
          </p>
        )
      )}

      <form action="/recherche" method="get" className="flex flex-col gap-3">
        <input type="hidden" name="aeroport" value={airportSlug} />
        <input type="hidden" name="parking" value={parkingSlug} />
        {!offer && <p className="text-[14.5px] leading-snug text-soft">{fr.parking.askDates}</p>}
        <StayFields idPrefix="fiche" arrivee={stay.arrivee} retour={stay.retour} minDate={minDate} errors={errors} compactLabels layout="card" />
        {offer ? (
          // Boutique: the availability as a soft state pill, « Mettre à jour » as a text action at its right (it wraps
          // under the pill, still on the right, when both do not fit). Still the GET form's submit: works without JavaScript.
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p role="status" className={`pill tracking-[.06em] whitespace-normal ${bookable ? "pill-ok" : "pill-danger"}`}>
              {bookable ? fr.parking.availableForDates : offer.priceCents === null ? fr.parking.noPriceForDates : fr.parking.fullForDates}
            </p>
            <button type="submit" className="link ml-auto inline-flex min-h-11 items-center text-[13.5px]">
              {fr.search.update}
            </button>
          </div>
        ) : (
          <button type="submit" className="btn-primary min-h-12 px-6 text-base">
            {fr.parking.checkDates}
          </button>
        )}
      </form>

      {bookable && (
        <>
          <dl className="flex flex-col gap-2 border-t border-line-soft pt-3.5 text-[14.5px] tabular-nums">
            <div className={line}>
              <dt className="text-soft">{fr.parking.packageLine(offer.days)}</dt>
              <dd>{formatEuros(offer.priceCents!)}</dd>
            </div>
            <div className={line}>
              <dt className="text-soft">{fr.parking.serviceFee}</dt>
              <dd>{formatEuros(0)}</dd>
            </div>
            <div className={`${line} mt-1 border-t border-line-soft pt-3 text-[17px] font-extrabold`}>
              <dt>{payment === "unavailable" ? fr.parking.total : t.parking.payOnSite}</dt>
              <dd>{formatEuros(offer.priceCents!)}</dd>
            </div>
          </dl>
          {payment === "unavailable" ? (
            <p className="rounded-field bg-tint px-3.5 py-3 text-center text-[14.5px] font-bold text-ink">{fr.parking.onlineSoon}</p>
          ) : (
            <Link href={`/${airportSlug}/${parkingSlug}/reserver${query}`} className="btn-primary min-h-[52px] px-6 text-[17px]">
              {fr.parking.book}
            </Link>
          )}
          <p className="flex items-start justify-center gap-1.5 text-center text-[13px] leading-snug font-medium text-soft">
            {until && <CheckIcon />}
            <span>{until ? fr.manage.freeUntil(formatDateTimeAt(until)) : fr.cancellation[policy]}</span>
          </p>
        </>
      )}

      {offer && !bookable && (
        <Link href={`/${airportSlug}/recherche${query}`} className="btn-secondary min-h-11 px-5 text-[15px]">
          {fr.parking.otherParkings}
        </Link>
      )}
    </aside>
  );
}

/** Small stroked check before the free-cancellation line (sage: a reassurance, not an action). */
function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px size-3.5 flex-none text-ok" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
