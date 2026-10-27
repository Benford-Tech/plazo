import type { Metadata } from "next";
import { LookupForm } from "@/components/LookupForm";
import { lookupAction } from "@/lib/actions";
import { param } from "@/lib/dates";
import { fr } from "@/lib/fr";

export const metadata: Metadata = {
  title: fr.meta.manageTitle,
  robots: { index: false, follow: false },
  alternates: { canonical: "/ma-reservation" },
};

export default async function LookupPage({ searchParams }: PageProps<"/ma-reservation">) {
  const reference = (param(await searchParams, "reference") ?? "").slice(0, 40);
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 pt-7 pb-12 md:pt-14 md:pb-20">
      {/* Boutique: the title on the ivory ground, the form in a white card with a hairline. */}
      <div className="flex flex-col gap-2">
        <h1 className="font-title text-[30px] leading-[1.1] md:text-[40px]">{fr.manage.title}</h1>
        <p className="text-[15px] leading-snug font-medium text-soft">{fr.manage.lookupLead}</p>
      </div>
      <div className="card p-4 md:p-6">
        <LookupForm action={lookupAction} reference={reference} />
      </div>
    </main>
  );
}
