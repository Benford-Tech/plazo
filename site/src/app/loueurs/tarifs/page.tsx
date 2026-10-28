import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { ProPricing } from "@/components/loueurs/ProPricing";
import { quoteAction } from "@/lib/contact-actions";
import { fr } from "@/lib/fr";
import { COMPANY, hasSupportEmail, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/product";
import { PRO_PLANS } from "@/lib/pro-pricing";
import { proOpenGraph } from "@/lib/seo";
import { breadcrumbLd, proSoftwareLd } from "@/lib/structured-data";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_PRICING_PATH, PRO_SIGNUP_PATH, siteUrl } from "@/lib/site";

const t = fr.proPricing;

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  alternates: { canonical: PRO_PRICING_PATH },
  openGraph: proOpenGraph({ title: t.metaTitle, description: t.metaDescription, url: PRO_PRICING_PATH }),
};

/** Pro paths are absolute once Plazo Pro has its own address, relative to the site before. */
const absolute = (path: string) => (path.startsWith("http") ? path : `${siteUrl()}${path}`);

export default function ProPricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 md:px-6">
      <JsonLd
        data={[
          proSoftwareLd(absolute(PRO_HOME_PATH), PRO_PLANS, COMPANY.name),
          breadcrumbLd(siteUrl(), [
            { name: `${PRODUCT_NAME} Pro`, path: absolute(PRO_HOME_PATH) },
            { name: fr.proHome.nav.pricing, path: absolute(PRO_PRICING_PATH) },
          ]),
        ]}
      />
      <ProPricing action={quoteAction} demoHref={PRO_DEMO_PATH} signupHref={PRO_SIGNUP_PATH} supportEmail={hasSupportEmail() ? SUPPORT_EMAIL : null} />
    </div>
  );
}
