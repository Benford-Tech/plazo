import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingCard } from "@/components/BookingCard";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Photo } from "@/components/Photo";
import { api, ApiError } from "@/lib/api";
import { stayFromParams, stayQuery, todayLocal, validateStay } from "@/lib/dates";
import { fr, serviceLabel } from "@/lib/fr";
import { openGraph } from "@/lib/seo";
import { directionsUrl, formatKm, mapsUrl } from "@/lib/listing";
import { formatEuros } from "@/lib/money";
import { SLUG_RE } from "@/lib/site";
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
  const description = data.parking.description?.slice(0, 160) || fr.meta.parkingDescription(data.parking.title, data.airport.name);
  const canonical = `/${data.airport.slug}/${data.parking.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
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
  const tiers = parking.pricing.tiers;
  // Cheapest package, with the days it covers ("dès 15,00 € la journée").
  const cheapest = [...tiers].sort((a, b) => a.priceCents - b.priceCents || a.days - b.days)[0];
  const fromPriceCents = cheapest?.priceCents ?? null;
  const shuttle = parking.services.includes("shuttle") && parking.shuttleMinutes;
  const destination = parking.address ?? `${parking.title}, ${airport.name}`;
  const photos = parking.photos;
  const section = "flex flex-col gap-3 border-t border-line pt-[26px]";
  const sectionTitle = "font-title text-[24px] md:text-[26px]";

  const facts: [string, string][] = [];
  if (shuttle) facts.push([fr.parking.shuttle, fr.parking.shuttleValue(parking.shuttleMinutes!)]);
  if (parking.openingHours) facts.push([fr.parking.hours, parking.openingHours]);
  facts.push([
    fr.parking.parkingType,
    `${parking.services.includes("covered") ? fr.parking.covered : fr.parking.outdoor}${parking.services.includes("fenced") ? `, ${fr.parking.fenced}` : ""}`,
  ]);
  facts.push([fr.parking.cancellation, fr.cancellationShort[parking.cancellationPolicy]]);

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-4 pt-4 pb-10 md:gap-[22px] md:px-12 md:pt-[26px] md:pb-12">
      <Breadcrumb
        items={[
          { label: airport.name, href: `/${airport.slug}` },
          ...(offer ? [{ label: fr.nav.results, href: `/${airport.slug}/recherche${stayQuery(stay)}` }] : []),
          { label: parking.title },
        ]}
      />
      <div>
        <h1 className="font-title text-[30px] leading-tight md:text-[44px]">{parking.title}</h1>
        <p className="mt-1.5 text-[15px] text-soft md:text-base">
          {parking.address && <>{parking.address} · </>}
          {parking.distanceKm !== null && <>{fr.parking.kmFromTerminals(formatKm(parking.distanceKm))} · </>}
          <a href={directionsUrl(destination)} target="_blank" rel="noopener noreferrer">
            {fr.parking.itinerary}
            <span className="sr-only"> {fr.a11y.opensNewTab}</span>
          </a>
        </p>
      </div>

      {photos.length >= 3 ? (
        <div className="grid grid-cols-[2fr_1fr] grid-rows-[120px_120px] gap-2.5 md:grid-rows-[170px_170px]">
          <Photo src={photos[0]} alt={fr.a11y.photoOf(parking.title, 1)} className="row-span-2 h-full w-full rounded-[16px]" />
          <Photo src={photos[1]} alt={fr.a11y.photoOf(parking.title, 2)} className="h-full w-full rounded-[16px]" />
          <Photo src={photos[2]} alt={fr.a11y.photoOf(parking.title, 3)} className="h-full w-full rounded-[16px]" />
        </div>
      ) : (
        <Photo src={photos[0]} alt={fr.a11y.photoOf(parking.title, 1)} className="h-[190px] w-full rounded-[16px] md:h-[300px]" />
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_340px] md:gap-x-10 lg:grid-cols-[1fr_380px] lg:gap-x-12">
        <ul className="grid grid-cols-2 gap-2 md:col-start-1 lg:grid-cols-4 lg:gap-2.5">
          {facts.map(([label, value]) => (
            <li key={label} className="rounded-[16px] border border-line p-2.5 md:p-3.5">
              <div className="text-xs text-soft md:text-[13px]">{label}</div>
              <div className="mt-0.5 text-[15px] font-bold md:text-[17px]">{value}</div>
            </li>
          ))}
        </ul>

        <div className="md:sticky md:top-6 md:col-start-2 md:row-span-6 md:row-start-1 md:self-start">
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
          />
        </div>

        {(parking.description || parking.services.length > 0) && (
          <section className={`${section} md:col-start-1`} aria-labelledby="presentation">
            <h2 id="presentation" className={sectionTitle}>
              {fr.parking.presentation}
            </h2>
            {parking.description && <p className="text-base leading-relaxed whitespace-pre-line">{parking.description}</p>}
            {parking.services.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {parking.services.map(s => (
                  <li key={s} className="rounded-[16px] border border-line px-3 py-1.5 text-sm">
                    <span aria-hidden="true">✓ </span>
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
          <dl className="flex flex-col gap-3">
            <div className="grid gap-1 sm:grid-cols-[90px_1fr] sm:gap-3.5">
              <dt className="font-bold text-accent">{fr.parking.outbound}</dt>
              <dd className="leading-relaxed">{fr.parking.outboundText(shuttle ? parking.shuttleMinutes : null)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-[90px_1fr] sm:gap-3.5">
              <dt className="font-bold text-accent">{fr.parking.inbound}</dt>
              <dd className="leading-relaxed">{fr.parking.inboundText}</dd>
            </div>
          </dl>
        </section>

        {tiers.length > 0 && (
          <section className={`${section} md:col-start-1`} aria-labelledby="tarifs">
            <h2 id="tarifs" className={sectionTitle}>
              {fr.parking.prices}
            </h2>
            <p className="text-sm text-soft">{fr.parking.pricesNote}</p>
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">{fr.parking.prices}</caption>
              <tbody>
                {tiers.map(t => (
                  <tr key={t.days} className="border-b border-line">
                    <th scope="row" className="py-2 font-normal">
                      {fr.parking.tierUpTo(t.days)}
                    </th>
                    <td className="py-2 text-right font-bold whitespace-nowrap">{formatEuros(t.priceCents)}</td>
                  </tr>
                ))}
                {parking.pricing.extraDayPriceCents !== null && (
                  <tr className="border-b border-line">
                    <th scope="row" className="py-2 font-normal">
                      {fr.parking.extraDay}
                    </th>
                    <td className="py-2 text-right font-bold whitespace-nowrap">{formatEuros(parking.pricing.extraDayPriceCents)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        <section className={`${section} md:col-start-1`} aria-labelledby="acces">
          <h2 id="acces" className={sectionTitle}>
            {fr.parking.access}
          </h2>
          <div className="bg-stripes flex min-h-[200px] items-end rounded-[16px] p-3">
            <div className="flex w-full flex-col gap-3 rounded-[14px] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[15px]">{parking.address ?? fr.parking.addressUnknown}</p>
              <a href={mapsUrl(destination)} target="_blank" rel="noopener noreferrer" className="btn-secondary h-11 flex-none px-4 text-[15px]">
                {fr.parking.openInMaps}
                <span className="sr-only"> {fr.a11y.opensNewTab}</span>
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
