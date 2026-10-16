import type { Metadata } from "next";
import { ContactView } from "@/components/ContactView";
import { contactAction } from "@/lib/contact-actions";
import { footerConfig } from "@/lib/footer";
import { fr } from "@/lib/fr";
import { CONTACT_PATH } from "@/lib/site";

// Footer A (15/10/2026): a utility page, like « Ma réservation » and the legal pages: not indexed, links followed.
export const metadata: Metadata = {
  title: fr.contact.title,
  description: fr.contact.description,
  robots: { index: false, follow: true },
  alternates: { canonical: CONTACT_PATH },
};

export default function ContactPage() {
  return <ContactView config={footerConfig()} action={contactAction} />;
}
