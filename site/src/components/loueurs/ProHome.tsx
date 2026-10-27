import Link from "next/link";
import { Plate } from "@/components/Plate";
import { LiveShuttleMap, MessageCard } from "@/components/loueurs/LiveShuttleMap";
import { QuoteForm } from "@/components/loueurs/ProPricing";
import type { FormState } from "@/lib/forms";
import { fr } from "@/lib/fr";
import { formatEuros } from "@/lib/money";
import { PRO_PLANS } from "@/lib/pro-pricing";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

const t = fr.proHome;

/** The sections the header's menu points to. */
export const PRO_HOME_SECTIONS = { software: "logiciel", live: "navette-et-clients", app: "application", marketplace: "vendre-sur-plazo", paperwork: "contrat" } as const;

const btnLime = "inline-flex min-h-11 items-center justify-center rounded-[10px] bg-lime px-4 text-[14px] font-semibold text-lime-ink no-underline hover:brightness-95";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-lime-band/40 px-4 text-[14px] font-semibold text-lime-band no-underline hover:border-lime-band";
const btnLine = "inline-flex min-h-11 items-center justify-center rounded-[10px] border border-pro-line bg-white px-4 text-[14px] font-semibold text-lime-deep no-underline";
const sectionTitle = "font-pro-display text-[28px] leading-tight font-bold tracking-[.02em] text-balance uppercase md:text-[34px]";
const pill = "rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap";
const pillOk = `${pill} bg-[#e8f7ec] text-[#15803d]`;
const pillWarn = `${pill} bg-[#fff4e0] text-[#b45309]`;
const pillInfo = `${pill} bg-[#e8effd] text-[#4338ca]`;
const screenLine = "flex flex-wrap items-center gap-2 rounded-[10px] bg-pro-ground px-3 py-2";
const hour = "font-mono font-bold text-lime-deep";

/** Whole euros (« 149 € »). */
const eur = (cents: number) => formatEuros(cents).replace(",00", "");

/** A screen of the product drawn with its own components (the demo's data: « Parking des Cèdres »). */
function Screen({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-2 rounded-[14px] border border-pro-line bg-white p-4 text-[13px] shadow-[0_8px_24px_rgba(15,42,20,0.06)]">{children}</div>;
}

function Product({
  id,
  copy,
  flip,
  demoHref,
  children,
}: {
  id: string;
  copy: { tag: string; title: string; points: string[] };
  flip?: boolean;
  demoHref: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="grid scroll-mt-24 items-center gap-6 border-t border-pro-line py-8 first:border-t-0 md:grid-cols-2 md:gap-10">
      <div className={flip ? "md:order-2" : undefined}>{children}</div>
      <div className="min-w-0">
        <p className="mb-1 text-[12.5px] font-bold tracking-[.08em] text-lime-deep uppercase">{copy.tag}</p>
        <h3 className="mb-2 text-[22px] leading-tight font-bold text-balance">{copy.title}</h3>
        <ul className="mb-3 list-disc space-y-1 pl-5 text-[15px]">
          {copy.points.map(point => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        {/* The pro space is another service on the same domain: full page loads. */}
        <a href={demoHref} className="text-[14px] font-bold text-lime-deep no-underline hover:underline">
          {t.tryInDemo}
        </a>
      </div>
    </div>
  );
}

/**
 * Plazo Pro's home page (27/10/2026, « un vrai site Plazo Pro avec page d'accueil », on the model of Solution Park's
 * home page): the products one after the other, « Centralisez vos réservations », the plans and a demo request. It
 * says what the parking gains, never how Plazo does it, and shows only true facts (no customer counts or quotes).
 */
export function ProHome({ action, demoHref, pricingHref }: { action: Action; demoHref: string; pricingHref: string }) {
  const s = t.screens;
  return (
    <div className="flex flex-col">
      {/* Hero, on the dark band, edge to edge. */}
      <section aria-labelledby="pro-home-title" className="bg-lime-ink text-lime-band">
        <div className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 py-12 md:grid-cols-[1fr_1fr] md:px-6 md:py-16">
          <div className="min-w-0">
            <h1 id="pro-home-title" className="mb-4 font-pro-display text-[38px] leading-none font-bold tracking-[.01em] text-balance text-white uppercase md:text-[54px]">
              {t.heroTitle} <span className="text-lime">{t.heroAccent}</span>
            </h1>
            <p className="mb-6 max-w-[52ch] text-[16px] leading-relaxed">{t.heroLead}</p>
            <div className="flex flex-wrap gap-3">
              <a href={demoHref} className={btnLime}>
                {fr.proPricing.tryDemo}
              </a>
              <Link href={pricingHref} className={btnOutline}>
                {t.buildOffer}
              </Link>
            </div>
            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-t border-lime-band/20 pt-5">
              {t.facts.map(fact => (
                <div key={fact.label} className="flex flex-col-reverse">
                  <dt className="text-[13px] opacity-85">{fact.label}</dt>
                  <dd className="font-mono text-[22px] font-bold text-lime">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <LiveShuttleMap variant="hero" />
        </div>
      </section>

      {/* B: the customers don't call any more (the live shuttle and their messages). */}
      <section id={PRO_HOME_SECTIONS.live} aria-labelledby="pro-home-live" className="scroll-mt-24 border-t border-lime-band/15 bg-lime-ink text-lime-band">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-12 md:grid-cols-2 md:px-6">
          <div className="flex min-w-0 flex-col gap-4">
            <h2 id="pro-home-live" className={`${sectionTitle} text-white`}>
              {t.liveTitle} <span className="text-lime">{t.liveAccent}</span>
            </h2>
            <p className="max-w-[52ch] leading-relaxed">{t.liveLead}</p>
            <LiveShuttleMap variant="section" />
          </div>
          <div className="flex min-w-0 flex-col gap-2.5 md:pt-2">
            <p className="text-[12.5px] font-bold tracking-[.08em] uppercase opacity-80">{t.feedTitle}</p>
            {t.messages.map(message => (
              <MessageCard key={message.title} message={message} />
            ))}
          </div>
        </div>
        <div className="bg-white text-pro-ink">
          <ul className="mx-auto grid max-w-[1180px] gap-3 px-4 py-6 text-[15px] md:grid-cols-2 md:px-6">
            {t.liveGains.map(gain => (
              <li key={gain} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-[7px] size-2 flex-none rounded-full bg-lime" />
                {gain}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* The products. */}
      <section aria-labelledby="pro-home-products" className="mx-auto w-full max-w-[1180px] px-4 py-12 md:px-6">
        <h2 id="pro-home-products" className={sectionTitle}>
          {t.productsTitle}
        </h2>
        <p className="mt-2 max-w-[62ch] text-pro-soft">{t.productsLead}</p>
        <div className="mt-4">
          <Product id={PRO_HOME_SECTIONS.software} copy={t.products.software} demoHref={demoHref}>
            <Screen>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  ["87", s.onSite],
                  ["14", s.arrivals],
                  ["9", s.returns],
                  ["2", s.toHandle],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[10px] bg-pro-ground p-2">
                    <b className="block font-mono text-[20px]">{value}</b>
                    <span className="text-[10.5px] tracking-[.05em] text-pro-soft uppercase">{label}</span>
                  </div>
                ))}
              </div>
              <div className={screenLine}>
                <span className={hour}>06:30</span> Dupont <Plate plate="AB-123-CD" size="sm" /> <span className={pillInfo}>Allopark</span>
              </div>
              <div className={screenLine}>
                <span className={hour}>21:40</span> Martin · {s.returnLabel} <span className={pillWarn}>{s.lateFlight}</span>
              </div>
            </Screen>
          </Product>
          <Product id={PRO_HOME_SECTIONS.app} copy={t.products.app} flip demoHref={demoHref}>
            <Screen>
              <div className={screenLine}>
                <span className={pillOk}>{s.go}</span>
                <span className={pillInfo}>{s.back}</span>
              </div>
              <div className={screenLine}>
                <span className={hour}>14:30</span> Dupont · 2 pers. · Terminal 1
              </div>
              <div className={screenLine}>
                <span className={hour}>14:30</span> Martin · 1 pers. · Gare TGV
              </div>
              <div className="rounded-[10px] bg-lime px-3 py-2 text-center font-bold text-lime-ink">{s.leave}</div>
            </Screen>
          </Product>
          <Product id={PRO_HOME_SECTIONS.marketplace} copy={t.products.marketplace} demoHref={demoHref}>
            <Screen>
              <div className={screenLine}>
                <b>{s.listingName}</b> <span className={pillOk}>{s.live}</span>
              </div>
              <div className={screenLine}>{s.listingLine}</div>
              <div className={screenLine}>{s.paidLine}</div>
            </Screen>
          </Product>
          <Product id={PRO_HOME_SECTIONS.paperwork} copy={t.products.paperwork} flip demoHref={demoHref}>
            <Screen>
              <div className={screenLine}>
                {s.signed} <span className={pillOk}>{s.atCounter}</span>
              </div>
              <div className={screenLine}>{s.dropoff}</div>
              <div className={screenLine}>
                {s.atReturn} <span className={pillOk}>{s.already}</span>
                <span className={pillWarn}>{s.fresh}</span>
              </div>
            </Screen>
          </Product>
        </div>
      </section>

      {/* Centralise. */}
      <section aria-labelledby="pro-home-central" className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
          <div className="grid items-center gap-8 md:grid-cols-[.9fr_1.1fr]">
            <div className="min-w-0">
              <h2 id="pro-home-central" className={sectionTitle}>
                {t.centralTitle}
              </h2>
              <p className="mt-2 text-pro-soft">{t.centralLead}</p>
              <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.centralTitle}>
                {t.channels.map(channel => (
                  <li key={channel} className="rounded-full border border-pro-line bg-pro-ground px-3 py-1 text-[13px] font-semibold">
                    {channel}
                  </li>
                ))}
              </ul>
            </div>
            <Screen>
              <div className={screenLine}>{s.day}</div>
              <div className={screenLine}>
                <span className={pillInfo}>Onepark</span> Bernard · 07:10 → 3 nov.
              </div>
              <div className={screenLine}>
                <span className={pillInfo}>Park Hit</span> Leroy · 08:00 → 30 oct.
              </div>
              <div className={screenLine}>
                <span className={pillOk}>Plazo</span> Petit · 09:15 → 2 nov. · {s.paid}
              </div>
            </Screen>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {t.gains.map(gain => (
              <div key={gain.title} className="border-t-[3px] border-lime pt-3">
                <h3 className="mb-1 text-[16px] font-bold">{gain.title}</h3>
                <p className="text-[14px] text-pro-soft">{gain.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on the ground (client n°1, never named). */}
      <section aria-labelledby="pro-home-field" className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-12 md:grid-cols-2 md:px-6">
        <div>
          <h2 id="pro-home-field" className={sectionTitle}>
            {t.fieldTitle}
          </h2>
          <p className="mt-2 text-pro-soft">{t.fieldLead}</p>
        </div>
        <ol className="list-decimal space-y-2 pl-5 text-[15px]">
          {t.fieldPains.map(pain => (
            <li key={pain}>{pain}</li>
          ))}
        </ol>
      </section>

      {/* Plans. */}
      <section aria-labelledby="pro-home-prices" className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
          <h2 id="pro-home-prices" className={sectionTitle}>
            {t.pricesTitle}
          </h2>
          <p className="mt-2 text-pro-soft">{t.pricesLead}</p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {PRO_PLANS.map(plan => (
              <div
                key={plan.id}
                className={`flex flex-col gap-1 rounded-[14px] border bg-white p-5 ${plan.recommended ? "border-lime shadow-[inset_0_0_0_1px_var(--color-lime)]" : "border-pro-line"}`}
              >
                <span className="text-[14px] font-semibold">
                  {plan.name}
                  {plan.recommended && <span className="font-normal text-pro-soft"> · {t.recommended}</span>}
                </span>
                <b className="font-mono text-[28px]">{eur(plan.monthlyCents)}</b>
                <span className="text-[13.5px] text-pro-soft">{t.planLines[plan.id]}</span>
              </div>
            ))}
          </div>
          <p className="mt-5">
            <Link href={pricingHref} className={btnLine}>
              {t.allPrices}
            </Link>
          </p>
        </div>
      </section>

      {/* Demo request. */}
      <section aria-labelledby="pro-home-contact" className="bg-lime-ink text-lime-band">
        <div className="mx-auto grid max-w-[1180px] gap-8 px-4 py-12 md:grid-cols-[.8fr_1.2fr] md:px-6">
          <div>
            <h2 id="pro-home-contact" className={`${sectionTitle} text-white`}>
              {t.contactTitle}
            </h2>
            <p className="mt-2 mb-5 leading-relaxed">{t.contactLead}</p>
            <a href={demoHref} className={btnLime}>
              {fr.proPricing.tryDemo}
            </a>
          </div>
          <div className="rounded-[14px] bg-white p-5 text-pro-ink">
            <QuoteForm action={action} selection={null} submitLabel={t.askDemo} sentText={t.demoSent} />
          </div>
        </div>
      </section>

      {/* Phones: the demo stays one tap away, until the footer. */}
      <div className="sticky bottom-0 z-30 border-t border-pro-line bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] md:hidden">
        <a href={demoHref} className={`${btnLime} w-full`}>
          {fr.proPricing.tryDemo}
        </a>
      </div>
    </div>
  );
}
