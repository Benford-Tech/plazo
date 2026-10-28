import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProHome } from "@/components/loueurs/ProHome";
import { quoteAction } from "@/lib/contact-actions";
import { fr } from "@/lib/fr";
import { COMPANY } from "@/lib/product";
import { PRO_PLANS } from "@/lib/pro-pricing";
import { proOpenGraph } from "@/lib/seo";
import { faqLd, proSoftwareLd } from "@/lib/structured-data";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_PRICING_PATH, siteUrl } from "@/lib/site";

const t = fr.proHome;

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  alternates: { canonical: PRO_HOME_PATH },
  openGraph: proOpenGraph({ title: t.metaTitle, description: t.metaDescription, url: PRO_HOME_PATH }),
};

export default function ProHomePage() {
  const home = PRO_HOME_PATH.startsWith("http") ? PRO_HOME_PATH : `${siteUrl()}${PRO_HOME_PATH}`;
  return (
    <>
      <JsonLd data={[proSoftwareLd(home, PRO_PLANS, COMPANY.name), faqLd(t.faq)]} />
      <ProHome action={quoteAction} demoHref={PRO_DEMO_PATH} pricingHref={PRO_PRICING_PATH} />
    </>
  );
}
