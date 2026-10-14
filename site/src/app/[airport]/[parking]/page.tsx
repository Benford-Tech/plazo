import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingCard } from "@/components/BookingCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DemoBadge } from "@/components/DemoBadge";
import { JsonLd } from "@/components/JsonLd";
import { TrustBand } from "@/components/Highlights";
import { Photo } from "@/components/Photo";
import { api, ApiError } from "@/lib/api";
import { stayFromParams, stayQuery, todayLocal, validateStay } from "@/lib/dates";
import { fr, serviceLabel, texts } from "@/lib/fr";
import { openGraph, parkingMetaDescription } from "@/lib/seo";
import { factsLine, perDayLabel, trustTiles } from "@/lib/highlights";
import { directionsUrl, mapsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { airportPath, siteUrl, SLUG_RE } from "@/lib/site";
import { breadcrumbLd, parkingLd } from "@/lib/structured-data";
import type { ParkingResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = PageProps<"/[airport]/[parking]">;

async function loadParking(airport: string, parking: string, arrivee?: string | null, retour?: string | null) {
  if (!SLUG_RE.test(airport) || !SLUG_RE.test(parking)) notFound();
  try {
    return await api.parking(airport, parking, arrivee, retour);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { airport, parking } = await params;
  const data = await loadParking(airport, parking);
  const title = fr.meta.parkingTitle(data.parking.title, data.airport.name);
  const description = parkingMetaDescription(data);
  const canonical = `/${data.airport.slug}/${data.parking.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    // A demo parking is fictional: shown on the site, never offered to search engines.
    ...(data.parking.isDemo ? { robots: { index: false, follow: true } } : {}),
    openGraph: openGraph({ title, description, url: canonical, ...(data.parking.photos[0] ? { images: [data.parking.photos[0]] } : {}) }),
  };
}

export default async function ParkingPage({ params, searchParams }: Props) {
  const { airport: airportSlug, parking: parkingSlug } = await params;
  const stay = stayFromParams(await searchParams);
  const hasDates = !!(stay.arrivee || stay.retour);
  let errors: { arrivalAt?: string; returnAt?: string } = hasDates ? validateStay(stay.arrivee, stay.retour) : {};
  const datesOk = hasDates && !errors.arrivalAt && !errors.returnAt;

  let data: ParkingResponse;
  try {
    data = await loadParking(airportSlug, parkingSlug, datesOk ? stay.arrivee : null, datesOk ? stay.retour : null);
  } catch (error) {
    if (!(error instanceof ApiError && error.code === "validation_failed")) throw error;
    errors = { arrivalAt: error.fields?.arrivalAt, returnAt: error.fields?.returnAt };
    data = await loadParking(airportSlug, parkingSlug);
  }
  const { airport, parking, offer } = data;
  // The price grid is not shown (03/10/2026): the price is computed for the dates. Only the cheapest
  // package gives the "dès …" line while no dates are chosen.
  const cheapest = [...parking.pricing.tiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
  const fromPriceCents = cheapest?.priceCents ?? null;
  const shuttle = parking.services.includes("shuttle") && parking.shuttleMinutes;
  const destination = parking.address ?? `${parking.title}, ${airport.name}`;
  const photos = parking.photos;
  const payment = parking.payment ?? "on_site";
  const t = texts(true);
  // Boutique: on a phone the total and « Réserver » ride in a bar at the bottom of the screen (the side card
  // carries them from md up). Only when the stay can be booked here: same rule as the booking card's button.
  const bookable = !!offer && offer.available && offer.priceCents !== null;
  const dock = bookable && payment !== "unavailable" ? { priceCents: offer.priceCents!, days: offer.days } : null;
  const section = "flex flex-col gap-3 border-t border-line pt-6 md:pt-[26px]";
  const sectionTitle = "font-title text-[22px] leading-tight md:text-[26px]";
  const photoClass = "size-full rounded-field md:rounded-card";

  // « L’essentiel » (14/10/2026): shuttle (live or not, ride, declared wait), outdoor or covered, keys, opening, cancellation.
  const tiles = trustTiles(parking, airport.code);
  const facts = factsLine(parking);

  return (
    <main
      className={`mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 pt-3 md:gap-6 md:px-12 md:pt-[26px] md:pb-12 ${dock ? "pb-0" : "pb-10"}`}
    >
      <JsonLd
        data={[
          parkingLd(siteUrl(), data, parkingMetaDescription(data)),
          parking.isDemo
            ? null
            : breadcrumbLd(siteUrl(), [
                { name: airport.name, path: airportPath(airport.slug) },
                { name: parking.title, path: `/${airport.slug}/${parking.slug}` },
              ]),
        ]}
      />
      <Breadcrumb
        items={[
          { label: airport.name, href: airportPath(airport.slug) },
          ...(offer ? [{ label: fr.nav.results, href: `/${airport.slug}/recherche${stayQuery(stay)}` }] : []),
          { label: parking.title },
        ]}
      />
      <div className="-mt-1 flex flex-col gap-1.5 md:mt-0 md:gap-2">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 md:justify-start md:gap-x-4">
          <h1 className="font-title text-[28px] leading-[1.1] md:text-[44px]">{parking.title}</h1>
          <span className="flex flex-wrap items-center gap-1.5">
            {parking.isDemo && <DemoBadge />}
            <span className="pill">{fr.highlights.newOnPlatform}</span>
          </span>
        </div>
        <p className="text-[14px] leading-snug font-medium text-soft md:text-[15.5px]">
          {parking.address && <>{parking.address} · </>}
          <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer" className="link">
            {fr.parking.itinerary}
            <span className="sr-only"> {fr.a11y.opensNewTab}</span>
          </a>
        </p>
      </div>

      {/* Mosaic: the main photo and two more beside it (one tall one with two photos); short on a phone so that the
          essentials and the booking card come up quickly. No photo: the cream « Photos à venir » ground. */}
      {photos.length >= 2 ? (
        <div className="grid grid-cols-[2fr_1fr] grid-rows-[78px_78px] gap-1.5 sm:grid-rows-[112px_112px] md:grid-rows-[170px_170px] md:gap-2.5">
          <Photo src={photos[0]} alt={fr.a11y.photoOf(parking.title, 1)} className={`row-span-2 ${photoClass}`} />
          <Photo src={photos[1]} alt={fr.a11y.photoOf(parking.title, 2)} className={`${photos.length === 2 ? "row-span-2" : ""} ${photoClass}`} />
          {photos.length >= 3 && <Photo src={photos[2]} alt={fr.a11y.photoOf(parking.title, 3)} className={photoClass} />}
        </div>
      ) : (
        <Photo
          src={photos[0]}
          alt={fr.a11y.photoOf(parking.title, 1)}
          className={`w-full rounded-field md:rounded-card ${photos[0] ? "h-[162px] sm:h-[230px] md:h-[300px]" : "h-[120px] md:h-[200px]"}`}
        />
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_340px] md:gap-x-10 md:gap-y-7 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-x-12">
        {/* « L’essentiel » is a caption, as in the mockup, not a heading: the band's list already carries that name. */}
        <div className="flex flex-col gap-2.5 md:col-start-1">
          {tiles.length > 0 && (
            <p aria-hidden="true" className="eyebrow">
              {fr.highlights.bandLabel}
            </p>
          )}
          <TrustBand tiles={tiles} />
          {facts && <p className="text-[13.5px] font-medium text-soft md:text-[15px]">{facts}</p>}
        </div>

        {/* On a phone the bar at the bottom carries « Réserver »: the card's own orange button would make two. */}
        <div className={`md:sticky md:top-6 md:col-start-2 md:row-span-6 md:row-start-1 md:self-start ${dock ? "max-md:[&_a.btn-primary]:hidden" : ""}`}>
          <BookingCard
            airportSlug={airport.slug}
            parkingSlug={parking.slug}
            stay={stay}
            offer={offer}
            fromPriceCents={fromPriceCents}
            fromDays={cheapest?.days ?? null}
            policy={parking.cancellationPolicy}
            minDate={todayLocal()}
            errors={errors}
            payment={payment}
            docked={!!dock}
            nightRule={parking.pricing.night}
          />
        </div>

        {(parking.description || parking.services.length > 0) && (
          <section className={`${section} md:col-start-1`} aria-labelledby="presentation">
            <h2 id="presentation" className={sectionTitle}>
              {fr.parking.presentation}
            </h2>
            {parking.description && <p className="text-[15.5px] leading-relaxed whitespace-pre-line md:text-base">{parking.description}</p>}
            {parking.services.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {parking.services.map(s => (
                  <li key={s} className="chip">
                    <CheckIcon />
                    {serviceLabel(s, true)}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className={`${section} md:col-start-1`} aria-labelledby="deroulement">
          <h2 id="deroulement" className={sectionTitle}>
            {fr.parking.howItGoes}
          </h2>
          <dl className="card divide-y divide-line-soft">
            <div className="grid gap-1 p-4 sm:grid-cols-[96px_1fr] sm:gap-4 md:px-5">
              <dt className="eyebrow sm:pt-[5px]">{fr.parking.outbound}</dt>
              <dd className="text-[15px] leading-relaxed">{fr.parking.outboundText(shuttle ? parking.shuttleMinutes : null)}</dd>
            </div>
            <div className="grid gap-1 p-4 sm:grid-cols-[96px_1fr] sm:gap-4 md:px-5">
              <dt className="eyebrow sm:pt-[5px]">{fr.parking.inbound}</dt>
              <dd className="text-[15px] leading-relaxed">{fr.parking.inboundText}</dd>
            </div>
          </dl>
        </section>

        <section className={`${section} md:col-start-1`} aria-labelledby="acces">
          <h2 id="acces" className={sectionTitle}>
            {fr.parking.access}
          </h2>
          {/* The address on a white card, like the other sections (no empty map ground above it). */}
          <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <p className="text-[15px] font-medium">{parking.address ?? fr.parking.addressUnknown}</p>
            <a href={mapsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm flex-none">
              {fr.parking.openInMaps}
              <span className="sr-only"> {fr.a11y.opensNewTab}</span>
            </a>
          </div>
        </section>
      </div>

      {dock && (
        // Sticky rather than fixed: it rides at the bottom of the screen while the page scrolls, then rests at the
        // end of the page content, so it never covers the last lines of the page nor the footer.
        <div className="dock sticky -mx-4 md:hidden">
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-[10.5px]">{t.parking.payOnSite}</p>
            <p className="text-[22px] leading-tight font-extrabold tracking-[-.01em] tabular-nums">{formatEuros(dock.priceCents)}</p>
            <p className="text-[11.5px] leading-snug font-semibold text-soft">
              {fr.parking.forStay(dock.days)} · {perDayLabel(dock.priceCents, dock.days)}
            </p>
          </div>
          <Link href={`/${airport.slug}/${parking.slug}/reserver${stayQuery(stay)}`} className="btn-primary h-12 flex-none px-[26px] text-base">
            {fr.parking.book}
          </Link>
        </div>
      )}
    </main>
  );
}

/** Check mark of a service chip: a small stroked pictogram instead of the « ✓ » glyph, warm grey like every chip icon. */
function CheckIcon() {
  return (
    <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
