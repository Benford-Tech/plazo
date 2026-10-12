import Link from "next/link";
import { fr } from "@/lib/fr";
import { Logo } from "@/components/Logo";
import { topicLinks } from "@/lib/guides";
import { hasSupportEmail, SUPPORT_EMAIL } from "@/lib/product";
import { AIRPORTS, airportPath, PRO_SIGNUP_PATH } from "@/lib/site";

// 44 px targets on phones (20 px line + 2 x 12 px), with the same spacing whether a label takes one line or two.
const linkClass =
  "block w-fit py-3 text-[14px] leading-5 font-medium text-lilac/85 no-underline underline-offset-4 transition-colors hover:text-white hover:underline md:py-1.5";

function Column({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="flex flex-col gap-1">
      <h2 className="eyebrow mb-1 text-lilac/60">{title}</h2>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );
}

/** Boutique (11/10/2026): an espresso footer with hairlines, the pitch set in Playfair, the column titles in small capitals. */
export function SiteFooter() {
  return (
    <footer className="on-dark mt-auto bg-dark text-lilac">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-6 gap-y-8 px-4 pt-10 pb-12 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-10 md:px-12 md:pt-14 md:pb-16">
        <div className="col-span-2 flex flex-col gap-4 border-b border-white/10 pb-8 md:col-span-1 md:border-b-0 md:pb-0">
          <Logo height={30} className="self-start" />
          <p className="font-title max-w-sm text-[19px] leading-snug text-lilac md:text-[21px]">{fr.footer.pitch}</p>
        </div>
        <Column id="aeroports" title={fr.footer.airports}>
          {AIRPORTS.map(a => (
            <li key={a.slug}>
              <Link href={airportPath(a.slug)} className={linkClass}>
                {a.name}
              </Link>
            </li>
          ))}
          <li className="py-3 text-[14px] leading-5 text-lilac/60 md:py-1.5">{fr.footer.moreAirports}</li>
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
          {/* The topic guides of each airport (09/10/2026), linked from every page. */}
          {AIRPORTS.flatMap(a =>
            topicLinks(a.slug).map(topic => (
              <li key={topic.href}>
                <Link href={topic.href} className={linkClass}>
                  {fr.guide.footerLink(topic.short, a.name)}
                </Link>
              </li>
            )),
          )}
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
