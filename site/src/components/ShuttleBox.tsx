import { FactIcon } from "./Highlights";
import { LiveShuttleRail } from "./LiveShuttleRail";
import { fr } from "@/lib/fr";
import type { ShuttleFacts } from "@/lib/highlights";
import type { LatLng } from "@/lib/types";

/**
 * Direction C (14/10/2026), the « encart navette » of a card: the minibus and « Navette gratuite », then the ride and the
 * declared average wait as two figures in JetBrains Mono (a figure without data is left out). For a parking whose
 * shuttles are shown live, the box carries the live rail (L3) under a hairline. Its card must be a `@container`: the
 * figures move next to the title and « ATTENTE » becomes « ATTENTE MOY. » from 32rem, unless `short` (the narrow card
 * of the column next to the map keeps the figures under the title and « ATTENTE »).
 */
export function ShuttleBox({
  facts,
  slug,
  airportSlug,
  airportCode,
  location = null,
  short = false,
}: {
  facts: ShuttleFacts;
  /** The parking's slug, to find its shuttles in the airport's live answer. */
  slug: string;
  airportSlug: string;
  airportCode?: string | null;
  /** The parking's entrance, when the live answer does not give it. */
  location?: LatLng | null;
  /** The narrow card's wording whatever its width. */
  short?: boolean;
}) {
  const t = fr.highlights.shuttleBox;
  const figure = "flex flex-col-reverse leading-[1.15]";
  const label = "text-[11px] font-bold tracking-[.04em] text-soft uppercase";
  // JetBrains Mono as loaded by the site (500, tabular), like the hours.
  const value = "font-hour text-[16px] text-ink";
  return (
    <div data-testid="shuttle-box" className="w-full rounded-field border border-line bg-paper px-3 py-[9px]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex min-w-0 items-center gap-2 text-[13.5px] font-extrabold text-ink [&_svg]:text-ok">
          <FactIcon icon="shuttle" size={16} />
          {t.title}
        </span>
        {(facts.rideMinutes !== null || facts.waitMinutes !== null) && (
          <dl className={`flex gap-4 ${short ? "" : "@lg:ml-auto"}`}>
            {facts.rideMinutes !== null && (
              <div className={figure} data-figure="ride">
                <dt className={label}>{t.ride}</dt>
                <dd className={value}>{t.minutes(facts.rideMinutes)}</dd>
              </div>
            )}
            {facts.waitMinutes !== null && (
              <div className={figure} data-figure="wait">
                <dt className={label}>
                  <span aria-hidden="true">
                    {short ? (
                      t.waitShort
                    ) : (
                      <>
                        <span className="@lg:hidden">{t.waitShort}</span>
                        <span className="hidden @lg:inline">{t.wait}</span>
                      </>
                    )}
                  </span>
                  <span className="sr-only">{t.waitFull}</span>
                </dt>
                <dd className={value}>{t.minutes(facts.waitMinutes)}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
      {facts.live && <LiveShuttleRail slug={slug} airportSlug={airportSlug} airportCode={airportCode} rideMinutes={facts.rideMinutes} location={location} />}
    </div>
  );
}
