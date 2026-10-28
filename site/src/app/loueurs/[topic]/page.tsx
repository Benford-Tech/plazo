import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { ProTopicView } from "@/components/loueurs/ProTopicView";
import { PRODUCT_NAME } from "@/lib/product";
import { PRO_TOPICS } from "@/lib/pro-topics";
import { proOpenGraph } from "@/lib/seo";
import { breadcrumbLd, faqLd } from "@/lib/structured-data";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_PRICING_PATH, PRO_TOPIC_SLUGS, proTopicPath, siteUrl, type ProTopicSlug } from "@/lib/site";

/** The three pages by topic (28/10/2026), built at deploy time; any other /loueurs/<slug> is a 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return PRO_TOPIC_SLUGS.map(topic => ({ topic }));
}

const topicOf = (slug: string) => (PRO_TOPIC_SLUGS as readonly string[]).includes(slug) ? PRO_TOPICS[slug as ProTopicSlug] : null;
/** Pro paths are absolute once Plazo Pro has its own address, relative to the site before. */
const absolute = (path: string) => (path.startsWith("http") ? path : `${siteUrl()}${path}`);

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const topic = topicOf((await params).topic);
  if (!topic) return {};
  const url = proTopicPath(topic.slug);
  return {
    title: { absolute: topic.metaTitle },
    description: topic.metaDescription,
    alternates: { canonical: url },
    openGraph: proOpenGraph({ title: topic.metaTitle, description: topic.metaDescription, url }),
  };
}

export default async function ProTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const topic = topicOf((await params).topic);
  if (!topic) notFound();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd(siteUrl(), [
            { name: `${PRODUCT_NAME} Pro`, path: absolute(PRO_HOME_PATH) },
            { name: topic.label, path: absolute(proTopicPath(topic.slug)) },
          ]),
          faqLd(topic.faq),
        ]}
      />
      <ProTopicView topic={topic} homeHref={PRO_HOME_PATH} pricingHref={PRO_PRICING_PATH} demoHref={PRO_DEMO_PATH} />
    </>
  );
}
