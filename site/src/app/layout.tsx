import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Playfair_Display } from "next/font/google";
import { HiddenOn } from "@/components/HiddenOn";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fr, texts } from "@/lib/fr";
import { paymentsOnline } from "@/lib/payments";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { OPERATORS_PREFIX, siteUrl } from "@/lib/site";
import "./globals.css";

// Boutique (11/10/2026): Manrope for the text and the prices, Playfair Display regular (no more italic) for the
// titles, JetBrains Mono for the hours only.
const manrope = Manrope({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-manrope", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400"], variable: "--font-playfair", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["500"], variable: "--font-jetbrains", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  // The default description says how travellers pay (asked to the API; at the parking if it cannot say).
  const online = await paymentsOnline();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: fr.meta.defaultTitle, template: `%s · ${PRODUCT_NAME}` },
    description: texts(online).meta.defaultDescription,
    applicationName: PRODUCT_NAME,
    openGraph: openGraph({}),
    formatDetection: { telephone: false, email: false, address: false },
  };
}

// The browser bar takes the ivory ground of the page (--color-ground).
export const viewport: Viewport = {
  themeColor: "#f7f3ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${manrope.variable} ${playfair.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-full border border-line bg-paper px-5 py-3 text-[15px] font-bold text-ink no-underline shadow-float focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          {fr.a11y.skipToContent}
        </a>
        {/* Plazo Pro's pages (/loueurs) carry their own header and footer. */}
        <HiddenOn prefixes={[OPERATORS_PREFIX]}>
          <SiteHeader />
        </HiddenOn>
        <div id="contenu" className="flex flex-1 flex-col">
          {children}
        </div>
        <HiddenOn prefixes={[OPERATORS_PREFIX]}>
          <SiteFooter />
        </HiddenOn>
      </body>
    </html>
  );
}
