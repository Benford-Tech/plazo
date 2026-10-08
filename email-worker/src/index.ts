import PostalMime from "postal-mime";
import { toInboundPayload } from "./payload";

export interface Env {
  /** "https://www.plazo.fr/api/public/inbound/email" (wrangler.toml). */
  PLAZO_INBOUND_URL: string;
  /** Worker secret, the same value as INBOUND_EMAIL_SECRET on Vercel. */
  INBOUND_EMAIL_SECRET: string;
  /** Optional: a verified Email Routing destination that keeps the email when Plazo cannot take it. */
  FALLBACK_ADDRESS?: string;
}

/**
 * Cloudflare Email Routing calls this for every email sent to <slug>@in.plazo.fr: the email is parsed and posted
 * to Plazo with the shared secret in a header. When Plazo cannot take it, the email goes to the fallback address
 * if there is one, else it is refused so that the sender's mailbox reports the failure (nothing is lost silently).
 */
export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const raw = await new Response(message.raw).arrayBuffer();
    const email = await PostalMime.parse(raw);
    const payload = toInboundPayload(email, { from: message.from, to: message.to });
    let failure: string | null = null;
    try {
      if (!env.PLAZO_INBOUND_URL || !env.INBOUND_EMAIL_SECRET) throw new Error("PLAZO_INBOUND_URL or INBOUND_EMAIL_SECRET missing");
      const response = await fetch(env.PLAZO_INBOUND_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "x-inbound-secret": env.INBOUND_EMAIL_SECRET },
        body: JSON.stringify(payload),
      });
      if (!response.ok) failure = `Plazo answered ${response.status}`;
    } catch (error) {
      failure = error instanceof Error ? error.message : String(error);
    }
    if (!failure) return;
    console.error(`[plazo-email-worker] ${message.to}: ${failure}`);
    if (env.FALLBACK_ADDRESS) {
      await message.forward(env.FALLBACK_ADDRESS);
      return;
    }
    message.setReject("Plazo could not take this email right now, please try again later.");
  },
} satisfies ExportedHandler<Env>;
