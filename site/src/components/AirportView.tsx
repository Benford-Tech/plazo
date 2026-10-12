import Link from "next/link";
import { notFound } from "next/navigation";
import { AirportGuide } from "./AirportGuide";
import { HomeHero } from "./HomeHero";
import { DemoBadge } from "./DemoBadge";
import { JsonLd } from "./JsonLd";
import { FactChips } from "./Highlights";
import { Photo } from "./Photo";
import { ChevronIcon } from "./stay/pill";
import { airportGuide, guideFacts } from "@/lib/airport-guides";
import { api, ApiError } from "@/lib/api";
import { defaultStay, todayLocal } from "@/lib/dates";
import { fr, fromPriceUnit, texts } from "@/lib/fr";
import { factChips } from "@/lib/highlights";
import { formatEuros } from "@/lib/money";
import { PRO_SIGNUP_PATH, siteUrl } from "@/lib/site";
import { faqLd, parkingListLd } from "@/lib/structured-data";
import type { AirportResponse, SearchResponse } from "@/lib/types";

/** The step photos of the home (site/public/images/step-*.{jpg,webp}), in the order of fr.home.how. */
const STEP_PHOTOS = ["compare", "book", "fly"] as const;

export async function loadAirport(slug: string): Promise<AirportResponse> {
  try {
    return await api.airport(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/**
 * Airport page: hero (search card, reassurance, live map), how it works, partner parkings, FAQ. Also the home page.
 * Boutique (11/10/2026): hairline cards without shadow, Playfair titles, the parkings' « Voir le parking » in white
 * (the one orange button of the page is « Rechercher »), the questions in one card with a stroked chevron.
 */
export async function AirportView({ slug, showBreadcrumb }: { slug: string; showBreadcrumb: boolean }) {
  const { airport, listings, payments } = await loadAirport(slug);
  const t = texts(payments === "online");
  const stay = defaultStay();
  // T-A: the hero's map shows the parkings of the default stay and its best offer (the page works without it).
  let preview: SearchResponse | null = null;
  try {
    preview = await api.sharedSearch(airport.slug, stay.arrivee, stay.retour);
  } catch {
    preview = null;
  }
  // C-A: the airport's guide and its questions, in figures only from the real partners' live offers.
  const guide = airportGuide(airport.slug, guideFacts(listings, preview));
  const faq = [...t.home.faq, ...(guide?.faq ?? [])];

  return (
    <>
      <JsonLd data={[parkingListLd(siteUrl(), { airport, listings }), faqLd(faq)]} />
      <HomeHero airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={todayLocal()} breadcrumb={showBreadcrumb} preview={preview} />

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-4 py-8 md:gap-12 md:px-12 md:py-12">
        <section aria-labelledby="comment" className="flex flex-col gap-4">
          <h2 id="comment" className="font-title text-[26px] leading-tight md:text-[34px]">
            {fr.home.howTitle}
          </h2>
          <ol className="grid gap-3 md:grid-cols-3 md:gap-[18px]">
            {t.home.how.map(([title, text], i) => (
              <li key={title} className="card flex items-start gap-4 p-3 md:flex-col md:items-stretch md:gap-0 md:overflow-hidden md:p-0">
                {/* I-A (03/10/2026): a photo per step (Pexels, free licence), the number over it. Phones: a small photo beside the text. */}
                <div className="relative w-[92px] flex-none md:w-full">
                  <picture>
                    <source srcSet={`/images/step-${STEP_PHOTOS[i]}.webp`} type="image/webp" />
                    <img
                      src={`/images/step-${STEP_PHOTOS[i]}.jpg`}
                      alt=""
                      width={600}
                      height={400}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full rounded-field object-cover md:aspect-[2/1] md:rounded-none"
                    />
                  </picture>
                  <span
                    aria-hidden="true"
                    className="font-title absolute -right-2 -bottom-2 flex size-9 items-center justify-center rounded-full border border-line bg-paper text-[18px] leading-none text-ink md:right-auto md:bottom-0 md:left-6 md:size-11 md:translate-y-1/2 md:text-[21px]"
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="flex min-w-0 flex-col gap-1.5 py-1 md:gap-2 md:px-6 md:pt-9 md:pb-6">
                  <h3 className="font-title text-[19px] leading-snug md:text-[21px]">{title}</h3>
                  <p className="text-[14px] leading-normal text-soft md:text-[15px]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="parkings" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="parkings" className="font-title text-[26px] leading-tight md:text-[34px]">
              {fr.home.partnersTitle(airport.name)}
            </h2>
            {listings.length > 0 && <span className="text-[14px] font-semibold text-soft">{fr.home.partnersCount(listings.length)}</span>}
          </div>
          {listings.length === 0 ? (
            <p className="card p-5 text-soft">{fr.home.noPartners(airport.name)}</p>
          ) : (
            <ul className="flex flex-col gap-3 md:gap-4">
              {listings.map(listing => (
                <li key={listing.slug}>
                  {/* Phones: the photo beside the name and the facts, the price and the button below on the card's whole width. */}
                  <article className="card grid grid-cols-[96px_minmax(0,1fr)] overflow-hidden md:grid-cols-[260px_minmax(0,1fr)]">
                    <Photo src={listing.photo} alt={listing.title} className="h-full min-h-[120px] w-full md:row-span-2 md:min-h-[200px]" />
                    <div className="flex min-w-0 flex-col gap-2 px-3.5 pt-3 pb-3 md:px-6 md:pt-5 md:pb-2">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-title text-[19px] leading-snug md:text-[24px]">{listing.title}</h3>
                        {listing.isDemo && <DemoBadge />}
                      </div>
                      <FactChips chips={factChips(listing)} />
                      {listing.openingHours && <p className="text-[13.5px] font-medium text-soft md:text-[14.5px]">Horaires : {listing.openingHours}</p>}
                    </div>
                    <div className="col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-soft px-3.5 py-3 md:col-span-1 md:col-start-2 md:mx-6 md:px-0 md:py-4">
                      {listing.fromPriceCents !== null ? (
                        <span className="flex flex-col text-[13px] leading-tight font-semibold text-soft md:flex-row md:items-baseline md:gap-1.5">
                          <span>
                            {fr.home.from} <b className="text-[22px] font-extrabold tracking-[-.01em] text-ink tabular-nums">{formatEuros(listing.fromPriceCents)}</b>
                          </span>
                          {listing.fromDays ? <span> {fromPriceUnit(listing.fromDays)}</span> : null}
                        </span>
                      ) : (
                        <span />
                      )}
                      <Link href={`/${airport.slug}/${listing.slug}`} className="btn-secondary btn-sm">
                        {fr.home.seeParking}
                        <span className="sr-only"> {listing.title}</span>
                        <ChevronIcon direction="right" size={15} />
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          <p className="card px-5 py-4 text-[14.5px] leading-relaxed text-soft">
            <b className="font-bold text-ink">{fr.home.ownerCallout}</b>{" "}
            <a href={PRO_SIGNUP_PATH} className="link">
              {fr.home.ownerJoin}
            </a>{" "}
            : {fr.home.ownerPitch}
          </p>
        </section>

        {guide && <AirportGuide guide={guide} />}

        <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-4 gap-6 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <div>
            <h2 id="faq-title" className="font-title mb-3 text-[26px] leading-tight md:text-[34px]">
              {fr.home.faqTitle}
            </h2>
            <p className="leading-relaxed font-medium text-soft">{fr.home.faqLead(airport.name)}</p>
          </div>
          <div className="card divide-y divide-line-soft px-4 md:px-6">
            {faq.map(([question, answer], i) => (
              <details key={question} open={i === 0} className="group">
                <summary className="flex min-h-[52px] list-none items-center justify-between gap-4 py-3 text-[15.5px] leading-snug font-bold text-ink [&::-webkit-details-marker]:hidden">
                  {question}
                  <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full bg-tint text-soft transition-transform group-open:rotate-180">
                    <ChevronIcon direction="down" size={15} />
                  </span>
                </summary>
                <p className="-mt-1 pr-11 pb-4 text-[15px] leading-relaxed text-soft">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
