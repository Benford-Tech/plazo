import Link from "next/link";
import { GuideSections, GuideToc } from "./AirportGuide";
import { Breadcrumb } from "./Breadcrumb";
import { JsonLd } from "./JsonLd";
import { ResultCard } from "./ResultCard";
import { SearchForm } from "./SearchForm";
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
  const sectionTitle = "font-title text-[26px] md:text-[32px]";

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 pt-4 pb-10 md:gap-10 md:px-12 md:pt-[26px] md:pb-12">
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
      <div className="flex flex-col gap-3">
        <Breadcrumb items={[{ label: airport.name, href: airportPath(airport.slug) }, { label: guide.short }]} />
        <h1 className="font-title text-[32px] leading-tight md:text-[46px]">{guide.title}</h1>
        <p className="text-sm text-soft">{fr.guide.updated(longDate(guide.updated))}</p>
        <p className="max-w-[860px] text-[17px] leading-relaxed md:text-lg">{guide.intro}</p>
      </div>

      <section aria-labelledby="vos-dates" className="flex flex-col gap-3">
        <h2 id="vos-dates" className={sectionTitle}>
          {fr.guide.searchTitle}
        </h2>
        <SearchForm airport={airport} arrivee={stay.arrivee} retour={stay.retour} minDate={todayLocal()} idPrefix="guide" />
      </section>

      <section aria-labelledby="partenaires" className="flex flex-col gap-4">
        <h2 id="partenaires" className={sectionTitle}>
          {guide.partners.title}
        </h2>
        <p className="max-w-[860px] leading-relaxed text-soft">{guide.partners.lead}</p>
        {partners.length === 0 ? (
          <p className="rounded-[22px] bg-white p-5 text-soft">{guide.partners.empty}</p>
        ) : (
          <>
            <ul className="flex flex-col gap-4">
              {partners.map((result, i) => (
                <li key={result.slug}>
                  <ResultCard result={result} href={`/${airport.slug}/${result.slug}${stayQuery(stay)}`} highlighted={i === 0} headingLevel={3} />
                </li>
              ))}
            </ul>
            <p>
              <Link href={`/${airport.slug}/recherche${stayQuery(stay)}`} className="font-semibold">
                {fr.guide.seeAllResults} →
              </Link>
            </p>
          </>
        )}
      </section>

      <div className="flex flex-wrap items-start gap-6 md:gap-10">
        <GuideToc sections={guide.sections} className="max-w-[340px] flex-[1_1_260px] md:sticky md:top-4" />
        <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <GuideSections sections={guide.sections} level={2} />
        </article>
      </div>

      {guide.faq.length > 0 && (
        <section id="faq" aria-labelledby="faq-title" className="grid scroll-mt-4 gap-6 md:grid-cols-[1fr_1.4fr] md:gap-12">
          <h2 id="faq-title" className={sectionTitle}>
            {fr.guide.faqTitle}
          </h2>
          <div>
            {guide.faq.map(([question, answer], i) => (
              <details key={question} open={i === 0} className="border-b border-line">
                <summary className="py-3 text-base font-semibold">{question}</summary>
                <p className="pb-3.5 text-[15px] leading-normal text-soft">{answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <nav aria-labelledby="autres-guides" className="flex flex-col gap-2 p-[22px] card">
        <h2 id="autres-guides" className="text-[13px] font-extrabold tracking-[.06em] text-soft uppercase">
          {fr.guide.otherGuides}
        </h2>
        <ul className="flex flex-col">
          {others.map(other => (
            <li key={other.slug}>
              <Link href={other.href} className="flex min-h-11 items-center font-semibold md:min-h-9">
                {other.short}
              </Link>
            </li>
          ))}
          <li>
            <Link href={`${airportPath(airport.slug)}#guide`} className="flex min-h-11 items-center font-semibold md:min-h-9">
              {fr.guide.airportGuide(airport.name)}
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
