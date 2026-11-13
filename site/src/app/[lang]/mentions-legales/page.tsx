import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { fr } from "@/lib/fr";
import { legalNoticeDoc } from "@/lib/legal";
import { enterLocaleFrom } from "@/lib/i18n/server";

// Not indexed while the text awaits the lawyer's review.
export async function generateMetadata({ params }: { params: Promise<{ lang?: string }> }): Promise<Metadata> {
  await enterLocaleFrom(params);
  return { title: fr.legal.legalNotice, robots: { index: false, follow: true } };
}

export default async function LegalNoticePage({ params }: { params: Promise<{ lang?: string }> }) {
  await enterLocaleFrom(params);
  return <LegalDocument doc={legalNoticeDoc()} />;
}
