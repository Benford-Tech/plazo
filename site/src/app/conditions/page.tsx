import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/LegalPlaceholder";
import { fr } from "@/lib/fr";

export const metadata: Metadata = { title: fr.legal.terms, robots: { index: false, follow: true } };

export default function TermsPage() {
  return <LegalPlaceholder title={fr.legal.terms} />;
}
