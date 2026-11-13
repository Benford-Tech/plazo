import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { fr } from "@/lib/fr";
import { privacyDoc } from "@/lib/legal";
import { enterLocaleFrom } from "@/lib/i18n/server";

// Not indexed while the text awaits the lawyer's review.
export async function generateMetadata({ params }: { params: Promise<{ lang?: string }> }): Promise<Metadata> {
  await enterLocaleFrom(params);
  return { title: fr.legal.privacy, robots: { index: false, follow: true } };
}

export default async function PrivacyPage({ params }: { params: Promise<{ lang?: string }> }) {
  await enterLocaleFrom(params);
  return <LegalDocument doc={privacyDoc()} />;
}
