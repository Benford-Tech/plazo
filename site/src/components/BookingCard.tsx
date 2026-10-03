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
  payment = "on_site",
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
}) {
  const t = texts(payment !== "on_site");
  const bookable = !!offer && offer.available && offer.priceCents !== null;
  const until = bookable && stay.arrivee ? cancellableUntil(policy, stay.arrivee) : null;
  const query = stayQuery(stay);
  const line = "flex justify-between gap-3 text-[15px] text-soft";

  return (
    <aside
      aria-labelledby="reserver-titre"
      className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-white p-4 shadow-[0_20px_50px_-30px_rgba(75,22,76,.6)] md:p-[22px]"
    >
      <h2 id="reserver-titre" className="sr-only">
        {fr.parking.book}
      </h2>
      {offer && offer.priceCents !== null ? (
        <div>
          <b className="text-[28px] md:text-[30px]">{formatEuros(offer.priceCents)}</b>{" "}
          <span className="text-soft">{fr.parking.forStay(offer.days)}</span>
          <div className="text-[13px] text-soft">
            <b className="text-ink">{perDayLabel(offer.priceCents, offer.days)}</b>
          </div>
        </div>
      ) : (
        fromPriceCents !== null && (
          <div>
            <span className="text-soft">{fr.parking.from}</span> <b className="text-[28px]">{formatEuros(fromPriceCents)}</b>
            {fromDays ? <span className="text-soft"> {fromPriceUnit(fromDays)}</span> : null}
          </div>
        )
      )}

      <form action="/recherche" method="get" className="flex flex-col gap-3">
        <input type="hidden" name="aeroport" value={airportSlug} />
        <input type="hidden" name="parking" value={parkingSlug} />
        {!offer && <p className="text-[15px] text-soft">{fr.parking.askDates}</p>}
        <StayFields idPrefix="fiche" arrivee={stay.arrivee} retour={stay.retour} minDate={minDate} errors={errors} compactLabels layout="card" />
        <button type="submit" className={offer ? "btn-secondary h-11 px-4 text-[15px]" : "btn-primary h-12 px-6 text-base"}>
          {offer ? fr.search.update : fr.parking.checkDates}
        </button>
      </form>

      {offer && (
        <div
          role="status"
          className={`rounded-[14px] px-3 py-2.5 font-bold ${bookable ? "bg-ok-bg text-ok" : "bg-danger-bg text-danger"}`}
        >
          {bookable ? fr.parking.availableForDates : offer.priceCents === null ? fr.parking.noPriceForDates : fr.parking.fullForDates}
        </div>
      )}

      {bookable && (
        <>
          <div className={line}>
            <span>{fr.parking.packageLine(offer.days)}</span>
            <span>{formatEuros(offer.priceCents!)}</span>
          </div>
          <div className={line}>
            <span>{fr.parking.serviceFee}</span>
            <span>{formatEuros(0)}</span>
          </div>
          <div className="border-t border-line" />
          <div className="flex justify-between gap-3 text-lg font-bold">
            <span>{payment === "unavailable" ? fr.parking.total : t.parking.payOnSite}</span>
            <span>{formatEuros(offer.priceCents!)}</span>
          </div>
          {payment === "unavailable" ? (
            <p className="rounded-[14px] bg-tint px-3 py-3 text-center font-bold text-accent-dark">{fr.parking.onlineSoon}</p>
          ) : (
            <Link href={`/${airportSlug}/${parkingSlug}/reserver${query}`} className="btn-primary h-[54px] text-lg">
              {fr.parking.book}
            </Link>
          )}
          <p className="text-center text-[13px] text-soft">
            {until ? fr.manage.freeUntil(formatDateTimeAt(until)) : fr.cancellation[policy]}
          </p>
        </>
      )}

      {offer && !bookable && (
        <Link href={`/${airportSlug}/recherche${query}`} className="btn-secondary h-11 px-4 text-[15px]">
          {fr.parking.otherParkings}
        </Link>
      )}
    </aside>
  );
}
