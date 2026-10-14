import { Delivery } from './inbound-delivery';

/**
 * C (14/10/2026, « C puis A »): one line per comparator in the Mails entrants block — the last email Plazo received
 * from it and how its emails arrive: `direct` (the comparator writes to the Plazo address: nothing to set in the
 * mailbox), `forwarded` (a rule of the parking's mailbox), `manual` (forwarded by hand only), `unknown` (received
 * before Plazo told them apart), `none` (nothing received).
 */
export type ComparatorArrival = Delivery | 'unknown' | 'none';

export interface ComparatorRow {
  provider: string | null;
  fromAddress: string | null;
  status: string;
  delivery: Delivery | null;
  receivedAt: Date;
}

export interface ComparatorState {
  provider: string;
  lastReceivedAt: string | null;
  lastStatus: string | null;
  arrival: ComparatorArrival;
}

/** A direct email within this many days says the comparator writes to Plazo, even if forwarded copies came since. */
export const DIRECT_WINDOW_DAYS = 30;

/** The comparator an email comes from: the one its importer (or Claude) named, else the one its sender's domain names. */
export function comparatorOf(row: Pick<ComparatorRow, 'provider' | 'fromAddress'>, providers: string[]): string | null {
  const named = providers.find(p => p.toLowerCase() === row.provider?.trim().toLowerCase());
  if (named) return named;
  const address = row.fromAddress?.trim().toLowerCase() ?? '';
  const domain = address.slice(address.lastIndexOf('@') + 1);
  return (domain && providers.find(p => domain.includes(p.toLowerCase()))) || null;
}

/** The comparators' lines, in the order of `providers`; `rows` newest first (any order works). */
export function comparatorStates(rows: ComparatorRow[], providers: string[], now: Date): ComparatorState[] {
  const since = now.getTime() - DIRECT_WINDOW_DAYS * 86400000;
  const sorted = [...rows].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  return providers.map(provider => {
    const own = sorted.filter(r => comparatorOf(r, providers) === provider);
    const last = own[0];
    if (!last) return { provider, lastReceivedAt: null, lastStatus: null, arrival: 'none' };
    const direct = own.some(r => r.delivery === 'direct' && r.receivedAt.getTime() >= since);
    return {
      provider,
      lastReceivedAt: last.receivedAt.toISOString(),
      lastStatus: last.status,
      arrival: direct ? 'direct' : (last.delivery ?? 'unknown'),
    };
  });
}

/**
 * A (14/10/2026): the latest email that a comparator's own sending or a mailbox rule brought (never one forwarded by
 * hand): the wizard's « Premier mail d'un comparateur » is ticked by it.
 */
export function latestAutomatic(rows: ComparatorRow[], providers: string[]): { at: string; provider: string } | null {
  const sorted = [...rows].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  for (const row of sorted) {
    if (row.delivery === 'manual') continue;
    const provider = comparatorOf(row, providers);
    if (provider) return { at: row.receivedAt.toISOString(), provider };
  }
  return null;
}
