import Link from "next/link";
import { fr } from "@/lib/fr";

export interface Crumb {
  label: string;
  href?: string;
}

/** A thin stroked chevron between two crumbs (Boutique: drawn pictograms instead of typographic glyphs). */
function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-1.5 size-3 flex-none" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** The breadcrumb: wraps on narrow screens rather than being cut, links in warm grey, the current page in ink. */
export function Breadcrumb({ items, onDark = false }: { items: Crumb[]; onDark?: boolean }) {
  return (
    <nav aria-label={fr.a11y.breadcrumb} className={`text-[13px] font-semibold ${onDark ? "text-lilac/80" : "text-soft"}`}>
      <ol className="flex flex-wrap items-center">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center">
            {i > 0 && (
              <span className={onDark ? "text-lilac/50" : "text-mute"}>
                <Chevron />
              </span>
            )}
            {item.href ? (
              <Link
                href={item.href}
                className={`inline-flex min-h-11 items-center underline underline-offset-4 transition-colors md:min-h-8 ${
                  onDark ? "text-lilac/80 decoration-lilac/40 hover:text-white" : "text-soft decoration-mute hover:text-accent-dark"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className={onDark ? "text-white" : "text-ink"}>
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
