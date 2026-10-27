import type { Metadata } from "next";
import { ProPricing } from "@/components/loueurs/ProPricing";
import { quoteAction } from "@/lib/contact-actions";
import { fr } from "@/lib/fr";
import { hasSupportEmail, SUPPORT_EMAIL } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { PRO_DEMO_PATH, PRO_PRICING_PATH, PRO_SIGNUP_PATH } from "@/lib/site";

const t = fr.proPricing;

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  alternates: { canonical: PRO_PRICING_PATH },
  openGraph: openGraph({ title: t.metaTitle, description: t.metaDescription, url: PRO_PRICING_PATH }),
};

export default function ProPricingPage() {
  return <ProPricing action={quoteAction} demoHref={PRO_DEMO_PATH} signupHref={PRO_SIGNUP_PATH} supportEmail={hasSupportEmail() ? SUPPORT_EMAIL : null} />;
}
