import { domainToASCII } from 'node:url';

/**
 * The parking's own domain name for its site (22/11/2026, « le nom de domaine du parking »): what the manager types,
 * the DNS records to create at his registrar, and what a DNS answer says about them.
 */

/** Where a custom host must point: Vercel's shared targets for a domain whose DNS stays elsewhere. */
export const DOMAIN_CNAME_TARGET = 'cname.vercel-dns.com';
export const DOMAIN_APEX_IP = '76.76.21.21';

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** Hosts that are Plazo's or the hosting's own, never a parking's. */
const FORBIDDEN = [/(^|\.)plazo\.fr$/, /(^|\.)vercel\.app$/, /(^|\.)vercel-dns\.com$/, /(^|\.)localhost$/];
/** Public suffixes of two labels the parkings are likely to use: « exemple.co.uk » is an apex, not a subdomain. */
const TWO_LABEL_SUFFIXES = new Set(['co.uk', 'org.uk', 'com.br', 'com.au', 'co.nz', 'com.pl', 'com.es', 'com.pt', 'co.at']);

/**
 * « https://WWW.Parking-des-Cedres.fr/accueil » → « www.parking-des-cedres.fr ». Scheme, path, port and a final dot are
 * dropped; null when it is not a public host name a parking may use. 25/11/2026 (« Ce nom de domaine n'est pas valable »
 * on a real name): what a copy-paste brings along is dropped too (invisible characters, quotes, brackets, a final comma),
 * an e-mail address gives its domain, and an accented name is read in its registry form (« parking-cèdres.fr » →
 * « xn--parking-cdres-4gb.fr »), the one the DNS and the hosting know.
 */
export function readDomain(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const typed = value
    .replace(/[\u00a0\u200b-\u200d\u2060\ufeff]/g, ' ')
    .trim()
    .replace(/^[<«"'“‘(\[]+|[>»"'”’)\],;]+$/g, '')
    .trim()
    .toLowerCase()
    .replace(/^mailto:/, '')
    .replace(/^[a-z]+:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/^[^@\s]*@/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
  // Only a name with letters outside ASCII goes through the IDN conversion (it would also "repair" other typos).
  const host = /[^\x00-\x7f]/.test(typed) && !/\s/.test(typed) ? domainToASCII(typed) : typed;
  if (!host || host.length > 253) return null;
  const labels = host.split('.');
  if (labels.length < 2 || !labels.every(l => LABEL.test(l))) return null;
  // The last label is a name, never a number (an IP address is not a domain).
  if (!/^[a-z]{2,}$/.test(labels[labels.length - 1])) return null;
  if (FORBIDDEN.some(re => re.test(host))) return null;
  return host;
}

/** « parking-des-cedres.fr » and « exemple.co.uk » are apex names; « www.parking-des-cedres.fr » is not. */
export function isApex(domain: string): boolean {
  const labels = domain.split('.');
  if (labels.length === 2) return true;
  return labels.length === 3 && TWO_LABEL_SUFFIXES.has(labels.slice(1).join('.'));
}

export interface DnsRecord {
  type: 'CNAME' | 'A';
  /** What the registrar's form calls « nom » or « hôte »: « www », or « @ » for the name itself. */
  name: string;
  value: string;
}

/** The one record the manager creates at his registrar. */
export function dnsRecordFor(domain: string): DnsRecord {
  if (isApex(domain)) return { type: 'A', name: '@', value: DOMAIN_APEX_IP };
  const apexLabels = TWO_LABEL_SUFFIXES.has(domain.split('.').slice(-2).join('.')) ? 3 : 2;
  return { type: 'CNAME', name: domain.split('.').slice(0, -apexLabels).join('.'), value: DOMAIN_CNAME_TARGET };
}

export type DnsState = 'ok' | 'dns_missing' | 'dns_wrong';

/** What the DNS says: the expected record, another one, or nothing yet. */
export function dnsState(domain: string, found: { cname: string[]; a: string[] }): DnsState {
  const cname = found.cname.map(c => c.toLowerCase().replace(/\.$/, ''));
  if (cname.some(c => c === DOMAIN_CNAME_TARGET || c.endsWith('.vercel-dns.com'))) return 'ok';
  if (found.a.includes(DOMAIN_APEX_IP)) return 'ok';
  // A CNAME through another name can still land on the right address; anything else points elsewhere.
  if (cname.length === 0 && found.a.length === 0) return 'dns_missing';
  return 'dns_wrong';
}
