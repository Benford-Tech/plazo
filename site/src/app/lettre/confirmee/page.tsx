import type { Metadata } from "next";
import Link from "next/link";
import { fr } from "@/lib/fr";
import { LETTER_CONFIRMED_PATH } from "@/lib/site";

// Where Brevo sends a reader who clicked the confirmation link of « La lettre » (footer A, 15/10/2026). Nothing to index.
export const metadata: Metadata = {
  title: fr.letterConfirmed.title,
  robots: { index: false, follow: true },
  alternates: { canonical: LETTER_CONFIRMED_PATH },
};

/** As calm as the « page not found »: the Playfair title, one orange action (home), « Ma réservation » in white. */
export default function LetterConfirmedPage() {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-5 px-4 py-14 md:py-24">
      <span className="pill pill-ok self-start">{fr.newsletter.title}</span>
      <h1 className="font-title text-[30px] leading-[1.1] text-ink lining-nums md:text-[46px]">{fr.letterConfirmed.title}</h1>
      <p className="max-w-[38rem] text-[17px] leading-[1.65] font-medium text-soft">{fr.letterConfirmed.text}</p>
      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap">
        <Link href="/" className="btn-primary min-h-12 px-7 text-[15px]">
          {fr.letterConfirmed.home}
        </Link>
        <Link href="/ma-reservation" className="btn-secondary min-h-12 px-7 text-[15px]">
          {fr.nav.myBooking}
        </Link>
      </div>
    </main>
  );
}
