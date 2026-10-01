import Link from "next/link";
import { fr } from "@/lib/fr";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, onDark = false }: { items: Crumb[]; onDark?: boolean }) {
  return (
    <nav aria-label={fr.a11y.breadcrumb} className={`text-sm ${onDark ? "text-lilac" : "text-soft"}`}>
      <ol className="flex flex-wrap items-center">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center">
            {i > 0 && (
              <span aria-hidden="true" className="px-1.5">
                ›
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className={`inline-flex min-h-11 items-center underline md:min-h-8 ${onDark ? "text-lilac hover:text-white" : ""}`}>
                {item.label}
              </Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
