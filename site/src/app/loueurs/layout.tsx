import { Archivo_Narrow, Inter } from "next/font/google";
import Link from "next/link";
import { currentYear, legalLine } from "@/lib/footer";
import { fr } from "@/lib/fr";
import { COMPANY, PRODUCT_NAME } from "@/lib/product";
import { PRO_HOME_SECTIONS } from "@/components/loueurs/ProHome";
import { PRO_DEMO_PATH, PRO_HOME_PATH, PRO_LOGIN_PATH, PRO_PRICING_PATH, PRO_SIGNUP_PATH } from "@/lib/site";

// Plazo Pro's pages (27/10/2026): the pro space's faces, Inter for the text and Archivo Narrow for the titles.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const archivo = Archivo_Narrow({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

const t = fr.proPricing;
const h = fr.proHome;

/** The home page's sections, then the pricing page (the header's menu and the footer's « Solutions »). */
const SOLUTIONS = [
  { href: `${PRO_HOME_PATH}#${PRO_HOME_SECTIONS.software}`, label: h.nav.software },
  { href: `${PRO_HOME_PATH}#${PRO_HOME_SECTIONS.live}`, label: h.nav.live },
  { href: `${PRO_HOME_PATH}#${PRO_HOME_SECTIONS.marketplace}`, label: h.nav.marketplace },
  { href: `${PRO_HOME_PATH}#${PRO_HOME_SECTIONS.paperwork}`, label: h.nav.paperwork },
];

/**
 * The operators' pages wear the pro space's colours (grey-green ground, lime, dark green) and their own header and
 * footer: the travellers' header and footer are left out on /loueurs (HiddenOn in the root layout).
 */
export default function OperatorsLayout({ children }: { children: React.ReactNode }) {
  const legal = legalLine(COMPANY, currentYear(), fr.footer.rights, fr.footer.vat);
  return (
    <div
      // The faces are set here, where next/font defines them (a value read on :root would not see them).
      style={{ "--font-pro": `${inter.style.fontFamily}, system-ui, sans-serif`, "--font-pro-display": `${archivo.style.fontFamily}, "Arial Narrow", sans-serif` } as React.CSSProperties}
      data-pro-site
      className="flex flex-1 flex-col bg-pro-ground font-pro text-pro-ink"
    >
      <header className="sticky top-0 z-30 border-b border-pro-line bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-4 py-3 md:px-6">
          <Link href={PRO_HOME_PATH} className="inline-flex min-h-11 items-center gap-1.5 no-underline" aria-label={`${PRODUCT_NAME} Pro`}>
            <span className="rounded-md bg-lime px-2.5 py-1.5 text-[18px] leading-none font-extrabold text-lime-ink">{PRODUCT_NAME}</span>
            <span className="font-pro-display text-[12px] font-bold tracking-[.12em] text-lime-deep">PRO</span>
          </Link>
          <nav aria-label={fr.a11y.mainNav} className="hidden gap-4 text-[14px] lg:flex">
            {SOLUTIONS.map(link => (
              <Link key={link.href} href={link.href} className="font-semibold text-pro-ink no-underline hover:text-lime-deep">
                {link.label}
              </Link>
            ))}
            <Link href={PRO_PRICING_PATH} className="font-semibold text-pro-ink no-underline hover:text-lime-deep">
              {t.navPricing}
            </Link>
          </nav>
          <span className="flex-1" />
          {/* The pro space is another service on the same domain: full page loads. */}
          <a href={PRO_LOGIN_PATH} className="hidden text-[14px] text-pro-ink no-underline hover:underline sm:inline">
            {t.login}
          </a>
          <a href={PRO_DEMO_PATH} className="inline-flex min-h-11 items-center rounded-[10px] bg-lime px-4 text-[14px] font-semibold text-lime-ink no-underline">
            {t.tryDemo}
          </a>
        </div>
      </header>
      <main id="loueurs" className="flex w-full flex-1 flex-col">
        {children}
      </main>
      <footer className="bg-lime-ink text-lime-band">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-x-10 gap-y-5 px-4 py-7 text-[13px] md:px-6 lg:grid-cols-[1.2fr_1.6fr_1fr_1fr_1fr]">
          <div>
            <b className="font-pro-display tracking-[.06em] text-lime">{PRODUCT_NAME.toUpperCase()} PRO</b>
            <br />
            {t.footerPitch}
          </div>
          <div>
            {legal.copyright}
            {legal.identity && (
              <>
                <br />
                {legal.identity}
              </>
            )}
          </div>
          <nav aria-label={h.footer.solutions} className="flex flex-col gap-1">
            <b className="text-[12px] tracking-[.08em] text-lime uppercase">{h.footer.solutions}</b>
            {SOLUTIONS.map(link => (
              <Link key={link.href} href={link.href} className="text-lime-band">
                {link.label}
              </Link>
            ))}
          </nav>
          <nav aria-label={h.footer.start} className="flex flex-col gap-1">
            <b className="text-[12px] tracking-[.08em] text-lime uppercase">{h.footer.start}</b>
            <a href={PRO_DEMO_PATH} className="text-lime-band">
              {t.tryDemo}
            </a>
            <Link href={PRO_PRICING_PATH} className="text-lime-band">
              {t.navPricing}
            </Link>
            <a href={PRO_SIGNUP_PATH} className="text-lime-band">
              {t.signup}
            </a>
            <a href={PRO_LOGIN_PATH} className="text-lime-band">
              {t.login}
            </a>
          </nav>
          <nav aria-label={fr.footer.product} className="flex flex-col gap-1">
            <b className="text-[12px] tracking-[.08em] text-lime uppercase">{h.footer.plazo}</b>
            <Link href="/" className="text-lime-band">
              {h.footer.travellers}
            </Link>
            <Link href="/mentions-legales" className="text-lime-band">
              {fr.footer.legal}
            </Link>
            <Link href="/conditions" className="text-lime-band">
              {fr.footer.terms}
            </Link>
            <Link href="/confidentialite" className="text-lime-band">
              {fr.footer.privacy}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
