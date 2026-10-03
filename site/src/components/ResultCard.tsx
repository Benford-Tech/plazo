import Link from "next/link";
import { DemoBadge } from "./DemoBadge";
import { FactChips, ResultBadges } from "./Highlights";
import { Photo } from "./Photo";
import { fr } from "@/lib/fr";
import { type Badge, factChips, perDayLabel } from "@/lib/highlights";
import { formatEuros } from "@/lib/money";
import type { SearchResult } from "@/lib/types";

/**
 * One parking of the results (option A: horizontal card, total price on the right). With the map
 * shown it is `compact` (price under the text) and tied to its pill on the map: id "resultat-<slug>",
 * data-result-slug, and data-map-active while either is hovered or focused.
 */
export function ResultCard({
  result,
  href,
  highlighted,
  badges = [],
  headingLevel = 3,
  compact = false,
  noPosition = false,
}: {
  result: SearchResult;
  href: string;
  highlighted: boolean;
  /** "Le moins cher", "Navette la plus rapide" (computed over the displayed results). */
  badges?: Badge[];
  /** Level of the parking's title: 2 right under the page's h1 (results), 3 under a section's h2. */
  headingLevel?: 2 | 3;
  /** Narrow column next to the map. */
  compact?: boolean;
  /** The map is shown but this parking is not on it. */
  noPosition?: boolean;
}) {
  const Title = headingLevel === 2 ? "h2" : "h3";
  const bookable = result.available && result.priceCents !== null;
  return (
    <article
      id={`resultat-${result.slug}`}
      data-result-slug={result.slug}
      tabIndex={-1}
      aria-labelledby={`resultat-${result.slug}-titre`}
      className={`grid scroll-mt-4 overflow-hidden rounded-[16px] outline-none transition-shadow data-map-active:shadow-[0_0_0_3px_#ff8a3d,0_12px_30px_-16px_rgba(44,26,14,.5)] focus-visible:shadow-[0_0_0_3px_#ff8a3d] ${
        compact ? "sm:grid-cols-[150px_1fr]" : "md:grid-cols-[210px_1fr_190px]"
      } ${highlighted ? "border-2 border-accent" : "border border-line"} ${bookable ? "" : "opacity-60"}`}
    >
      <Photo src={result.photo} alt={result.title} className={`h-[110px] w-full ${compact ? "sm:h-full sm:min-h-[132px]" : "md:h-full md:min-h-[170px]"}`} />
      <div className={compact ? "flex min-w-0 flex-col" : "contents"}>
        <div className={`flex flex-col gap-1.5 px-4 pt-3 ${compact ? "sm:px-4 sm:pt-3.5" : "md:px-[18px] md:py-4"}`}>
          <ResultBadges badges={badges} />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Title id={`resultat-${result.slug}-titre`} className="font-title text-xl md:text-[22px]">
              {result.title}
            </Title>
            {result.isDemo && <DemoBadge />}
          </div>
          <FactChips chips={factChips(result)} className="mt-0.5" />
          {noPosition && <p className="text-[13px] text-soft">{fr.map.noPosition}</p>}
        </div>
        <div
          className={`flex items-center justify-between gap-3 px-4 pt-2 pb-4 ${
            compact ? "mt-auto" : "md:flex-col md:items-end md:justify-center md:gap-0.5 md:border-l md:border-line md:px-[18px] md:py-4 md:text-right"
          }`}
        >
          {bookable ? (
            <>
              <div className={compact ? "" : "md:text-right"}>
                <div className={`flex flex-wrap items-baseline gap-x-1.5 ${compact ? "" : "md:justify-end"}`}>
                  <span className={`text-[22px] font-bold ${compact ? "" : "md:text-[28px]"}`}>{formatEuros(result.priceCents!)}</span>
                  <span className="text-[13px] whitespace-nowrap text-soft">{perDayLabel(result.priceCents!, result.days)}</span>
                </div>
                <div className="text-[13px] text-soft">{fr.results.allIn(result.days)}</div>
              </div>
              <Link href={href} className={`btn-primary h-11 px-[18px] text-[15px] ${compact ? "" : "md:mt-1.5"}`}>
                {fr.results.seeAndBook}
                <span className="sr-only"> {result.title}</span>
              </Link>
            </>
          ) : (
            <div>
              <div className="font-bold text-soft">{result.priceCents === null ? fr.results.noPrice : fr.results.full}</div>
              <div className="text-[13px] text-soft">{result.priceCents === null ? fr.results.noPriceHint : fr.results.fullHint}</div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
