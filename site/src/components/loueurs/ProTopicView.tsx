import Link from "next/link";
import { ProFaq } from "@/components/loueurs/ProFaq";
import { btnLime, btnOutline, hour, pillInfo, pillOk, pillWarn, Screen, screenLine, sectionTitle } from "@/components/loueurs/ProHome";
import { fr } from "@/lib/fr";
import { PRODUCT_NAME } from "@/lib/product";
import { PRO_TOPICS, type ProTopic, type ScreenRow } from "@/lib/pro-topics";
import { proTopicPath } from "@/lib/site";

const t = fr.proHome;
const PILLS = { ok: pillOk, warn: pillWarn, info: pillInfo } as const;

function Row({ row }: { row: ScreenRow }) {
  return (
    <div className={screenLine}>
      {row.hour && <span className={hour}>{row.hour}</span>}
      <span className="min-w-0 flex-1">{row.text}</span>
      {row.pill && <span className={PILLS[row.pill.tone]}>{row.pill.label}</span>}
    </div>
  );
}

/**
 * A Plazo Pro page by topic (28/10/2026, SEO mockups 3A): the problem and what changes, three drawn screens, the topic
 * explained, its questions (marked up as a FAQPage by the page), then the demo. Same faces and bands as the home page.
 */
export function ProTopicView({ topic, homeHref, pricingHref, demoHref }: { topic: ProTopic; homeHref: string; pricingHref: string; demoHref: string }) {
  return (
    <div className="flex flex-col">
      <section aria-labelledby="pro-topic-title" className="bg-lime-ink text-lime-band">
        <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6 md:py-16">
          <nav aria-label={fr.a11y.breadcrumb} className="mb-5 text-[13px]">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href={homeHref} className="text-lime-band underline-offset-2 hover:underline">
                  {PRODUCT_NAME} Pro
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li>{t.breadcrumbSolutions}</li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" className="font-semibold text-white">
                {topic.label}
              </li>
            </ol>
          </nav>
          <h1 id="pro-topic-title" className="mb-4 max-w-[22ch] font-pro-display text-[36px] leading-none font-bold tracking-[.01em] text-balance text-white uppercase md:text-[52px]">
            {topic.title} <span className="text-lime">{topic.accent}</span>
          </h1>
          <p className="mb-6 max-w-[62ch] text-[16px] leading-relaxed">{topic.lead}</p>
          <div className="flex flex-wrap gap-3">
            <a href={demoHref} className={btnLime}>
              {fr.proPricing.tryDemo}
            </a>
            <Link href={pricingHref} className={btnOutline}>
              {t.buildOffer}
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="pro-topic-problem" className="mx-auto grid w-full max-w-[1180px] gap-8 px-4 py-12 md:grid-cols-[.9fr_1.1fr] md:px-6">
        <div className="min-w-0">
          <p className="mb-1 text-[12.5px] font-bold tracking-[.08em] text-lime-deep uppercase">{t.topicProblem}</p>
          <h2 id="pro-topic-problem" className={sectionTitle}>
            {topic.problem.title}
          </h2>
          {topic.problem.paragraphs.map(paragraph => (
            <p key={paragraph} className="mt-3 text-[15px] leading-relaxed text-pro-soft">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="min-w-0">
          <p className="mb-3 text-[12.5px] font-bold tracking-[.08em] text-lime-deep uppercase">{t.topicGains}</p>
          <ul className="grid gap-5 sm:grid-cols-2">
            {topic.gains.map(gain => (
              <li key={gain.title} className="border-t-[3px] border-lime pt-3">
                <h3 className="mb-1 text-[16px] font-bold">{gain.title}</h3>
                <p className="text-[14px] text-pro-soft">{gain.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="pro-topic-screens" className="bg-white">
        <div className="mx-auto max-w-[1180px] px-4 py-12 md:px-6">
          <h2 id="pro-topic-screens" className={sectionTitle}>
            {t.topicScreens}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {topic.screens.map(screen => (
              <Screen key={screen.title}>
                <b className="text-[14px]">{screen.title}</b>
                {screen.rows.map(row => (
                  <Row key={row.text} row={row} />
                ))}
              </Screen>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[860px] flex-col gap-10 px-4 py-12 md:px-6">
        {topic.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`pro-topic-section-${index}`}>
            <h2 id={`pro-topic-section-${index}`} className="mb-3 text-[24px] leading-tight font-bold text-balance">
              {section.title}
            </h2>
            {section.paragraphs.map(paragraph => (
              <p key={paragraph} className="mt-3 text-[16px] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
        <section aria-labelledby="pro-topic-faq">
          <ProFaq id="pro-topic-faq" title={t.faqTitle} faq={topic.faq} />
        </section>
        <nav aria-labelledby="pro-topic-next">
          <h2 id="pro-topic-next" className="mb-3 text-[13px] font-bold tracking-[.08em] text-lime-deep uppercase">
            {t.topicsTitle}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-3">
            {topic.next.map(slug => (
              <li key={slug}>
                <Link href={proTopicPath(slug)} className="flex min-h-12 items-center justify-between rounded-[12px] border border-pro-line bg-white px-4 font-semibold text-pro-ink no-underline hover:border-lime-deep">
                  {PRO_TOPICS[slug].label} <span aria-hidden="true">›</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href={pricingHref} className="flex min-h-12 items-center justify-between rounded-[12px] border border-pro-line bg-white px-4 font-semibold text-pro-ink no-underline hover:border-lime-deep">
                {t.nav.pricing} <span aria-hidden="true">›</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <section aria-labelledby="pro-topic-cta" className="bg-lime-ink text-lime-band">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start gap-4 px-4 py-12 md:px-6">
          <h2 id="pro-topic-cta" className={`${sectionTitle} text-white`}>
            {t.topicCtaTitle}
          </h2>
          <p className="max-w-[60ch] leading-relaxed">{t.topicCtaLead}</p>
          <div className="flex flex-wrap gap-3">
            <a href={demoHref} className={btnLime}>
              {fr.proPricing.tryDemo}
            </a>
            <Link href={pricingHref} className={btnOutline}>
              {t.buildOffer}
            </Link>
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 z-30 border-t border-pro-line bg-white px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] md:hidden">
        <a href={demoHref} className={`${btnLime} w-full`}>
          {fr.proPricing.tryDemo}
        </a>
      </div>
    </div>
  );
}
