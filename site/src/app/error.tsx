"use client";

import Link from "next/link";
import { fr } from "@/lib/fr";

/**
 * The API did not answer (or answered with an unexpected error): offer to try again.
 * Boutique (11/10/2026): a calm page, the Playfair title, one orange action (« Réessayer »), the way home in white.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col justify-center gap-5 px-4 py-14 md:py-24">
      <h1 className="font-title text-[30px] leading-[1.1] text-ink lining-nums md:text-[46px]">{fr.error.title}</h1>
      <p className="max-w-[38rem] text-[17px] leading-[1.65] text-soft">{fr.error.text}</p>
      <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={() => reset()} className="btn-primary min-h-12 px-7 text-[15px]">
          {fr.error.retry}
        </button>
        <Link href="/" className="btn-secondary min-h-12 px-7 text-[15px]">
          {fr.error.home}
        </Link>
      </div>
    </main>
  );
}
