import Link from "next/link";
import { fr } from "@/lib/fr";
import { Logo } from "@/components/Logo";
import { hasSupportEmail, SUPPORT_EMAIL } from "@/lib/product";
import { AIRPORTS, airportPath, PRO_SIGNUP_PATH } from "@/lib/site";

const linkClass = "inline-flex min-h-11 items-center text-sm text-lilac no-underline hover:text-white hover:underline md:min-h-8";

function Column({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="flex flex-col gap-0.5 md:gap-1">
      <h2 className="mb-1 text-sm font-bold text-white">{title}</h2>
      <ul className="flex flex-col md:gap-1">{children}</ul>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="on-dark mt-auto bg-dark text-lilac">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-8 px-4 py-8 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-8 md:px-12">
        <div className="col-span-2 flex flex-col gap-2 md:col-span-1">
          <Logo height={32} className="self-start" />
          <p className="max-w-md text-sm leading-normal">{fr.footer.pitch}</p>
        </div>
        <Column id="aeroports" title={fr.footer.airports}>
          {AIRPORTS.map(a => (
            <li key={a.slug}>
              <Link href={airportPath(a.slug)} className={linkClass}>
                {a.name}
              </Link>
            </li>
          ))}
          <li className="flex min-h-11 items-center text-sm md:min-h-8">{fr.footer.moreAirports}</li>
        </Column>
        <Column title={fr.footer.travellers}>
          <li>
            <Link href="/ma-reservation" className={linkClass}>
              {fr.nav.myBooking}
            </Link>
          </li>
          <li>
            <Link href="/#faq" className={linkClass}>
              {fr.footer.faq}
            </Link>
          </li>
          {/* Hidden while product.json holds a placeholder address: a dead mailto helps nobody. */}
          {hasSupportEmail() && (
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
                {fr.footer.contact}
              </a>
            </li>
          )}
        </Column>
        <Column title={fr.footer.product}>
          <li>
            <a href={PRO_SIGNUP_PATH} className={linkClass}>
              {fr.nav.forOperators}
            </a>
          </li>
          <li>
            <Link href="/conditions" className={linkClass}>
              {fr.footer.terms}
            </Link>
          </li>
          <li>
            <Link href="/confidentialite" className={linkClass}>
              {fr.footer.privacy}
            </Link>
          </li>
          <li>
            <Link href="/mentions-legales" className={linkClass}>
              {fr.footer.legal}
            </Link>
          </li>
        </Column>
      </div>
    </footer>
  );
}
