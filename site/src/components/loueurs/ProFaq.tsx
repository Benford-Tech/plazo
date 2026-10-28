/**
 * Plazo Pro's questions (28/10/2026, SEO mockup 2A): an accordion of native disclosures, so every answer stays in the
 * page's HTML (read by search engines, and by the FAQPage markup next to it); the first one opens by itself.
 */
export function ProFaq({ id, title, faq }: { id: string; title: string; faq: [string, string][] }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 id={id} className="font-pro-display text-[28px] leading-tight font-bold tracking-[.02em] text-balance uppercase md:text-[34px]">
        {title}
      </h2>
      <div className="flex flex-col divide-y divide-pro-line rounded-[14px] border border-pro-line bg-white">
        {faq.map(([question, answer], index) => (
          <details key={question} open={index === 0} className="group px-5 py-1">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-2 text-[15.5px] font-semibold [&::-webkit-details-marker]:hidden">
              {question}
              <span aria-hidden="true" className="flex-none font-mono text-[18px] text-lime-deep transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="max-w-[70ch] pb-4 text-[15px] leading-relaxed text-pro-soft">{answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
