import type { Metadata } from "next";
import { ProHome } from "@/components/loueurs/ProHome";
import { quoteAction } from "@/lib/contact-actions";
import { fr } from "@/lib/fr";
import { openGraph } from "@/lib/seo";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_PRICING_PATH } from "@/lib/site";

const t = fr.proHome;

export const metadata: Metadata = {
  title: { absolute: t.metaTitle },
  description: t.metaDescription,
  alternates: { canonical: PRO_HOME_PATH },
  openGraph: openGraph({ title: t.metaTitle, description: t.metaDescription, url: PRO_HOME_PATH }),
};

export default function ProHomePage() {
  return <ProHome action={quoteAction} demoHref={PRO_DEMO_PATH} pricingHref={PRO_PRICING_PATH} />;
}
