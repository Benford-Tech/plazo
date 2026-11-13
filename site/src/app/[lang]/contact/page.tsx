import type { Metadata } from "next";
import { ContactView } from "@/components/ContactView";
import { contactAction } from "@/lib/contact-actions";
import { footerConfig } from "@/lib/footer";
import { fr } from "@/lib/fr";
import { CONTACT_PATH } from "@/lib/site";
import { enterLocaleFrom } from "@/lib/i18n/server";
import { alternatesFor } from "@/lib/seo";

// Footer A (15/10/2026): a utility page, like « Ma réservation » and the legal pages: not indexed, links followed.
export async function generateMetadata({ params }: { params: Promise<{ lang?: string }> }): Promise<Metadata> {
  await enterLocaleFrom(params);
  return {
    title: fr.contact.title,
    description: fr.contact.description,
    robots: { index: false, follow: true },
    alternates: alternatesFor(CONTACT_PATH),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang?: string }> }) {
  await enterLocaleFrom(params);
  return <ContactView config={footerConfig()} action={contactAction} />;
}
