import { fr } from "@/lib/fr";

/** Legal page awaiting the lawyer's text: nothing is invented here. */
export function LegalPlaceholder({ title }: { title: string }) {
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-4 px-4 py-8 md:py-12">
      <h1 className="font-title text-[30px] md:text-[40px]">{title}</h1>
      <div role="note" className="rounded-[16px] border border-danger-line bg-danger-bg p-4">
        <p className="font-bold text-danger">{fr.legal.pending}</p>
        <p className="mt-1 text-[15px]">{fr.legal.pendingText}</p>
      </div>
    </main>
  );
}
