import type { Metadata } from "next";
import Link from "next/link";
import { fr } from "@/lib/fr";

export const metadata: Metadata = { title: fr.notFound.title, robots: { index: false } };

/** Boutique (11/10/2026): a calm page, the Playfair title, one orange action (home), « Ma réservation » in white. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-5 px-4 py-14 md:py-24">
      <h1 className="font-title text-[30px] leading-[1.1] text-ink lining-nums md:text-[46px]">{fr.notFound.title}</h1>
      <p className="max-w-[38rem] text-[17px] leading-[1.65] text-soft">{fr.notFound.text}</p>
      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap">
        <Link href="/" className="btn-primary min-h-12 px-7 text-[15px]">
          {fr.notFound.home}
        </Link>
        <Link href="/ma-reservation" className="btn-secondary min-h-12 px-7 text-[15px]">
          {fr.nav.myBooking}
        </Link>
      </div>
    </main>
  );
}
