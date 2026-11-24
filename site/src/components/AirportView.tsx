import { notFound } from "next/navigation";
import { AirportGuide } from "./AirportGuide";
import { currentLocale } from "@/lib/i18n/runtime";
import { AirportLiveProvider } from "./AirportLive";
import { HomeHero } from "./HomeHero";
import { JsonLd } from "./JsonLd";
import { PartnerList } from "./PartnerList";
import { ChevronIcon } from "./stay/pill";
import { airportGuide, guideFacts } from "@/lib/airport-guides";
import { api, ApiError } from "@/lib/api";
import { defaultStay, todayLocal } from "@/lib/dates";
import { fr, texts } from "@/lib/fr";
import { PRO_SIGNUP_PATH, siteUrl } from "@/lib/site";
import { faqLd, parkingListLd } from "@/lib/structured-data";
import type { AirportResponse, SearchResponse } from "@/lib/types";

export async function loadAirport(slug: string): Promise<AirportResponse> {
  try {
    return await api.airport(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

/**
 * Airport page: hero (dark band, search bar, live map), partner parkings beside how it works, guide, FAQ. Also the home page.
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
  // The guide is written in French only for now (13/11/2026): the other languages show neither it nor its questions.
  const guide = currentLocale() === "fr" ? airportGuide(airport.slug, guideFacts(listings, preview)) : null;
  const faq = [...t.home.faq, ...(guide?.faq ?? [])];

  // One poll of the airport's live shuttles for the page (14/10/2026): the hero's map and the partners' live rails share it.
  return (
    <AirportLiveProvider slug={airport.slug}>
      <JsonLd data={[parkingListLd(siteUrl(), { airport, listings }), faqLd(faq)]} />
      <HomeHero airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={todayLocal()} breadcrumb={showBreadcrumb} preview={preview} />

      <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-10 px-4 py-8 md:gap-12 md:px-12 md:py-12">
        {/* Direction A (24/11/2026): the parkings first, « Comment ça marche » in a column beside them (under them on a phone). */}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_270px] lg:gap-8">
          <section aria-labelledby="parkings" className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="parkings" className="font-title text-[26px] leading-tight md:text-[34px]">
                {fr.home.partnersTitle(airport.name)}
              </h2>
              {listings.length > 0 && <span className="text-[14px] font-semibold text-soft">{fr.home.partnersCount(listings.length)}</span>}
            </div>
            {listings.length === 0 ? (
              <p className="card p-5 text-soft">{fr.home.noPartners(airport.name)}</p>
            ) : (
              <PartnerList airport={{ slug: airport.slug, code: airport.code }} listings={listings} />
            )}
            <p className="card px-5 py-4 text-[14.5px] leading-relaxed text-soft">
              <b className="font-bold text-ink">{fr.home.ownerCallout}</b>{" "}
              <a href={PRO_SIGNUP_PATH} className="link">
                {fr.home.ownerJoin}
              </a>{" "}
              : {fr.home.ownerPitch}
            </p>
          </section>

          <aside aria-labelledby="comment" className="flex flex-col gap-2 self-start rounded-[16px] bg-tint p-3 lg:sticky lg:top-4">
            <h2 id="comment" className="eyebrow px-2 pt-1">
              {fr.home.howTitle}
            </h2>
            <ol className="flex flex-col gap-2">
              {t.home.how.map(([title, text], i) => (
                <li key={title} className={`flex flex-col gap-1 rounded-[12px] p-3.5 ${i === 1 ? "bg-dark text-white" : "bg-white"}`}>
                  <h3 className="text-[15.5px] leading-snug font-bold">
                    <span aria-hidden="true" className={i === 1 ? "text-lilac/70" : "text-soft"}>
                      {i + 1}.{" "}
                    </span>
                    {title}
                  </h3>
                  <p className={`text-[13.5px] leading-normal ${i === 1 ? "text-lilac/80" : "text-soft"}`}>{text}</p>
                </li>
              ))}
            </ol>
          </aside>
        </div>

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
    </AirportLiveProvider>
  );
}
