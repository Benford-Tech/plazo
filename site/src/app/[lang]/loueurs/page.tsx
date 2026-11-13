import { permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProHome } from "@/components/loueurs/ProHome";
import { quoteAction } from "@/lib/contact-actions";
import { fr, lazy } from "@/lib/fr";
import { COMPANY } from "@/lib/product";
import { PRO_PLANS } from "@/lib/pro-pricing";
import { proOpenGraph } from "@/lib/seo";
import { faqLd, proSoftwareLd } from "@/lib/structured-data";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_PRICING_PATH, siteUrl } from "@/lib/site";
import { enterLocaleFrom } from "@/lib/i18n/server";

const t = lazy(() => fr.proHome);

export async function generateMetadata({ params }: { params: Promise<{ lang?: string }> }): Promise<Metadata> {
  await enterLocaleFrom(params);
  return {
    title: { absolute: t.metaTitle },
    description: t.metaDescription,
    alternates: { canonical: PRO_HOME_PATH },
    openGraph: proOpenGraph({ title: t.metaTitle, description: t.metaDescription, url: PRO_HOME_PATH }),
  };
}

export default async function ProHomePage({ params }: { params: Promise<{ lang?: string }> }) {
  // Plazo Pro's pages are written in French only for now (13/11/2026).
  if ((await enterLocaleFrom(params)) !== "fr") permanentRedirect(PRO_HOME_PATH);
  const home = PRO_HOME_PATH.startsWith("http") ? PRO_HOME_PATH : `${siteUrl()}${PRO_HOME_PATH}`;
  return (
    <>
      <JsonLd data={[proSoftwareLd(home, PRO_PLANS, COMPANY.name), faqLd(t.faq)]} />
      <ProHome action={quoteAction} demoHref={PRO_DEMO_PATH} pricingHref={PRO_PRICING_PATH} />
    </>
  );
}
