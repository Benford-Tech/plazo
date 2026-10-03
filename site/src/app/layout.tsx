import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { fr, texts } from "@/lib/fr";
import { paymentsOnline } from "@/lib/payments";
import { PRODUCT_NAME } from "@/lib/product";
import { openGraph } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["500"],
  variable: "--font-playfair",
  display: "swap",
});

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

export const viewport: Viewport = {
  themeColor: "#4b164c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-full bg-white px-4 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {fr.a11y.skipToContent}
        </a>
        <SiteHeader />
        <div id="contenu" className="flex flex-1 flex-col">
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
