import type { Metadata } from "next";
import { LegalPlaceholder } from "@/components/LegalPlaceholder";
import { fr } from "@/lib/fr";

export const metadata: Metadata = { title: fr.legal.privacy, robots: { index: false, follow: true } };

export default function PrivacyPage() {
  return <LegalPlaceholder title={fr.legal.privacy} />;
}
