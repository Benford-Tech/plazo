import { notFound } from "next/navigation";
import { enterLocaleFrom } from "@/lib/i18n/server";

/** Any other address: the site's own « page not found », in the page's language (13/11/2026). */
export default async function UnknownPage({ params }: { params: Promise<{ lang?: string }> }) {
  await enterLocaleFrom(params);
  notFound();
}
