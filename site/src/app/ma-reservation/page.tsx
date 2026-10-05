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
  const reference = (param(await searchParams, "reference") ?? "").slice(0, 12);
  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-4 px-4 py-6 md:py-12">
      <section className="flex flex-col gap-2.5 rounded-[22px] bg-white p-4 md:p-6">
        <h1 className="font-title text-2xl md:text-[30px]">{fr.manage.title}</h1>
        <p className="text-sm leading-snug text-soft">{fr.manage.lookupLead}</p>
        <LookupForm action={lookupAction} reference={reference} />
      </section>
    </main>
  );
}
