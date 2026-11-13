import type { Metadata } from "next";
import { AccountDeletionView } from "@/components/AccountDeletionView";
import { ACCOUNT_DELETION_PATH, accountDeletionPage } from "@/lib/account-deletion";
import { openGraph, alternatesFor } from "@/lib/seo";
import { enterLocaleFrom } from "@/lib/i18n/server";

// 13/10/2026: the public page the stores ask for (Apple 5.1.1(v), Google Play's account deletion URL). Indexed, in the
// sitemap and the footer, so that someone who no longer has the app finds it.
export async function generateMetadata({ params }: { params: Promise<{ lang?: string }> }): Promise<Metadata> {
  await enterLocaleFrom(params);
  const page = accountDeletionPage();
  return {
    title: page.title,
    description: page.description,
    alternates: alternatesFor(ACCOUNT_DELETION_PATH),
    openGraph: openGraph({ title: page.title, description: page.description, url: ACCOUNT_DELETION_PATH }),
  };
}

export default async function AccountDeletionPage({ params }: { params: Promise<{ lang?: string }> }) {
  await enterLocaleFrom(params);
  return <AccountDeletionView page={accountDeletionPage()} />;
}
