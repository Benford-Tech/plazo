import Link from "next/link";
import { fr } from "@/lib/fr";
import type { AirportGuide as Guide, GuidePart, GuideSection, GuideTable } from "@/lib/airport-guides";

/*
 * Boutique (11/10/2026): the long-form pages read like an editorial page. Playfair headings, the text held to a
 * measure of about 65 characters, sections parted by a warm hairline, tables drawn with hairlines only and their
 * source in a cream band, a numbered « Sur cette page » beside the text from lg up.
 */

/*
 * Playfair Display draws old-style figures by default, which turns « P0 » into « Po »: every Playfair heading of the
 * guides asks for lining figures (lining-nums).
 */

/** The reading measure of the running text (headings, paragraphs, lists): about 65 characters. */
export const MEASURE = "max-w-[38rem]";

/** Running text of a guide. */
const PARAGRAPH = `${MEASURE} text-[16px] leading-[1.7] md:text-[17px]`;

/** A stroked arrow at the end of a « go further » link, in place of the "→" glyph. */
export function ArrowIcon({ size = 16, className = "flex-none" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/**
 * A cell of a guide table. From sm up, an ordinary cell between hairlines. On phones the table stacks: each row is a
 * block, each cell a line with the name of its column (data-label, small capitals) on the left and its value beside it.
 */
const stacked = [
  "max-sm:flex max-sm:items-baseline max-sm:gap-3 max-sm:px-0 max-sm:py-1.5",
  "max-sm:before:w-[42%] max-sm:before:flex-none max-sm:before:text-[10.5px] max-sm:before:leading-[1.35]",
  "max-sm:before:font-bold max-sm:before:tracking-[.08em] max-sm:before:text-soft max-sm:before:uppercase max-sm:before:content-[attr(data-label)]",
].join(" ");

/** A short value (a price, « Oui », « 1,90 m ») stays on one line from sm up, so that « 32,90 € » never breaks before the euro sign. */
const SHORT_CELL = 16;
/** A short column name (« 2 semaines ») stays on one line too. */
const SHORT_COLUMN = 12;

function Table({ table }: { table: GuideTable }) {
  // A wide grid (the price grid has eight durations) gets tighter cells so that it fits beside the « Sur cette page » list.
  const dense = table.columns.length >= 6;
  const padX = dense ? "px-3.5 first:pl-5 last:pr-5" : "px-5";
  return (
    <div className="card overflow-x-auto">
      <table className={`w-full border-collapse leading-snug tabular-nums max-sm:block ${dense ? "text-[14.5px]" : "text-[15px]"}`}>
        <caption className="font-title px-5 pt-5 pb-3 text-left text-[19px] leading-snug text-ink lining-nums max-sm:block max-sm:px-4 max-sm:pt-4 max-sm:text-[18px]">
          {table.caption}
        </caption>
        <thead className="max-sm:hidden">
          <tr className="eyebrow border-b border-line text-left">
            <td className={`${padX} pt-1 pb-3`} />
            {table.columns.map(column => (
              <th key={column} scope="col" className={`${padX} pt-1 pb-3 align-bottom font-bold ${column.length <= SHORT_COLUMN ? "whitespace-nowrap" : ""}`}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-sm:block max-sm:border-t max-sm:border-line">
          {table.rows.map(([label, ...cells]) => (
            <tr key={label} className="border-t border-line-soft align-top first:border-t-0 max-sm:block max-sm:px-4 max-sm:py-3">
              <th scope="row" className={`${padX} py-3.5 text-left font-bold whitespace-nowrap text-ink max-sm:block max-sm:px-0 max-sm:pt-0 max-sm:pb-1.5 max-sm:text-[15.5px] max-sm:whitespace-normal`}>
                {label}
              </th>
              {cells.map((text, i) => (
                <td key={table.columns[i]} data-label={table.columns[i]} className={`${padX} py-3.5 ${stacked} ${text.length <= SHORT_CELL ? "sm:whitespace-nowrap" : ""}`}>
                  {text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.note && <p className="border-t border-line-soft bg-tint px-5 py-3 text-[13px] leading-normal text-soft max-sm:px-4">{table.note}</p>}
    </div>
  );
}

/** The body shared by a section and its parts: paragraphs, then a table, then a list. */
function Body({ block }: { block: Pick<GuideSection, "paragraphs" | "table" | "list"> }) {
  return (
    <>
      {block.paragraphs.map(text => (
        <p key={text} className={PARAGRAPH}>
          {text}
        </p>
      ))}
      {block.table && <Table table={block.table} />}
      {block.list && (
        <ul className={`${PARAGRAPH} flex list-disc flex-col gap-2 pl-5 marker:text-mute`}>
          {block.list.map(item => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/** Heading levels of a guide: its sections under the page's h2 (airport page) or h1 (topic guide). */
type Level = 2 | 3;

function Part({ part, level }: { part: GuidePart; level: Level }) {
  const H = level === 2 ? "h3" : "h4";
  return (
    <>
      <H className={`${MEASURE} mt-3 text-[17px] leading-snug font-extrabold text-ink md:text-[18px]`}>{part.title}</H>
      <Body block={part} />
    </>
  );
}

/** The « Sur cette page » list of a guide: numbered, parted by hairlines; two columns on tablets (no hairlines then), one beside the text from lg up. */
export function GuideToc({ sections, className = "" }: { sections: GuideSection[]; className?: string }) {
  return (
    <nav aria-label={fr.guide.onThisPage} className={`card px-5 pt-5 pb-2 md:px-6 ${className}`}>
      <p className="eyebrow mb-1.5">{fr.guide.onThisPage}</p>
      <ol className="sm:columns-2 sm:gap-x-8 lg:columns-1">
        {sections.map((section, i) => (
          <li key={section.id} className="break-inside-avoid border-t border-line-soft first:border-t-0 sm:max-lg:border-t-0">
            <a
              href={`#${section.id}`}
              className="flex min-h-11 items-baseline gap-3 py-2.5 text-[14.5px] leading-snug font-semibold text-ink no-underline hover:text-accent-dark lg:min-h-0 lg:py-2"
            >
              <span aria-hidden="true" className="w-5 flex-none text-[12px] font-bold text-soft tabular-nums">
                {i + 1}
              </span>
              {section.short}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The sections of a guide, each with its anchor, body, sub-headings and « go further » link, parted by a hairline. */
export function GuideSections({ sections, level }: { sections: GuideSection[]; level: Level }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <>
      {sections.map(section => (
        <div key={section.id} className="flex flex-col gap-4 border-t border-line pt-8 first:border-t-0 first:pt-0 md:pt-10">
          <H id={section.id} className={`${MEASURE} font-title scroll-mt-6 leading-[1.15] lining-nums text-ink ${level === 2 ? "text-[26px] md:text-[32px]" : "text-[24px] md:text-[28px]"}`}>
            {section.title}
          </H>
          <Body block={section} />
          {section.parts?.map(part => <Part key={part.title} part={part} level={level} />)}
          {section.more && (
            <p className="text-[15px] leading-[1.6]">
              {/* Inline, so that the arrow follows the last word when the label wraps on a phone. */}
              <Link href={section.more.href} className="link">
                {section.more.label}
                <ArrowIcon className="ml-1.5 inline-block align-[-3px]" />
              </Link>
            </p>
          )}
        </div>
      ))}
    </>
  );
}

/**
 * The layout shared by the guides: the « Sur cette page » list, then the sections; from lg up the list stays beside
 * the text while it scrolls.
 */
export function GuideBody({ sections, level }: { sections: GuideSection[]; level: Level }) {
  return (
    <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-12">
      <GuideToc sections={sections} className="lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto" />
      <div className="flex min-w-0 flex-col gap-10 md:gap-12">
        <GuideSections sections={sections} level={level} />
      </div>
    </div>
  );
}

/** C-A (08/10/2026): the airport's guide under its partner parkings: its title and lead, then its sections beside « Sur cette page ». */
export function AirportGuide({ guide }: { guide: Guide }) {
  return (
    <section aria-labelledby="guide">
      <article className="flex flex-col gap-8 md:gap-10">
        <header className="flex flex-col gap-4">
          <h2 id="guide" className="font-title max-w-[22em] lining-nums text-[28px] leading-[1.12] text-ink md:text-[38px]">
            {guide.title}
          </h2>
          <p className={`${MEASURE} text-[17px] leading-[1.65] md:text-[18.5px]`}>{guide.intro}</p>
        </header>
        <GuideBody sections={guide.sections} level={3} />
      </article>
    </section>
  );
}
