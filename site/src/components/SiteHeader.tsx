import Link from "next/link";
import { fr } from "@/lib/fr";
import { PRODUCT_NAME } from "@/lib/product";
import { PRO_SIGNUP_PATH } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="on-dark bg-prune text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-1.5 md:px-12 md:py-2.5">
        <Link href="/" className="font-title flex min-h-11 items-center text-[26px] text-white no-underline hover:text-white md:text-[30px]">
          {PRODUCT_NAME}
        </Link>
        <nav aria-label={fr.a11y.mainNav}>
          <ul className="flex items-center gap-1 md:gap-5">
            <li className="hidden md:block">
              <a href="#aeroports" className="flex min-h-11 items-center px-1 text-[15px] font-semibold text-white no-underline hover:text-lilac">
                {fr.nav.airports}
              </a>
            </li>
            <li>
              <Link href="/ma-reservation" className="flex min-h-11 items-center px-1 text-sm font-semibold text-white no-underline hover:text-lilac md:text-[15px]">
                {fr.nav.myBooking}
              </Link>
            </li>
            <li className="hidden md:block">
              {/* The pro space is another service on the same domain: a full page load, not a client-side navigation. */}
              <a
                href={PRO_SIGNUP_PATH}
                className="flex min-h-11 items-center rounded-full border border-white/45 px-3.5 text-[15px] font-semibold text-white no-underline hover:border-white hover:text-white"
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
