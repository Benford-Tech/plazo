import { randomUUID } from "node:crypto";
import type { Metadata } from "next";
import { BookingPageModule } from "@/components/booking-page/BookingPageModule";
import { api, ApiError } from "@/lib/api";
import { fr } from "@/lib/fr";
import { enterLocaleFrom } from "@/lib/i18n/server";

// Site du parking, niveau 3 (19/11/2026): a parking's own Plazo booking page, /r/<slug>, shown in its site by
// /r/embed.js (or opened as a link). Never indexed: the parking's fiche on plazo.fr is the page Google knows.
export const dynamic = "force-dynamic";

type Params = Promise<{ lang?: string; slug: string }>;

async function pageOf(slug: string) {
  try {
    return await api.bookingPage(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const page = await pageOf(slug);
  return { title: page ? `${fr.bookingPage.meta} · ${page.title}` : fr.bookingPage.notFound, robots: { index: false, follow: false } };
}

export default async function BookingPage({ params }: { params: Params }) {
  await enterLocaleFrom(params);
  const { slug } = await params;
  const page = await pageOf(slug);
  if (!page) return <p className="mx-auto max-w-[520px] p-6 text-center text-soft">{fr.bookingPage.notFound}</p>;
  // One key per page shown: the same form sent twice returns the booking already made.
  return <BookingPageModule page={page} idempotencyKey={randomUUID()} />;
}
