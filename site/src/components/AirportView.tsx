import Link from "next/link";
import { notFound } from "next/navigation";
import { HomeHero } from "./HomeHero";
import { DemoBadge } from "./DemoBadge";
import { JsonLd } from "./JsonLd";
import { FactChips } from "./Highlights";
import { Photo } from "./Photo";
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

/** Airport page: hero (photo, search bar, reassurance), how it works, partner parkings, FAQ. Also the home page. */
export async function AirportView({ slug, showBreadcrumb }: { slug: string; showBreadcrumb: boolean }) {
  const { airport, listings, payments } = await loadAirport(slug);
  const t = texts(payments === "online");
  const stay = defaultStay();
  const faq = [...t.home.faq, ...(t.home.airportFaq[airport.slug] ?? [])];
  // T-A: the hero's map shows the parkings of the default stay and its best offer (the page works without it).
  let preview: SearchResponse | null = null;
  try {
    preview = await api.search(airport.slug, stay.arrivee, stay.retour);
  } catch {
    preview = null;
  }

  return (
    <>
      <JsonLd data={[parkingListLd(siteUrl(), { airport, listings }), faqLd(faq)]} />
      <HomeHero airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={todayLocal()} breadcrumb={showBreadcrumb} preview={preview} />

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-4 py-8 md:gap-12 md:px-12 md:py-12">
        <section aria-labelledby="comment" className="flex flex-col gap-4">
          <h2 id="comment" className="font-title text-[26px] md:text-[32px]">
            {fr.home.howTitle}
          </h2>
          <ol className="grid gap-3 md:grid-cols-3 md:gap-[18px]">
            {t.home.how.map(([title, text], i) => (
              <li key={title} className="flex flex-col overflow-hidden card">
                {/* I-A (03/10/2026): a photo per step (Pexels, free licence), the number as a badge over it. */}
                <div className="relative">
                  <picture>
                    <source srcSet={`/images/step-${STEP_PHOTOS[i]}.webp`} type="image/webp" />
                    <img src={`/images/step-${STEP_PHOTOS[i]}.jpg`} alt="" width={600} height={400} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover md:aspect-[2/1]" />
                  </picture>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-[22px] flex h-11 w-11 translate-y-1/2 items-center justify-center rounded-[12px] border-2 border-white bg-accent font-title text-[24px] leading-none text-white"
                  >
                    {i + 1}
                  </span>
                </div>
                <div className="flex flex-col gap-2 p-[22px] pt-8">
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="text-[15px] leading-normal text-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="parkings" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="parkings" className="font-title text-[26px] md:text-[32px]">
              {fr.home.partnersTitle(airport.name)}
            </h2>
            {listings.length > 0 && <span className="text-soft">{fr.home.partnersCount(listings.length)}</span>}
          </div>
          {listings.length === 0 ? (
            <p className="rounded-[22px] bg-white p-5 text-soft">{fr.home.noPartners(airport.name)}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {listings.map((listing, i) => (
                <li key={listing.slug}>
                  <article
                    className={`grid overflow-hidden rounded-[22px] bg-white shadow-[0_18px_40px_-22px_rgba(30,20,10,.35)] md:grid-cols-[260px_1fr] ${i === 0 ? "border-2 border-accent" : ""}`}
                  >
                    <Photo src={listing.photo} alt={listing.title} className="h-[140px] w-full md:h-full md:min-h-[190px]" />
                    <div className="flex flex-col gap-2 px-4 py-4 md:px-[22px] md:py-[18px]">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="font-title text-[22px] md:text-2xl">{listing.title}</h3>
                        {listing.isDemo && <DemoBadge />}
                      </div>
                      <FactChips chips={factChips(listing)} />
                      {listing.openingHours && <p className="text-[15px]">Horaires : {listing.openingHours}</p>}
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
                        {listing.fromPriceCents !== null ? (
                          <span className="text-[15px] text-soft">
                            {fr.home.from} <b className="text-2xl text-ink">{formatEuros(listing.fromPriceCents)}</b>
                            {listing.fromDays ? ` ${fromPriceUnit(listing.fromDays)}` : null}
                          </span>
                        ) : (
                          <span />
                        )}
                        <Link href={`/${airport.slug}/${listing.slug}`} className="btn-primary h-[46px] px-[22px] text-[15px]">
                          {fr.home.seeParking}
                          <span className="sr-only"> {listing.title}</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
          <p className="rounded-[22px] bg-white px-[18px] py-3.5 text-[15px] text-soft">
            {fr.home.ownerCallout}{" "}
            <a href={PRO_SIGNUP_PATH} className="font-semibold">
              {fr.home.ownerJoin}
            </a>{" "}
            : {fr.home.ownerPitch}
          </p>
        </section>

        <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-4 gap-6 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <div>
            <h2 id="faq-title" className="font-title mb-3 text-[26px] md:text-[32px]">
              {fr.home.faqTitle}
            </h2>
            <p className="leading-relaxed text-soft">{fr.home.faqLead(airport.name)}</p>
          </div>
          <div>
            {faq.map(([question, answer], i) => (
              <details key={question} open={i === 0} className="border-b border-line">
                <summary className="py-3 text-base font-semibold">{question}</summary>
                <p className="pb-3.5 text-[15px] leading-normal text-soft">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
