import Link from "next/link";
import { ArrowIcon, GuideBody, MEASURE } from "./AirportGuide";
import { Breadcrumb } from "./Breadcrumb";
import { JsonLd } from "./JsonLd";
import { ResultCard } from "./ResultCard";
import { SearchForm } from "./SearchForm";
import { ChevronIcon } from "./stay/pill";
import type { TopicGuide } from "@/lib/airport-guides";
import { longDate, stayQuery, todayLocal } from "@/lib/dates";
import { fr } from "@/lib/fr";
import { topicLinks } from "@/lib/guides";
import { airportPath, siteUrl } from "@/lib/site";
import { articleLd, breadcrumbLd, faqLd } from "@/lib/structured-data";
import type { AirportResponse, SearchResponse } from "@/lib/types";

/** The partner parkings a topic guide shows: real ones only, bookable for the stay, cheapest first. */
export function guidePartners(guide: Pick<TopicGuide, "partners">, preview: SearchResponse | null, listings: AirportResponse["listings"]) {
  const valets = new Set(listings.filter(l => l.services.includes("valet")).map(l => l.slug));
  return (preview?.results ?? [])
    .filter(r => !r.isDemo && r.available && r.priceCents !== null && (guide.partners.filter === "all" || valets.has(r.slug)))
    .sort((a, b) => a.priceCents! - b.priceCents!)
    .slice(0, 6);
}

/** 09/10/2026 (« fais les trois pages guide »): a topic guide of an airport, in the layout of the airport guide. */
export function TopicGuideView({
  airport,
  guide,
  path,
  stay,
  preview,
  listings,
}: {
  airport: AirportResponse["airport"];
  guide: TopicGuide;
  path: string;
  /** The stay the partners are priced for (prefilled in the search form). */
  stay: { arrivee: string; retour: string };
  preview: SearchResponse | null;
  listings: AirportResponse["listings"];
}) {
  const base = siteUrl();
  const partners = guidePartners(guide, preview, listings);
  const others = topicLinks(airport.slug).filter(t => t.href !== path);
  const sectionTitle = "font-title lining-nums text-[26px] leading-[1.15] text-ink md:text-[32px]";

  // Boutique (11/10/2026): the guide's editorial treatment (Playfair headings, a 65-character measure, hairlines),
  // around the search card and the partner cards shared with the rest of the site.
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-12 px-4 pt-4 pb-12 md:gap-16 md:px-12 md:pt-[26px] md:pb-16">
      <JsonLd
        data={[
          breadcrumbLd(base, [
            { name: airport.name, path: airportPath(airport.slug) },
            { name: guide.short, path },
          ]),
          articleLd(base, { title: guide.title, description: guide.metaDescription, path, published: guide.published, updated: guide.updated }),
          faqLd(guide.faq),
        ]}
      />
      <div className="flex flex-col gap-4 md:gap-5">
        <Breadcrumb items={[{ label: airport.name, href: airportPath(airport.slug) }, { label: guide.short }]} />
        <h1 className="font-title max-w-[19em] lining-nums text-[30px] leading-[1.12] text-ink md:text-[46px] md:leading-[1.08]">{guide.title}</h1>
        <p className="text-[13.5px] font-semibold text-soft">{fr.guide.updated(longDate(guide.updated))}</p>
        <p className={`${MEASURE} border-t border-line pt-5 text-[17px] leading-[1.65] md:text-[18.5px]`}>{guide.intro}</p>
      </div>

      <section aria-labelledby="vos-dates" className="flex flex-col gap-4">
        <h2 id="vos-dates" className={sectionTitle}>
          {fr.guide.searchTitle}
        </h2>
        <SearchForm airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={todayLocal()} idPrefix="guide" />
      </section>

      <section aria-labelledby="partenaires" className="flex flex-col gap-4">
        <h2 id="partenaires" className={sectionTitle}>
          {guide.partners.title}
        </h2>
        <p className={`${MEASURE} text-[16px] leading-[1.65] text-soft`}>{guide.partners.lead}</p>
        {partners.length === 0 ? (
          <p className="card p-5 text-soft">{guide.partners.empty}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3 md:gap-4">
              {partners.map((result, i) => (
                <li key={result.slug}>
                  <ResultCard result={result} href={`/${airport.slug}/${result.slug}${stayQuery(stay)}`} highlighted={i === 0} headingLevel={3} />
                </li>
              ))}
            </ul>
            <p>
              <Link href={`/${airport.slug}/recherche${stayQuery(stay)}`} className="link inline-flex min-h-11 items-center gap-1.5 text-[15px]">
                {fr.guide.seeAllResults}
                <ArrowIcon />
              </Link>
            </p>
          </>
        )}
      </section>

      <article>
        <GuideBody sections={guide.sections} level={2} />
      </article>

      {guide.faq.length > 0 && (
        <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-4 gap-6 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <h2 id="faq-title" className={sectionTitle}>
            {fr.guide.faqTitle}
          </h2>
          <div className="card divide-y divide-line-soft px-4 md:px-6">
            {guide.faq.map(([question, answer], i) => (
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
      )}

      <nav aria-labelledby="autres-guides" className="card px-5 pt-5 pb-2 md:px-6">
        <h2 id="autres-guides" className="eyebrow mb-1.5">
          {fr.guide.otherGuides}
        </h2>
        <ul className="divide-y divide-line-soft">
          {others.map(other => (
            <li key={other.slug}>
              <Link href={other.href} className="flex min-h-12 items-center justify-between gap-3 py-2 text-[15px] font-semibold text-ink hover:text-accent-dark">
                {other.short}
                <span className="text-mute">
                  <ChevronIcon direction="right" size={16} />
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link href={`${airportPath(airport.slug)}#guide`} className="flex min-h-12 items-center justify-between gap-3 py-2 text-[15px] font-semibold text-ink hover:text-accent-dark">
              {fr.guide.airportGuide(airport.name)}
              <span className="text-mute">
                <ChevronIcon direction="right" size={16} />
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
