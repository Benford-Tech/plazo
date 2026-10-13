import Link from "next/link";
import type { AccountDeletionPage, Section } from "@/lib/account-deletion";
import { TO_COMPLETE } from "@/lib/legal";

/** « **bold** » (the words of the app) and « [label](/path) » (internal links), the rest as text. */
const MARKS = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((\/[^)]*)\)/g;

/** The reading measure of the page, as on the legal pages: about 65 characters. */
const MEASURE = "max-w-[34rem]";

function Rich({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKS)) {
    parts.push(text.slice(last, m.index));
    parts.push(
      m[1] ? (
        <strong key={m.index} className="font-bold text-ink">
          {m[1]}
        </strong>
      ) : (
        <Link
          key={m.index}
          href={m[3]}
          className="font-semibold text-accent-dark underline decoration-accent-dark/35 underline-offset-[3px] hover:decoration-accent-dark"
        >
          {m[2]}
        </Link>
      ),
    );
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}

function TextSection({ section }: { section: Section }) {
  return (
    <section
      id={section.id}
      aria-labelledby={`${section.id}-title`}
      className="flex scroll-mt-6 flex-col gap-3.5 border-t border-line pt-8 text-[16px] leading-[1.7] md:pt-10"
    >
      <h2 id={`${section.id}-title`} className={`${MEASURE} font-title text-[23px] leading-[1.2] text-ink md:text-[27px]`}>
        {section.title}
      </h2>
      {section.paragraphs.map(text => (
        <p key={text} className={MEASURE}>
          <Rich text={text} />
        </p>
      ))}
    </section>
  );
}

function ListCard({ id, title, items, tone }: { id: string; title: string; items: string[]; tone: "danger" | "ok" }) {
  return (
    <section aria-labelledby={id} className="card flex flex-col gap-3 p-5 md:p-6">
      <h2 id={id} className={`pill self-start ${tone === "danger" ? "pill-danger" : "pill-ok"}`}>
        {title}
      </h2>
      <ul className="flex list-disc flex-col gap-2 pl-5 text-[15.5px] leading-[1.6] marker:text-mute">
        {items.map(item => (
          <li key={item} className="pl-1">
            <Rich text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * /suppression-compte (13/10/2026): Boutique, one calm column like the legal pages. The steps in a white card (the
 * numbers in espresso circles), what is erased and what stays side by side on a wide screen, then the page without the
 * app, with the company's contact (« [à compléter] » while product.json leaves it empty).
 */
export function AccountDeletionView({ page }: { page: AccountDeletionPage }) {
  const { contact } = page;
  return (
    <main className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pt-8 pb-14 md:gap-8 md:pt-14 md:pb-20">
      <header className="flex flex-col gap-3">
        <p className="eyebrow">{page.eyebrow}</p>
        <h1 className="font-title text-[30px] leading-[1.1] text-ink lining-nums md:text-[46px]">{page.title}</h1>
        <p className={`${MEASURE} text-[17px] leading-[1.65] md:text-[18px]`}>{page.lead}</p>
      </header>

      <section aria-labelledby="etapes" className="card flex flex-col gap-5 p-5 md:p-7">
        <h2 id="etapes" className="font-title text-[23px] leading-[1.2] text-ink md:text-[27px]">
          {page.steps.title}
        </h2>
        <ol className="flex flex-col gap-3.5">
          {page.steps.items.map((step, i) => (
            <li key={step} className="flex items-start gap-3.5 text-[16px] leading-[1.55]">
              <span
                aria-hidden="true"
                className="mt-px flex size-7 flex-none items-center justify-center rounded-full bg-dark text-[13px] font-extrabold text-white"
              >
                {i + 1}
              </span>
              <span className="pt-0.5">
                <Rich text={step} />
              </span>
            </li>
          ))}
        </ol>
        <ul className="flex flex-col gap-2 border-t border-line-soft pt-4 text-[14.5px] leading-[1.55] text-soft">
          {page.steps.notes.map(note => (
            <li key={note}>
              <Rich text={note} />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <ListCard id="efface" title={page.deleted.title} items={page.deleted.items} tone="danger" />
        <ListCard id="reste" title={page.kept.title} items={page.kept.items} tone="ok" />
      </div>

      <TextSection section={page.definitive} />

      <section aria-labelledby="sans-application" className="flex flex-col gap-3.5 border-t border-line pt-8 text-[16px] leading-[1.7] md:pt-10">
        <h2 id="sans-application" className={`${MEASURE} font-title text-[23px] leading-[1.2] text-ink md:text-[27px]`}>
          {contact.title}
        </h2>
        <p className={MEASURE}>{contact.intro}</p>
        <address className="flex flex-col gap-1 self-start rounded-field bg-tint px-4 py-3 text-[15px] leading-[1.5] not-italic">
          <span className="font-bold text-ink">{contact.company}</span>
          {contact.email ? (
            <a href={`mailto:${contact.email}?subject=${encodeURIComponent(page.title)}`} className="link w-fit">
              {contact.email}
            </a>
          ) : (
            <span>
              {contact.emailLabel} : {TO_COMPLETE}
            </span>
          )}
          <span className="text-soft">{contact.address}</span>
        </address>
        <p className={`${MEASURE} text-[14.5px] text-soft`}>{contact.delay}</p>
      </section>

      <TextSection section={page.travellers} />
    </main>
  );
}
