import Link from "next/link";
import { fr } from "@/lib/fr";
import { Logo } from "@/components/Logo";
import { PRO_SIGNUP_PATH } from "@/lib/site";

const navLink =
  "flex min-h-11 items-center px-2 text-[14px] font-bold text-ink no-underline transition-colors hover:text-accent-dark md:text-[15px]";

/** Boutique (11/10/2026): the header sits on the ivory ground, the orange sign on the left, quiet ink links on the right. */
export function SiteHeader() {
  return (
    <header className="bg-ground text-ink">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2.5 md:px-12 md:py-4">
        <Link href="/" className="flex min-h-11 items-center no-underline">
          <Logo height={30} />
        </Link>
        <nav aria-label={fr.a11y.mainNav}>
          <ul className="flex items-center gap-1 md:gap-3">
            <li className="hidden md:block">
              <a href="#aeroports" className={navLink}>
                {fr.nav.airports}
              </a>
            </li>
            <li>
              <Link href="/ma-reservation" className={navLink}>
                {fr.nav.myBooking}
              </Link>
            </li>
            <li className="hidden md:block">
              {/* The pro space is another service on the same domain: a full page load, not a client-side navigation. */}
              <a
                href={PRO_SIGNUP_PATH}
                className="flex min-h-11 items-center rounded-full border border-line bg-paper px-4 text-[14px] font-bold text-ink no-underline transition-colors hover:border-soft hover:text-ink"
              >
                {fr.nav.forOperators}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
