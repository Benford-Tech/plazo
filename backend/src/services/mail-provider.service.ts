import { promises as dns } from 'node:dns';
import { Service } from 'typedi';
import { domainOf, isReservedDomain, MailProviderGuess, providerOfDomain, providerOfMx } from '@/domain/mail-provider';

/** A domain's answer is kept a day (a failure ten minutes); the wizard asks every 5 s while it is open. */
const CACHE_MS = 24 * 3600_000;
const FAILURE_CACHE_MS = 10 * 60_000;
const LOOKUP_TIMEOUT_MS = 1500;

/**
 * A (14/10/2026): the mail service of an address — its domain for a public webmail, else its MX records. Never
 * throws: an unknown domain, a DNS failure or a slow answer gives null, and the wizard asks the manager.
 */
@Service()
export class MailProviderService {
  private cache = new Map<string, { guess: MailProviderGuess | null; until: number }>();

  public async guess(address: string | null | undefined): Promise<MailProviderGuess | null> {
    const domain = domainOf(address);
    if (!domain) return null;
    const known = providerOfDomain(domain);
    if (known) return known;
    if (isReservedDomain(domain)) return null;
    const cached = this.cache.get(domain);
    if (cached && cached.until > Date.now()) return cached.guess;
    let guess: MailProviderGuess | null = null;
    try {
      const records = await Promise.race([
        dns.resolveMx(domain),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), LOOKUP_TIMEOUT_MS).unref()),
      ]);
      guess = records.length ? providerOfMx(records.map(r => r.exchange)) : null;
    } catch {
      guess = null;
    }
    this.cache.set(domain, { guess, until: Date.now() + (guess ? CACHE_MS : FAILURE_CACHE_MS) });
    return guess;
  }
}
