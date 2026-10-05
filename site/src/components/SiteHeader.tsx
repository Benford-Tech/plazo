import Link from "next/link";
import { fr } from "@/lib/fr";
import { Logo } from "@/components/Logo";
import { PRO_SIGNUP_PATH } from "@/lib/site";

/** T-A (05/10/2026): the header sits on the grey ground, no orange band; the logo (an orange sign) and dark links. */
export function SiteHeader() {
  return (
    <header className="bg-ground text-ink">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2 md:px-12 md:py-3">
        <Link href="/" className="flex min-h-11 items-center no-underline">
          <Logo height={32} />
        </Link>
        <nav aria-label={fr.a11y.mainNav}>
          <ul className="flex items-center gap-1 md:gap-4">
            <li className="hidden md:block">
              <a href="#aeroports" className="flex min-h-11 items-center px-2 text-[15px] font-bold text-ink no-underline hover:text-accent">
                {fr.nav.airports}
              </a>
            </li>
            <li>
              <Link href="/ma-reservation" className="flex min-h-11 items-center px-2 text-sm font-bold text-ink no-underline hover:text-accent md:text-[15px]">
                {fr.nav.myBooking}
              </Link>
            </li>
            <li className="hidden md:block">
              {/* The pro space is another service on the same domain: a full page load, not a client-side navigation. */}
              <a
                href={PRO_SIGNUP_PATH}
                className="flex min-h-11 items-center rounded-full bg-white px-4 text-[15px] font-bold text-ink no-underline shadow-[0_8px_20px_-12px_rgba(0,0,0,.35)] hover:text-accent"
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
