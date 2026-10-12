import Link from "next/link";
import { DemoBadge } from "./DemoBadge";
import { FactChips } from "./Highlights";
import { Photo } from "./Photo";
import { fr } from "@/lib/fr";
import { type Badge, factChips, perDayLabel } from "@/lib/highlights";
import { formatEuros } from "@/lib/money";
import type { SearchResult } from "@/lib/types";

const BADGE_LABEL: Record<Badge, string> = { cheapest: fr.results.cheapest, fastestShuttle: fr.results.fastestShuttle };
/** « Le moins cher » in orange text on crème orangée; « Navette la plus rapide » neutral cream. */
const BADGE_TONE: Record<Badge, string> = { cheapest: "pill-hot", fastestShuttle: "" };

/**
 * One parking of the results (Boutique): a white card with a hairline, the photo on the left (« EN DIRECT » on it), the eyebrow pills,
 * the name in Playfair and the fact chips beside it; the price and « Voir et réserver » sit in a stub under them
 * while the card is narrow (phones, the column next to the map: `compact`), in a right-hand column once it is wide. The first result
 * (`highlighted`) floats, with an orange hairline and the only orange button; the others have an outlined button.
 * A parking without room stays legible: no faded card, a cream stub with a rose « Complet à ces dates » pill.
 * With the map shown it is tied to its pin on the map: id "resultat-<slug>", data-result-slug, and data-map-active
 * while either is hovered or focused.
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
  // « Complet à ces dates »: a solid cream stub (never a faded card); « Pas de tarif » keeps a white one.
  const full = !result.available && result.priceCents !== null;
  // The card lays itself out on its own width (container queries): photo 104 px with the price in a stub under it,
  // photo 150 px from 32rem, and from 42rem (outside the map's column) the price in a right-hand column.
  const wide = !compact;
  return (
    <article
      id={`resultat-${result.slug}`}
      data-result-slug={result.slug}
      tabIndex={-1}
      aria-labelledby={`resultat-${result.slug}-titre`}
      className={`card @container scroll-mt-4 overflow-hidden transition-[box-shadow,border-color] data-map-active:border-dark data-map-active:ring-1 data-map-active:ring-dark ${
        highlighted ? "border-accent-line shadow-float" : ""
      }`}
    >
      <div className={`grid grid-cols-[104px_minmax(0,1fr)] @lg:grid-cols-[150px_minmax(0,1fr)] ${wide ? "@2xl:grid-cols-[210px_minmax(0,1fr)_200px]" : ""}`}>
        <div className={`relative min-h-[120px] bg-tint @lg:min-h-[140px] ${wide ? "@2xl:min-h-[176px]" : ""}`}>
          <Photo src={result.photo} alt={result.title} className={`absolute inset-0 h-full w-full ${bookable ? "" : "grayscale"}`} />
          {result.liveShuttle && <LiveShuttlePill className="absolute top-1.5 left-1.5 @lg:top-2 @lg:left-2" />}
        </div>

        <div className={`flex min-w-0 flex-col items-start gap-2 py-3 pr-3 pl-3.5 @lg:py-3.5 @lg:pr-4 @lg:pl-4 ${wide ? "@2xl:py-[18px] @2xl:pl-5" : ""}`}>
          {badges.length > 0 && (
            <ul className="flex max-w-full flex-wrap gap-1.5">
              {badges.map(badge => (
                // May wrap on a 320 px screen (« Navette la plus rapide ») instead of running past the card.
                <li key={badge} data-badge={badge} className={`pill max-w-full whitespace-normal ${BADGE_TONE[badge]}`}>
                  {BADGE_LABEL[badge]}
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Title id={`resultat-${result.slug}-titre`} className={`font-title text-[19px] leading-[1.15] @lg:text-[21px] ${wide ? "@2xl:text-[23px]" : ""}`}>
              {result.title}
            </Title>
            {result.isDemo && <DemoBadge />}
          </div>
          <FactChips chips={factChips(result)} />
          {noPosition && <p className="text-[12.5px] font-semibold text-soft">{fr.map.noPosition}</p>}
        </div>

        <div
          className={`col-span-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-line-soft px-3.5 py-3 @lg:px-4 ${full ? "bg-tint" : ""} ${
            wide ? "@2xl:col-span-1 @2xl:flex-col @2xl:flex-nowrap @2xl:items-end @2xl:justify-center @2xl:gap-y-1 @2xl:border-t-0 @2xl:border-l @2xl:px-5 @2xl:py-[18px] @2xl:text-right" : ""
          }`}
        >
          {bookable ? (
            <>
              <div className="min-w-0">
                <p className={`flex flex-wrap items-baseline gap-x-1.5 ${wide ? "@2xl:justify-end" : ""}`}>
                  <span className={`text-[22px] leading-tight font-extrabold tracking-[-.01em] tabular-nums ${wide ? "@2xl:text-[27px]" : ""}`}>{formatEuros(result.priceCents!)}</span>
                  <span className="text-[12.5px] font-semibold whitespace-nowrap text-soft tabular-nums">{perDayLabel(result.priceCents!, result.days)}</span>
                </p>
                <p className="text-[12.5px] font-semibold text-soft">{fr.results.allIn(result.days)}</p>
              </div>
              <Link href={href} className={`${highlighted ? "btn-primary" : "btn-secondary"} btn-sm whitespace-nowrap ${wide ? "@2xl:mt-2 @2xl:w-full" : ""}`}>
                {fr.results.seeAndBook}
                <span className="sr-only"> {result.title}</span>
              </Link>
            </>
          ) : (
            <div className={`flex flex-col items-start gap-1 ${wide ? "@2xl:items-end" : ""}`}>
              {full ? <span className="pill pill-danger">{fr.results.full}</span> : <span className="text-[14px] font-bold">{fr.results.noPrice}</span>}
              <span className="text-[12.5px] font-semibold text-soft">{full ? fr.results.fullHint : fr.results.noPriceHint}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * R-B + I-C (07/10/2026): the paper pill « EN DIRECT » on the photo of a parking whose shuttles are followed live,
 * drawn like the day-J `LivePill` (ink capitals, breathing orange dot, the pins' shadow).
 */
export function LiveShuttlePill({ className = "" }: { className?: string }) {
  return (
    <span
      data-testid="live-shuttle"
      title={fr.results.liveTitle}
      className={`pill-float z-[1] min-h-[22px] gap-1.5 px-2 py-[3px] text-[9.5px] font-extrabold tracking-[.12em] uppercase ${className}`}
    >
      <span aria-hidden="true" className="live-dot" />
      {fr.results.live}
      <span className="sr-only"> : {fr.results.liveTitle}</span>
    </span>
  );
}
