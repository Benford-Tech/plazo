/**
 * A (14/10/2026, « C puis A »): the mail service of an address, so that the setup wizard opens on its steps and its
 * settings pages. A public webmail is known by its domain; a domain of its own by its MX records (Google Workspace,
 * Microsoft 365, OVH). `business`: a domain of its own (Outlook's settings live on outlook.office.com, not
 * outlook.live.com).
 */
export type MailProviderId = 'gmail' | 'outlook' | 'ovh' | 'other';

export interface MailProviderGuess {
  id: MailProviderId;
  business: boolean;
}

const GMAIL_DOMAINS = ['gmail.com', 'googlemail.com'];
const OUTLOOK_DOMAINS = /^(outlook|hotmail|live|msn)\.[a-z.]+$/;
/** French webmails and others whose settings Plazo does not describe one by one. */
const OTHER_WEBMAILS = /^(orange|wanadoo|free|sfr|neuf|laposte|bbox|aliceadsl|yahoo|ymail|icloud|me|mac|gmx|aol|protonmail|proton)\.[a-z.]+$/;

/** The domain of an address, lower-cased; null for anything that is not one. */
export function domainOf(address: string | null | undefined): string | null {
  const lower = address?.trim().toLowerCase() ?? '';
  const at = lower.lastIndexOf('@');
  const domain = at > 0 ? lower.slice(at + 1) : '';
  return /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? domain : null;
}

/** The domains kept for examples and tests (RFC 2606): never looked up. */
export function isReservedDomain(domain: string): boolean {
  return /(^|\.)(example\.(com|net|org)|test|example|invalid|localhost)$/.test(domain);
}

/** A public webmail's domain; null for a domain of its own (its MX records tell). */
export function providerOfDomain(domain: string): MailProviderGuess | null {
  if (GMAIL_DOMAINS.includes(domain)) return { id: 'gmail', business: false };
  if (OUTLOOK_DOMAINS.test(domain)) return { id: 'outlook', business: false };
  if (OTHER_WEBMAILS.test(domain)) return { id: 'other', business: false };
  return null;
}

/** A domain of its own, from the hosts of its MX records. */
export function providerOfMx(exchanges: string[]): MailProviderGuess {
  const hosts = exchanges.map(h => h.trim().toLowerCase().replace(/\.$/, ''));
  if (hosts.some(h => /(^|\.)(google|googlemail)\.com$/.test(h))) return { id: 'gmail', business: true };
  if (hosts.some(h => /(^|\.)outlook\.com$/.test(h))) return { id: 'outlook', business: true };
  if (hosts.some(h => /(^|\.)ovh\.(net|com)$/.test(h))) return { id: 'ovh', business: true };
  return { id: 'other', business: true };
}
