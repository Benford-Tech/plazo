import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * 12/11/2026 (security): an https address Plazo's server may call on a member's say-so (the private SMS gateway): a
 * public host name only, never an IP written out, `localhost` or an internal name, so a manager cannot make the server
 * reach the platform's own network. Redirects are refused by the caller (`redirect: 'error'`).
 */
export function isPublicHttpsUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') || host.startsWith('[')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || /^0x/i.test(host) || /^\d+$/.test(host.replace(/\./g, ''))) return false;
  return !/(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain)$/.test(host);
}

/** A private, loopback, link-local or otherwise internal address (IPv4 or IPv6). */
export function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  const v6 = ip.toLowerCase();
  return v6 === '::' || v6 === '::1' || /^f[cd]/.test(v6) || /^fe[89ab]/.test(v6);
}

/**
 * Security pass of 13/11/2026: a public name may still point at an internal address (`10.0.0.1.nip.io`): every address the
 * name resolves to must be public. A name that does not resolve is let through: the call itself then fails.
 */
export async function resolvesToPublic(raw: string): Promise<boolean> {
  if (!isPublicHttpsUrl(raw)) return false;
  let addresses: { address: string }[];
  try {
    addresses = await lookup(new URL(raw).hostname, { all: true });
  } catch {
    return true;
  }
  return addresses.every(a => !isPrivateAddress(a.address));
}
