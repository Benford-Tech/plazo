import Link from "next/link";
import { fr } from "@/lib/fr";
import type { LegalBlock, LegalDoc } from "@/lib/legal";

const LINK = /\[([^\]]+)\]\((\/[^)]*)\)/g;

/** The reading measure of a legal text: about 65 characters. */
const MEASURE = "max-w-[34rem]";

/** A legal text with its internal links ("[label](/path)") as Next links, underlined so that colour is not their only cue. */
function Text({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    parts.push(text.slice(last, m.index));
    parts.push(
      <Link key={m.index} href={m[2]} className="font-semibold text-accent-dark underline decoration-accent-dark/35 underline-offset-[3px] hover:decoration-accent-dark">
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
      <ul className={`${MEASURE} flex list-disc flex-col gap-1.5 pl-5 marker:text-mute`}>
        {block.map(item => (
          <li key={item} className="pl-1">
            <Text text={item} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className={MEASURE}>
      <Text text={block} />
    </p>
  );
}

/** A stroked warning sign for the draft notice. */
function NoticeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={20} height={20} className="mt-px flex-none" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3.5 2.8 19.5h18.4z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </svg>
  );
}

/**
 * A legal page (terms, legal notice): title, draft notice, contents, then each section.
 * Boutique (11/10/2026): one calm column held to a 65-character measure, Playfair headings, sections parted by a
 * hairline, the draft notice in a soft amber callout (a point to watch, not an error).
 */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pt-8 pb-14 md:gap-8 md:pt-14 md:pb-20">
      <header className="flex flex-col gap-3">
        <h1 className="font-title text-[30px] leading-[1.1] text-ink lining-nums md:text-[46px]">{doc.title}</h1>
        <p className="text-[13.5px] font-semibold text-soft">{fr.legal.version(doc.version)}</p>
      </header>
      <div role="note" className="flex gap-3 rounded-field bg-warn-bg p-4 text-warn md:p-5">
        <NoticeIcon />
        <div>
          <p className="font-bold">{fr.legal.draft}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-ink">{fr.legal.draftText}</p>
        </div>
      </div>
      <p className={`${MEASURE} text-[17px] leading-[1.65] md:text-[18px]`}>{doc.lead}</p>
      {doc.sections.length > 3 && (
        <nav aria-labelledby="legal-contents" className="card px-5 pt-5 pb-2 md:px-6">
          <h2 id="legal-contents" className="eyebrow mb-1.5">
            {fr.legal.contents}
          </h2>
          <ol className="divide-y divide-line-soft">
            {/* The section titles carry their own numbers (« 1. Qui est … »). */}
            {doc.sections.map(s => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="flex min-h-11 items-center py-2.5 text-[15px] leading-snug font-semibold text-ink hover:text-accent-dark md:min-h-0 md:py-2">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-col gap-8 md:gap-10">
        {doc.sections.map(s => (
          <section
            key={s.id}
            id={s.id}
            aria-labelledby={`${s.id}-title`}
            className="flex scroll-mt-6 flex-col gap-3.5 border-t border-line pt-8 text-[16px] leading-[1.7] md:pt-10"
          >
            <h2 id={`${s.id}-title`} className={`${MEASURE} font-title text-[23px] leading-[1.2] text-ink lining-nums md:text-[27px]`}>
              {s.title}
            </h2>
            {s.blocks.map((b, i) => (
              <Block key={i} block={b} />
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
