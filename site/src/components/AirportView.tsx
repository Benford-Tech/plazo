import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "./Breadcrumb";
import { Photo } from "./Photo";
import { SearchForm } from "./SearchForm";
import { api, ApiError } from "@/lib/api";
import { defaultStay, todayLocal } from "@/lib/dates";
import { fr, fromPriceUnit } from "@/lib/fr";
import { listingFacts } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { PRO_LOGIN_PATH } from "@/lib/site";
import type { AirportResponse } from "@/lib/types";

export async function loadAirport(slug: string): Promise<AirportResponse> {
  try {
    return await api.airport(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/** Airport page: hero with the search bar, how it works, partner parkings, FAQ. Also the home page. */
export async function AirportView({ slug, showBreadcrumb }: { slug: string; showBreadcrumb: boolean }) {
  const { airport, listings } = await loadAirport(slug);
  const stay = defaultStay();
  const faq = [...fr.home.faq, ...(fr.home.airportFaq[airport.slug] ?? [])];

  return (
    <>
      <section className="on-dark bg-hero text-white">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 pt-6 pb-7 md:gap-[22px] md:px-12 md:pt-12 md:pb-12">
          {showBreadcrumb && <Breadcrumb onDark items={[{ label: fr.nav.home, href: "/" }, { label: airport.name }]} />}
          <h1 className="font-title max-w-[820px] text-[32px] leading-[1.1] md:text-[54px] md:leading-[1.05]">
            {fr.home.heroTitle(airport.name)}
          </h1>
          <p className="max-w-[720px] text-[15px] text-lilac md:text-lg">{fr.home.heroLead}</p>
          <SearchForm
            floating
            airport={airport}
            arrivee={stay.arrivee}
            retour={stay.retour}
            minDate={todayLocal()}
            idPrefix="accueil"
          />
          <ul className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-5 lg:grid-cols-4">
            {fr.home.trust.map(([title, text]) => (
              <li key={title} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="flex size-7 flex-none items-center justify-center rounded-full bg-white/15 font-bold">
                  ✓
                </span>
                <span className="text-[15px] leading-snug">
                  <b className="text-white">{title}</b>
                  <br />
                  <span className="text-lilac">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-4 py-8 md:gap-12 md:px-12 md:py-12">
        <section aria-labelledby="comment" className="flex flex-col gap-4">
          <h2 id="comment" className="font-title text-[26px] md:text-[32px]">
            {fr.home.howTitle}
          </h2>
          <ol className="grid gap-3 md:grid-cols-3 md:gap-[18px]">
            {fr.home.how.map(([title, text], i) => (
              <li key={title} className="flex flex-col gap-2.5 rounded-[16px] border border-line p-[22px]">
                <span aria-hidden="true" className="font-title text-[40px] leading-none text-accent">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-[15px] leading-normal text-soft">{text}</p>
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
            <p className="rounded-[16px] bg-tint p-5 text-soft">{fr.home.noPartners(airport.name)}</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {listings.map((listing, i) => (
                <li key={listing.slug}>
                  <article
                    className={`grid overflow-hidden rounded-[16px] md:grid-cols-[260px_1fr] ${i === 0 ? "border-2 border-accent" : "border border-line"}`}
                  >
                    <Photo src={listing.photo} alt={listing.title} className="h-[140px] w-full md:h-full md:min-h-[190px]" />
                    <div className="flex flex-col gap-2 px-4 py-4 md:px-[22px] md:py-[18px]">
                      <h3 className="font-title text-[22px] md:text-2xl">{listing.title}</h3>
                      <p className="text-[15px] text-soft">{listingFacts(listing)}</p>
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
          <p className="rounded-[16px] bg-tint px-[18px] py-3.5 text-[15px] text-soft">
            {fr.home.ownerCallout}{" "}
            <a href={PRO_LOGIN_PATH} className="font-semibold">
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
