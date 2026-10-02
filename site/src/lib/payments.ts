import "server-only";
import { backendUrl, siteApiKey } from "./api";
import type { SiteConfig } from "./types";

const REVALIDATE_SECONDS = 60;

/**
 * Whether travellers pay by card on the site (Stripe configured on the API). Texts that do not
 * depend on one booking or one parking (the default meta description, the FAQ) follow it. Cached
 * for a minute (no request headers involved), so that static pages stay static. If the API cannot
 * say, the site keeps the "paid at the parking" wording.
 */
export async function paymentsOnline(): Promise<boolean> {
  try {
    const response = await fetch(backendUrl("/api/public/config"), {
      headers: { accept: "application/json", "x-plazo-site-key": siteApiKey() },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return false;
    return ((await response.json()) as SiteConfig).payments === "online";
  } catch {
    return false;
  }
}
