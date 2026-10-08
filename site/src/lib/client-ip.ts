/**
 * Cloudflare's published proxy ranges (https://www.cloudflare.com/ips, read 08/10/2026), the same list as the API's
 * backend/src/domain/client-ip.ts: plazo.fr's records may be proxied by Cloudflare, in which case the address the
 * platform sees is Cloudflare's and the visitor's is in cf-connecting-ip. No Node API here: the file must also load
 * in the edge runtime.
 */
const CLOUDFLARE_IPV4 = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22",
];
const CLOUDFLARE_IPV6 = ["2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32", "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"];

function ipv4Number(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((p) => p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/** The 8 groups of an IPv6 address (an embedded IPv4 tail accepted), or null. */
function ipv6Groups(ip: string): number[] | null {
  let address = ip.split("%")[0].toLowerCase();
  const v4 = /(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address);
  if (v4) {
    const [a, b, c, d] = v4.slice(1).map(Number);
    address = `${address.slice(0, v4.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const halves = address.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (halves.length === 1 ? missing !== 0 : missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...tail];
  if (groups.length !== 8 || groups.some((g) => !/^[0-9a-f]{1,4}$/.test(g))) return null;
  return groups.map((g) => parseInt(g, 16));
}

function inCidr(ip: string, cidr: string): boolean {
  const [range, bitsText] = cidr.split("/");
  const bits = Number(bitsText);
  const v4 = ipv4Number(range);
  if (v4 !== null) {
    const groups = ipv4Number(ip) === null ? ipv6Groups(ip) : null;
    const mapped = groups && groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff ? [groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff].join(".") : null;
    const a = ipv4Number(mapped ?? ip);
    if (a === null) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return ((a & mask) >>> 0) === ((v4 & mask) >>> 0);
  }
  const a = ipv6Groups(ip);
  const b = ipv6Groups(range);
  if (!a || !b) return false;
  let remaining = bits;
  for (let i = 0; i < 8 && remaining > 0; i += 1) {
    const take = Math.min(16, remaining);
    const mask = (0xffff << (16 - take)) & 0xffff;
    if ((a[i] & mask) !== (b[i] & mask)) return false;
    remaining -= 16;
  }
  return true;
}

export function isCloudflareIp(ip: string): boolean {
  return CLOUDFLARE_IPV4.some((c) => inCidr(ip, c)) || CLOUDFLARE_IPV6.some((c) => inCidr(ip, c));
}

function looksLikeIp(ip: string): boolean {
  return ipv4Number(ip) !== null || ipv6Groups(ip) !== null;
}

/** The visitor's address: cf-connecting-ip when the request came through Cloudflare's proxy, else the address seen. */
export function visitorIp(seen: string | null | undefined, cfConnectingIp: string | null | undefined): string | null {
  const cf = cfConnectingIp?.trim();
  if (seen && cf && looksLikeIp(cf) && isCloudflareIp(seen)) return cf;
  return seen || null;
}
