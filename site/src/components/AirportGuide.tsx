import { Fragment } from "react";
import { fr } from "@/lib/fr";
import type { AirportGuide as Guide } from "@/lib/airport-guides";

/** On phones the comparison stacks: each row a block, each cell under the name of its column. */
const cell = "px-5 py-3 max-sm:block max-sm:py-1 max-sm:before:block max-sm:before:text-[12px] max-sm:before:font-bold max-sm:before:tracking-[.05em] max-sm:before:text-soft max-sm:before:uppercase max-sm:before:content-[attr(data-label)]";

/** C-A (08/10/2026): the airport's guide under its partner parkings, with its "Sur cette page" list beside it. */
export function AirportGuide({ guide }: { guide: Guide }) {
  return (
    <section aria-labelledby="guide" className="flex flex-wrap items-start gap-6 md:gap-10">
      <nav aria-label={fr.guide.onThisPage} className="flex max-w-[340px] flex-[1_1_260px] flex-col gap-0.5 p-[22px] card">
        <p className="mb-1.5 text-[13px] font-extrabold tracking-[.06em] text-soft uppercase">{fr.guide.onThisPage}</p>
        {guide.sections.map(section => (
          <a key={section.id} href={`#${section.id}`} className="flex min-h-11 items-center font-semibold text-ink no-underline hover:underline md:min-h-9">
            {section.short}
          </a>
        ))}
      </nav>
      <article className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
        <h2 id="guide" className="font-title text-[28px] leading-tight md:text-[36px]">
          {guide.title}
        </h2>
        <p className="text-[17px] leading-relaxed">{guide.intro}</p>
        {guide.sections.map(section => (
          <Fragment key={section.id}>
            <h3 id={section.id} className="mt-3 scroll-mt-4 text-[20px] font-extrabold md:text-[22px]">
              {section.title}
            </h3>
            {section.paragraphs.map(text => (
              <p key={text} className="leading-relaxed">
                {text}
              </p>
            ))}
            {section.table && (
              <div className="overflow-x-auto card">
                <table className="w-full border-collapse text-[15px] max-sm:block">
                  <caption className="px-5 pt-4 pb-1.5 text-left font-extrabold max-sm:block">{section.table.caption}</caption>
                  <thead className="max-sm:hidden">
                    <tr className="text-left text-[13px] tracking-[.05em] text-soft uppercase">
                      <td className="px-5 py-2.5" />
                      {section.table.columns.map(column => (
                        <th key={column} scope="col" className="px-5 py-2.5 font-bold">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="max-sm:block">
                    {section.table.rows.map(([label, airport, partners]) => (
                      <tr key={label} className="border-t border-line align-top max-sm:block max-sm:py-2">
                        <th scope="row" className="px-5 py-3 text-left font-bold max-sm:block max-sm:pb-1">
                          {label}
                        </th>
                        <td data-label={section.table!.columns[0]} className={cell}>
                          {airport}
                        </td>
                        <td data-label={section.table!.columns[1]} className={cell}>
                          {partners}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {section.list && (
              <ul className="flex list-disc flex-col gap-1.5 pl-5 leading-relaxed">
                {section.list.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </Fragment>
        ))}
      </article>
    </section>
  );
}
