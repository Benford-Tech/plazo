import type { Metadata } from "next";
import Link from "next/link";
import { fr } from "@/lib/fr";

export const metadata: Metadata = { title: fr.notFound.title, robots: { index: false } };

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-start gap-4 px-4 py-12 md:py-20">
      <h1 className="font-title text-[34px] md:text-[44px]">{fr.notFound.title}</h1>
      <p className="text-soft">{fr.notFound.text}</p>
      <div className="flex flex-wrap gap-2.5">
        <Link href="/" className="btn-primary h-12 px-6">
          {fr.notFound.home}
        </Link>
        <Link href="/ma-reservation" className="btn-secondary h-12 px-6">
          {fr.nav.myBooking}
        </Link>
      </div>
    </main>
  );
}
