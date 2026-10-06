import Link from "next/link";
import { fr } from "@/lib/fr";
import type { LegalBlock, LegalDoc } from "@/lib/legal";

const LINK = /\[([^\]]+)\]\((\/[^)]*)\)/g;

/** A legal text with its internal links ("[label](/path)") as Next links. */
function Text({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    parts.push(text.slice(last, m.index));
    parts.push(
      <Link key={m.index} href={m[2]} className="font-semibold text-accent-dark">
        {m[1]}
      </Link>,
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function Block({ block }: { block: LegalBlock }) {
  if (Array.isArray(block)) {
    return (
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {block.map(item => (
          <li key={item}>
            <Text text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p>
      <Text text={block} />
    </p>
  );
}

/** A legal page (terms, legal notice): title, draft notice, contents, then each section. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-5 px-4 py-8 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-title text-[30px] md:text-[40px]">{doc.title}</h1>
        <p className="text-sm text-soft">{fr.legal.version(doc.version)}</p>
      </header>
      <div role="note" className="rounded-[16px] border border-danger-line bg-danger-bg p-4">
        <p className="font-bold text-danger">{fr.legal.draft}</p>
        <p className="mt-1 text-[15px]">{fr.legal.draftText}</p>
      </div>
      <p className="text-[15px] leading-relaxed">{doc.lead}</p>
      {doc.sections.length > 3 && (
        <nav aria-labelledby="legal-contents" className="card p-5">
          <h2 id="legal-contents" className="mb-2 text-sm font-bold">
            {fr.legal.contents}
          </h2>
          <ol className="flex flex-col gap-1 text-[15px]">
            {doc.sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-accent-dark">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      {doc.sections.map(s => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="flex scroll-mt-6 flex-col gap-3 text-[15px] leading-relaxed">
          <h2 id={`${s.id}-title`} className="mt-2 text-lg font-extrabold">
            {s.title}
          </h2>
          {s.blocks.map((b, i) => (
            <Block key={i} block={b} />
          ))}
        </section>
      ))}
    </main>
  );
}
