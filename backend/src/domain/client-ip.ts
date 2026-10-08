import { isIP } from 'net';

/**
 * Cloudflare's published proxy ranges (https://www.cloudflare.com/ips, read 08/10/2026). plazo.fr's DNS lives at
 * Cloudflare and its records may be proxied ("orange cloud"): the address the platform then sees is Cloudflare's, the
 * visitor's is in cf-connecting-ip. That header is trusted only when the request really came from these ranges.
 */
export const CLOUDFLARE_IPV4 = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
];
export const CLOUDFLARE_IPV6 = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
];

/** The 8 groups of an IPv6 address, or null. */
export function ipv6Groups(ip: string): number[] | null {
  let address = ip.split('%')[0].toLowerCase();
  // Embedded IPv4 (e.g. ::ffff:1.2.3.4): turn its last 32 bits into two groups.
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    address = `${address.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(':') : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill('0'), ...tail].map(g => parseInt(g, 16));
  return groups.length === 8 && groups.every(g => Number.isInteger(g) && g >= 0 && g <= 0xffff) ? groups : null;
}

/** An IPv4-mapped IPv6 address (::ffff:a.b.c.d) as its IPv4 text, else null. */
function mappedIpv4(groups: number[]): string | null {
  if (!groups.slice(0, 5).every(g => g === 0) || groups[5] !== 0xffff) return null;
  return [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join('.');
}

function ipv4Number(ip: string): number | null {
  if (isIP(ip) !== 4) return null;
  const [a, b, c, d] = ip.split('.').map(Number);
  return ((a << 24) | (b << 16) | (c << 8) | d) >>> 0;
}

/** Whether `ip` (v4, v6 or v4-mapped v6) belongs to the CIDR range. */
export function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsText] = cidr.split('/');
  const bits = Number(bitsText);
  if (!Number.isInteger(bits)) return false;
  if (isIP(range) === 4) {
    const mapped = isIP(ip) === 6 ? mappedIpv4(ipv6Groups(ip) ?? []) : null;
    const a = ipv4Number(mapped ?? ip);
    const b = ipv4Number(range);
    if (a === null || b === null || bits < 0 || bits > 32) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (a & mask) >>> 0 === (b & mask) >>> 0;
  }
  if (isIP(range) === 6 && isIP(ip) === 6) {
    const a = ipv6Groups(ip);
    const b = ipv6Groups(range);
    if (!a || !b || bits < 0 || bits > 128) return false;
    let remaining = bits;
    for (let i = 0; i < 8 && remaining > 0; i += 1) {
      const take = Math.min(16, remaining);
      const mask = (0xffff << (16 - take)) & 0xffff;
      if ((a[i] & mask) !== (b[i] & mask)) return false;
      remaining -= 16;
    }
    return true;
  }
  return false;
}

export function isCloudflareIp(ip: string): boolean {
  return CLOUDFLARE_IPV4.some(c => inCidr(ip, c)) || CLOUDFLARE_IPV6.some(c => inCidr(ip, c));
}

/**
 * The visitor's address: cf-connecting-ip when the request reached the platform through Cloudflare's proxy (the
 * address it saw is one of Cloudflare's), else the address it saw. A client cannot forge it: the header only counts
 * when the connecting address is Cloudflare's, and Cloudflare always rewrites it.
 */
export function visitorIp(seen: string | undefined | null, cfConnectingIp: string | undefined | null): string | undefined {
  const cf = cfConnectingIp?.trim();
  if (seen && cf && isIP(cf) && isCloudflareIp(seen)) return cf;
  return seen ?? undefined;
}
