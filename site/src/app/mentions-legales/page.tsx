import type { Metadata } from "next";
import { LegalDocument } from "@/components/LegalDocument";
import { fr } from "@/lib/fr";
import { legalNoticeDoc } from "@/lib/legal";

// Not indexed while the text awaits the lawyer's review.
export const metadata: Metadata = { title: fr.legal.legalNotice, robots: { index: false, follow: true } };

export default function LegalNoticePage() {
  return <LegalDocument doc={legalNoticeDoc()} />;
}
