"use client";

import Link from "next/link";
import { fr } from "@/lib/fr";

/** The API did not answer (or answered with an unexpected error): offer to try again. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col items-start gap-4 px-4 py-12 md:py-20">
      <h1 className="font-title text-[34px] md:text-[44px]">{fr.error.title}</h1>
      <p className="text-soft">{fr.error.text}</p>
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={() => reset()} className="btn-primary h-12 px-6">
          {fr.error.retry}
        </button>
        <Link href="/" className="btn-secondary h-12 px-6">
          {fr.error.home}
        </Link>
      </div>
    </main>
  );
}
