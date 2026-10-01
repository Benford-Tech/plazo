import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/LegalPlaceholder";
import { fr } from "@/lib/fr";

export const metadata: Metadata = { title: fr.legal.legalNotice, robots: { index: false, follow: true } };

export default function LegalNoticePage() {
  return <LegalPlaceholder title={fr.legal.legalNotice} />;
}
