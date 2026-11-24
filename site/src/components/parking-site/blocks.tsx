import { BookingPageModule } from "@/components/booking-page/BookingPageModule";
import { TrustBand } from "@/components/Highlights";
import { Photo } from "@/components/Photo";
import { fr } from "@/lib/fr";
import { factsLine, trustTiles } from "@/lib/highlights";
import { mapsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { parkingFaq, priceRows } from "@/lib/parking-more";
import { hasPages, isRich, sitePath } from "@/lib/parking-site";
import type { ParkingResponse, ParkingSiteInfo, SiteBlock, SiteBlockKind } from "@/lib/types";

/**
 * The blocks of a parking's own site (22/11/2026, « le plus modulaire possible »): one component per kind, each fed by
 * what the parking already set in Plazo. A new kind is one more entry in BLOCKS; a block with nothing to say renders
 * nothing, and so does a kind this site does not know.
 */
export interface BlockContext {
  site: ParkingSiteInfo;
  data: ParkingResponse;
  /** One key per page shown, for the booking block (the same form sent twice returns the booking already made). */
  idempotencyKey: string;
}
type BlockProps = BlockContext & { block: SiteBlock };

const card = "rounded-[16px] border border-line bg-paper";
const heading = "font-title text-[22px] leading-tight md:text-[26px]";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="flex scroll-mt-20 flex-col gap-3">
      <h2 id={`${id}-titre`} className={heading}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Booking({ site, block, idempotencyKey }: BlockProps) {
  return (
    <Section id="reserver" title={block.title ?? fr.bookingPage.meta}>
      {site.bookable ? (
        <div className={`${card} p-4 md:p-5`}>
          <BookingPageModule page={site} idempotencyKey={idempotencyKey} embedded />
        </div>
      ) : (
        <p className={`${card} p-4 text-[15px] text-soft`}>{fr.parkingSite.bookingClosed}</p>
      )}
    </Section>
  );
}

function Highlights({ data, block }: BlockProps) {
  const tiles = trustTiles(data.parking, data.airport.code);
  const facts = factsLine(data.parking);
  if (tiles.length === 0 && !facts && !data.parking.description) return null;
  return (
    <Section id="essentiel" title={block.title ?? fr.highlights.bandLabel}>
      {data.parking.description && <p className="text-[15.5px] leading-relaxed whitespace-pre-line">{data.parking.description}</p>}
      <TrustBand tiles={tiles} />
      {facts && <p className="text-[14px] font-medium text-soft">{facts}</p>}
    </Section>
  );
}

function Steps({ data, block }: BlockProps) {
  const { parking, details, airport } = data;
  const more = fr.parkingMore;
  const shuttle = parking.services.includes("shuttle") && parking.shuttleMinutes;
  return (
    <Section id="deroulement" title={block.title ?? fr.parking.howItGoes}>
      <dl className={`${card} divide-y divide-line-soft`}>
        <div className="grid gap-1 p-4 sm:grid-cols-[96px_1fr] sm:gap-4 md:px-5">
          <dt className="eyebrow sm:pt-[5px]">{fr.parking.outbound}</dt>
          <dd className="flex flex-col gap-1 text-[15px] leading-relaxed">
            <span>{fr.parking.outboundText(shuttle ? parking.shuttleMinutes : null)}</span>
            {shuttle && parking.shuttleWaitMinutes != null && <span className="text-soft">{more.waitLine(parking.shuttleWaitMinutes)}</span>}
            {parking.services.includes("open_24h") && <span className="text-soft">{more.open24}</span>}
          </dd>
        </div>
        <div className="grid gap-1 p-4 sm:grid-cols-[96px_1fr] sm:gap-4 md:px-5">
          <dt className="eyebrow sm:pt-[5px]">{fr.parking.inbound}</dt>
          <dd className="flex flex-col gap-2 text-[15px] leading-relaxed">
            <span>{fr.parking.inboundText}</span>
            {details?.meetingPoint && <span className="font-semibold">{more.meetingPoint(details.meetingPoint)}</span>}
            {details?.meetingInstructions && <span className="whitespace-pre-line text-soft">{details.meetingInstructions}</span>}
            {details?.meetingPhotoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={details.meetingPhotoUrl}
                alt={more.meetingPhotoAlt(details.meetingPoint ?? airport.name)}
                className="max-h-56 w-full rounded-field object-cover"
                loading="lazy"
              />
            )}
          </dd>
        </div>
      </dl>
    </Section>
  );
}

function Pricing({ data, block }: BlockProps) {
  const more = fr.parkingMore;
  const rows = priceRows(data.parking.pricing);
  if (rows.length === 0) return null;
  const extraDay = data.parking.pricing.extraDayPriceCents;
  return (
    <Section id="tarifs" title={block.title ?? more.prices}>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[300px] border-collapse text-[15px]">
          <thead>
            <tr className="text-left">
              <th scope="col" className="eyebrow border-b border-line-soft px-4 py-2.5 font-semibold md:px-5">
                {more.duration}
              </th>
              <th scope="col" className="eyebrow border-b border-line-soft px-4 py-2.5 text-right font-semibold md:px-5">
                {more.total}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {rows.map(row => (
              <tr key={row.days}>
                <td className="px-4 py-2.5 md:px-5">{more.days(row.days)}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums md:px-5">{formatEuros(row.priceCents)}</td>
              </tr>
            ))}
            {extraDay !== null && (
              <tr>
                <td className="px-4 py-2.5 md:px-5">{more.extraDay}</td>
                <td className="px-4 py-2.5 text-right font-semibold tabular-nums md:px-5">{formatEuros(extraDay)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[13.5px] text-soft">{more.pricesNote}</p>
    </Section>
  );
}

function Photos({ data, block }: BlockProps) {
  const photos = data.parking.photos.slice(0, 6);
  if (photos.length === 0) return null;
  return (
    <Section id="photos" title={block.title ?? fr.parkingSite.photos}>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        {photos.map((src, i) => (
          <Photo key={src} src={src} alt={fr.a11y.photoOf(data.parking.title, i + 1)} className="h-[120px] w-full rounded-field md:h-[180px]" />
        ))}
      </div>
    </Section>
  );
}

function Access({ data, block }: BlockProps) {
  const { parking, airport } = data;
  const destination = parking.address ?? `${parking.title}, ${airport.name}`;
  return (
    <Section id="acces" title={block.title ?? fr.parking.access}>
      <div className={`${card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5`}>
        <p className="text-[15px] font-medium">{parking.address ?? fr.parking.addressUnknown}</p>
        <a href={mapsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex-none">
          {fr.parking.openInMaps}
          <span className="sr-only"> {fr.a11y.opensNewTab}</span>
        </a>
      </div>
    </Section>
  );
}

function Services({ data, block }: BlockProps) {
  const more = fr.parkingMore;
  const extras = data.parking.extras?.offers ?? [];
  const stops = data.details?.stops ?? [];
  const shuttle = data.parking.services.includes("shuttle");
  if (extras.length === 0 && stops.length === 0 && !shuttle) return null;
  return (
    <Section id="services" title={block.title ?? more.servicesTitle}>
      <div className={`${card} flex flex-col gap-3 p-4 text-[15px] leading-relaxed md:px-5`}>
        {extras.length > 0 && (
          <ul className="flex flex-col gap-1">
            {extras.map(extra => (
              <li key={extra.label} className="flex justify-between gap-3">
                <span>{extra.label}</span>
                <span className="font-semibold tabular-nums">{formatEuros(extra.priceCents)}</span>
              </li>
            ))}
          </ul>
        )}
        {shuttle && <p>{more.childSeats}</p>}
        {stops.length > 0 && <p>{more.stops(stops.map(s => s.name).join(", "))}</p>}
      </div>
    </Section>
  );
}

function Conditions({ data, block }: BlockProps) {
  return (
    <Section id="conditions" title={block.title ?? fr.parkingSite.goodToKnow}>
      <div className={`${card} flex flex-col gap-2 p-4 text-[15px] leading-relaxed md:px-5`}>
        {data.details?.conditions && <p>{data.details.conditions}</p>}
        <p>{fr.cancellation[data.parking.cancellationPolicy]}</p>
      </div>
    </Section>
  );
}

function Faq({ data, block }: BlockProps) {
  const faq = parkingFaq(data);
  if (faq.length === 0) return null;
  return (
    <Section id="questions" title={block.title ?? fr.parkingMore.faqTitle(data.parking.title)}>
      <div className={`${card} divide-y divide-line-soft`}>
        {faq.map(([question, answer], i) => (
          <details key={question} open={i === 0} className="p-4 md:px-5">
            <summary className="cursor-pointer text-[15.5px] font-semibold">{question}</summary>
            <p className="mt-2 text-[15px] leading-relaxed text-soft">{answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Contact({ data, block }: BlockProps) {
  const { parking } = data;
  if (!parking.phone && !parking.address && !parking.openingHours) return null;
  return (
    <Section id="contact" title={block.title ?? fr.parkingSite.contact}>
      <div className={`${card} flex flex-col gap-2 p-4 text-[15px] md:px-5`}>
        {parking.phone && (
          <p className="flex flex-wrap items-center gap-3">
            <span className="font-semibold tabular-nums select-all">{parking.phone}</span>
            <a href={`tel:${parking.phone.replace(/[^+\d]/g, "")}`} className="btn-secondary btn-sm">
              {fr.parkingSite.call}
            </a>
          </p>
        )}
        {parking.address && <p>{parking.address}</p>}
        {parking.openingHours && <p className="text-soft">{parking.openingHours}</p>}
      </div>
    </Section>
  );
}

function Text({ block }: BlockProps) {
  if (!block.text) return null;
  const body = <p className="text-[15.5px] leading-relaxed whitespace-pre-line">{block.text}</p>;
  return block.title ? (
    <Section id={block.id} title={block.title}>
      {body}
    </Section>
  ) : (
    <section id={block.id}>{body}</section>
  );
}

const ICONS: Record<string, string> = {
  // A plane, a train, a pin: where the shuttle goes.
  airport: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5Z",
  station: "M12 2c-4 0-8 .5-8 4v9.5A3.5 3.5 0 0 0 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19a3.5 3.5 0 0 0 3.5-3.5V6c0-3.5-4-4-8-4ZM7.5 17a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3.5-7H6V6h5v4Zm2 0V6h5v4h-5Zm3.5 7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z",
  other: "M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z",
};

/** « Vos départs » (24/11/2026): one card per place the parking takes its travellers to; each opens its page when the site has pages. */
function Destinations({ site, block }: BlockProps) {
  const t = fr.parkingSite;
  const list = site.destinations ?? [];
  if (list.length === 0) return null;
  const band = isRich(site);
  const cards = (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map(d => (
        <li key={d.slug} className={`${card} flex flex-col items-center gap-2 p-5 text-center`}>
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-8 fill-[var(--ps-accent)]">
            <path d={ICONS[d.kind] ?? ICONS.other} />
          </svg>
          <h3 className="text-[15px] font-bold tracking-wide uppercase">{d.name}</h3>
          <p className="text-[14px] leading-relaxed text-soft">{t.destinationText[d.kind] ?? t.destinationText.other}</p>
          {hasPages(site) && (
            <a href={sitePath(site, d.slug)} className="mt-auto rounded-[10px] bg-[var(--ps-accent)] px-4 py-2 text-[14px] font-semibold text-[var(--ps-ink)] no-underline">
              {t.learnMore}
              <span className="sr-only"> : {d.name}</span>
            </a>
          )}
        </li>
      ))}
    </ul>
  );
  const title = block.title ?? t.destinationsTitle;
  if (!band) {
    return (
      <Section id="departs" title={title}>
        {cards}
      </Section>
    );
  }
  return (
    <section id="departs" aria-labelledby="departs-titre" className="scroll-mt-20 bg-[var(--ps-accent2)] py-10 text-[var(--ps-ink2)]">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-5 px-4 md:px-8">
        <h2 id="departs-titre" className={`${heading} text-center`}>
          {title}
        </h2>
        <div className="text-ink">{cards}</div>
      </div>
    </section>
  );
}

/** « Bande d'appel » (24/11/2026): one sentence and the button that leads to the booking. */
function Cta({ site, block }: BlockProps) {
  const t = fr.parkingSite;
  const band = isRich(site);
  return (
    <section className={`bg-[var(--ps-accent)] text-[var(--ps-ink)] ${band ? "py-10" : "rounded-[16px] py-8"}`}>
      <div className="mx-auto flex w-full max-w-[1040px] flex-col items-center gap-4 px-4 text-center md:px-8">
        <h2 className={heading}>{block.title ?? t.ctaTitle}</h2>
        <a href={sitePath(site, null, "#reserver")} className="rounded-[10px] bg-[var(--ps-accent2)] px-5 py-2.5 text-[15px] font-bold text-[var(--ps-ink2)] no-underline">
          {t.ctaButton}
        </a>
      </div>
    </section>
  );
}

/** Blocks that span the whole width in every look but the sober one. */
export const BAND_BLOCKS: readonly string[] = ["destinations", "cta"];

export const BLOCKS: Record<SiteBlockKind, (props: BlockProps) => React.ReactNode> = {
  booking: Booking,
  highlights: Highlights,
  steps: Steps,
  pricing: Pricing,
  photos: Photos,
  access: Access,
  services: Services,
  conditions: Conditions,
  faq: Faq,
  contact: Contact,
  text: Text,
  destinations: Destinations,
  cta: Cta,
};

/** The anchor and the menu label of a block; null: not in the menu. */
export function menuEntry(block: SiteBlock): { href: string; label: string } | null {
  const more = fr.parkingMore;
  const entries: Partial<Record<SiteBlockKind, [string, string]>> = {
    pricing: ["tarifs", more.prices],
    steps: ["deroulement", fr.parking.howItGoes],
    access: ["acces", fr.parking.access],
    contact: ["contact", fr.parkingSite.contact],
  };
  const entry = entries[block.kind as SiteBlockKind];
  return entry ? { href: `#${entry[0]}`, label: block.title ?? entry[1] } : null;
}

/** The blocks this site knows how to draw, in the manager's order. */
export const knownBlocks = (blocks: SiteBlock[]) => blocks.filter(b => b.enabled && b.kind in BLOCKS);
