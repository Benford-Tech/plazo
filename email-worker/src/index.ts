import PostalMime from "postal-mime";
import { toInboundPayload } from "./payload";

export interface Env {
  /** "https://www.plazo.fr/api/public/inbound/email" (wrangler.toml). */
  PLAZO_INBOUND_URL: string;
  /** Worker secret, the same value as INBOUND_EMAIL_SECRET on Vercel. */
  INBOUND_EMAIL_SECRET: string;
  /**
   * Optional, a verified Email Routing destination (set in the dashboard, kept across deploys by `keep_vars`): receives
   * the emails Plazo cannot take, and those sent to an address of plazo.fr that is no parking's (R-A, 08/10/2026: the
   * catch-all of the apex domain brings every address here, replies to reservations@ or contact@ included).
   */
  FALLBACK_ADDRESS?: string;
}

/**
 * Cloudflare Email Routing calls this for every email sent to <slug>@plazo.fr (catch-all of the apex domain: Cloudflare
 * offers no catch-all on a subdomain, R-A of 08/10/2026): the email is parsed and posted to Plazo with the shared secret
 * in a header. When Plazo cannot take it, or when no parking has the address, the email goes to the fallback address if
 * there is one, else it is refused so that the sender's mailbox reports the failure (nothing is lost silently).
 */
export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const raw = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(raw);
    const payload = toInboundPayload(email, { from: message.from, to: message.to });
    let failure: string | null = null;
    let unknown = false;
    try {
      if (!env.PLAZO_INBOUND_URL || !env.INBOUND_EMAIL_SECRET) throw new Error("PLAZO_INBOUND_URL or INBOUND_EMAIL_SECRET missing");
      const response = await fetch(env.PLAZO_INBOUND_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-inbound-secret": env.INBOUND_EMAIL_SECRET },
        body: JSON.stringify(payload),
      });
      if (!response.ok) failure = `Plazo answered ${response.status}`;
      else {
        // Plazo answers { received, imported, toCheck, ignored }: ignored means no parking has this address.
        const result = (await response.json().catch(() => null)) as { ignored?: number } | null;
        unknown = (result?.ignored ?? 0) > 0;
      }
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (!failure && !unknown) return;
    if (unknown) {
      if (env.FALLBACK_ADDRESS) {
        await message.forward(env.FALLBACK_ADDRESS);
        return;
      }
      message.setReject(`No mailbox for ${message.to}`);
      return;
    }
    console.error(`[plazo-email-worker] ${message.to}: ${failure}`);
    if (env.FALLBACK_ADDRESS) {
      await message.forward(env.FALLBACK_ADDRESS);
      return;
    }
    message.setReject("Plazo could not take this email right now, please try again later.");
  },
} satisfies ExportedHandler<Env>;
