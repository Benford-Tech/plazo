// Lien d'avis Google, option B (22/11/2026): the link a parking pastes from its Google Business Profile (« Demander des
// avis »). Plazo sends it to every traveller once the car is returned; only Google's own addresses are accepted, so the
// button never leads anywhere else.

export const REVIEW_URL_MAX = 500;

const GOOGLE_HOSTS = ['google.com', 'g.page', 'goo.gl', 'maps.app.goo.gl', 'search.google.com'];

/** True for Google's review hosts: google.com and its subdomains, g.page, goo.gl, maps.app.goo.gl. */
function isGoogleHost(host: string): boolean {
  const h = host.toLowerCase();
  return GOOGLE_HOSTS.includes(h) || h.endsWith('.google.com');
}

/**
 * Reads the review link of « Ma fiche »: undefined when absent (unchanged), null when blank (removed), the address when
 * valid, or 'invalid'.
 */
export function readReviewUrl(raw: unknown): string | null | undefined | 'invalid' {
  if (raw === undefined) return undefined;
  if (raw === null) return null;
  if (typeof raw !== 'string') return 'invalid';
  const value = raw.trim();
  if (!value) return null;
  if (value.length > REVIEW_URL_MAX || /\s/.test(value)) return 'invalid';
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return 'invalid';
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !isGoogleHost(url.hostname)) return 'invalid';
  const href = url.toString();
  return href.length > REVIEW_URL_MAX ? 'invalid' : href;
}
