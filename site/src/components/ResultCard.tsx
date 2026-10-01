import Link from "next/link";
import { Photo } from "./Photo";
import { fr } from "@/lib/fr";
import { isFreeCancellation, listingFacts } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import type { SearchResult } from "@/lib/types";

/** One parking of the results (option A: horizontal card, total price on the right). */
export function ResultCard({
  result,
  href,
  highlighted,
  badge,
  headingLevel = 3,
}: {
  result: SearchResult;
  href: string;
  highlighted: boolean;
  badge?: string | null;
  /** Level of the parking's title: 2 right under the page's h1 (results), 3 under a section's h2. */
  headingLevel?: 2 | 3;
}) {
  const Title = headingLevel === 2 ? "h2" : "h3";
  const bookable = result.available && result.priceCents !== null;
  return (
    <article
      className={`grid overflow-hidden rounded-[16px] md:grid-cols-[210px_1fr_190px] ${highlighted ? "border-2 border-accent" : "border border-line"} ${
        bookable ? "" : "opacity-60"
      }`}
    >
      <Photo src={result.photo} alt={result.title} className="h-[110px] w-full md:h-full md:min-h-[170px]" />
      <div className="flex flex-col gap-1.5 px-4 pt-3 md:px-[18px] md:py-4">
        {badge && <span className="self-start rounded-xl bg-accent px-2.5 py-1 text-xs font-bold text-white">{badge}</span>}
        <Title className="font-title text-xl md:text-[22px]">{result.title}</Title>
        <p className="text-sm text-soft">{listingFacts(result, false)}</p>
        {bookable && (
          <p className={`mt-auto pt-2 text-sm font-semibold ${isFreeCancellation(result.cancellationPolicy) ? "text-ok" : "text-soft"}`}>
            {fr.cancellation[result.cancellationPolicy]}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-4 md:flex-col md:items-end md:justify-center md:gap-0.5 md:border-l md:border-line md:px-[18px] md:py-4 md:text-right">
        {bookable ? (
          <>
            <div className="md:text-right">
              <div className="text-[22px] font-bold md:text-[28px]">{formatEuros(result.priceCents!)}</div>
              <div className="text-[13px] text-soft">{fr.results.allIn(result.days)}</div>
            </div>
            <Link href={href} className="btn-primary h-11 px-[18px] text-[15px] md:mt-1.5">
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
    </article>
  );
}
