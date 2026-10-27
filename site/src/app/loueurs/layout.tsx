import { Archivo_Narrow, Inter } from "next/font/google";
import Link from "next/link";
import { currentYear, legalLine } from "@/lib/footer";
import { fr } from "@/lib/fr";
import { COMPANY, PRODUCT_NAME } from "@/lib/product";
import { PRO_DEMO_PATH, PRO_LOGIN_PATH, PRO_PRICING_PATH } from "@/lib/site";

// Plazo Pro's pages (27/10/2026): the pro space's faces, Inter for the text and Archivo Narrow for the titles.
const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const archivo = Archivo_Narrow({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

const t = fr.proPricing;

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
      className="flex flex-1 flex-col bg-pro-ground font-pro text-pro-ink"
    >
      <header className="sticky top-0 z-30 border-b border-pro-line bg-white">
        <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-4 py-3 md:px-6">
          <Link href={PRO_PRICING_PATH} className="inline-flex min-h-11 items-center gap-1.5 no-underline" aria-label={`${PRODUCT_NAME} Pro`}>
            <span className="rounded-md bg-lime px-2.5 py-1.5 text-[18px] leading-none font-extrabold text-lime-ink">{PRODUCT_NAME}</span>
            <span className="font-pro-display text-[12px] font-bold tracking-[.12em] text-lime-deep">PRO</span>
          </Link>
          <nav aria-label={fr.a11y.mainNav} className="hidden gap-4 text-[14px] md:flex">
            <Link href={PRO_PRICING_PATH} aria-current="page" className="font-semibold text-pro-ink no-underline">
              {t.navPricing}
            </Link>
            <Link href="/" className="text-pro-soft no-underline hover:text-pro-ink">
              {t.navTravellers}
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
      <main id="loueurs" className="mx-auto w-full max-w-[1180px] flex-1 px-4 md:px-6">
        {children}
      </main>
      <footer className="bg-lime-ink text-lime-band">
        <div className="mx-auto flex max-w-[1180px] flex-wrap gap-x-10 gap-y-4 px-4 py-7 text-[13px] md:px-6">
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
          <nav aria-label={fr.footer.product} className="flex flex-wrap gap-x-4 gap-y-1">
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
