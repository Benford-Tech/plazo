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
