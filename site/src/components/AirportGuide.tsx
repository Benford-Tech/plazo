import Link from "next/link";
import { Fragment } from "react";
import { fr } from "@/lib/fr";
import type { AirportGuide as Guide, GuidePart, GuideSection, GuideTable } from "@/lib/airport-guides";

/** On phones a table stacks: each row a block, each cell under the name of its column. */
const cell = "px-5 py-3 max-sm:block max-sm:py-1 max-sm:before:block max-sm:before:text-[12px] max-sm:before:font-bold max-sm:before:tracking-[.05em] max-sm:before:text-soft max-sm:before:uppercase max-sm:before:content-[attr(data-label)]";

function Table({ table }: { table: GuideTable }) {
  return (
    <div className="overflow-x-auto card">
      <table className="w-full border-collapse text-[15px] max-sm:block">
        <caption className="px-5 pt-4 pb-1.5 text-left font-extrabold max-sm:block">{table.caption}</caption>
        <thead className="max-sm:hidden">
          <tr className="text-left text-[13px] tracking-[.05em] text-soft uppercase">
            <td className="px-5 py-2.5" />
            {table.columns.map(column => (
              <th key={column} scope="col" className="px-5 py-2.5 font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-sm:block">
          {table.rows.map(([label, ...cells]) => (
            <tr key={label} className="border-t border-line align-top max-sm:block max-sm:py-2">
              <th scope="row" className="px-5 py-3 text-left font-bold whitespace-nowrap max-sm:block max-sm:pb-1">
                {label}
              </th>
              {cells.map((text, i) => (
                <td key={table.columns[i]} data-label={table.columns[i]} className={cell}>
                  {text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.note && <p className="px-5 pt-2 pb-4 text-[13px] leading-normal text-soft">{table.note}</p>}
    </div>
  );
}

/** The body shared by a section and its parts: paragraphs, then a table, then a list. */
function Body({ block }: { block: Pick<GuideSection, "paragraphs" | "table" | "list"> }) {
  return (
    <>
      {block.paragraphs.map(text => (
        <p key={text} className="leading-relaxed">
          {text}
        </p>
      ))}
      {block.table && <Table table={block.table} />}
      {block.list && (
        <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
          {block.list.map(item => (
            <li key={item}>{item}</li>
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
      <H className="mt-2 text-[17px] font-extrabold">{part.title}</H>
      <Body block={part} />
    </>
  );
}

/** The « Sur cette page » list of a guide. */
export function GuideToc({ sections, className = "" }: { sections: GuideSection[]; className?: string }) {
  return (
    <nav aria-label={fr.guide.onThisPage} className={`flex flex-col gap-0.5 p-[22px] card ${className}`}>
      <p className="mb-1.5 text-[13px] font-extrabold tracking-[.06em] text-soft uppercase">{fr.guide.onThisPage}</p>
      {sections.map(section => (
        <a key={section.id} href={`#${section.id}`} className="flex min-h-11 items-center font-semibold text-ink no-underline hover:underline md:min-h-9">
          {section.short}
        </a>
      ))}
    </nav>
  );
}

/** The sections of a guide, each with its anchor, body, sub-headings and « go further » link. */
export function GuideSections({ sections, level }: { sections: GuideSection[]; level: Level }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <>
      {sections.map(section => (
        <Fragment key={section.id}>
          <H id={section.id} className={`mt-3 scroll-mt-4 font-extrabold ${level === 2 ? "text-[22px] md:text-[26px]" : "text-[20px] md:text-[22px]"}`}>
            {section.title}
          </H>
          <Body block={section} />
          {section.parts?.map(part => <Part key={part.title} part={part} level={level} />)}
          {section.more && (
            <p>
              <Link href={section.more.href} className="font-semibold">
                {section.more.label} →
              </Link>
            </p>
          )}
        </Fragment>
      ))}
    </>
  );
}

/** C-A (08/10/2026): the airport's guide under its partner parkings, with its "Sur cette page" list beside it. */
export function AirportGuide({ guide }: { guide: Guide }) {
  return (
    <section aria-labelledby="guide" className="flex flex-wrap items-start gap-6 md:gap-10">
      <GuideToc sections={guide.sections} className="max-w-[340px] flex-[1_1_260px] md:sticky md:top-4" />
      <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
        <h2 id="guide" className="font-title text-[28px] leading-tight md:text-[36px]">
          {guide.title}
        </h2>
        <p className="text-[17px] leading-relaxed">{guide.intro}</p>
        <GuideSections sections={guide.sections} level={3} />
      </article>
    </section>
  );
}
