// SEO local, measurement (06/11/2026, A + M2 of https://claude.ai/artifact/VjbSdoTMnjn4nGx1uNDipb): where a visit of the
// traveller site came from, classified in the browser from the referrer and the address, kept for the visit in a session
// cookie (first party, nothing else about the visitor), counted once by the API and joined to a booking made during it.

export type AcquisitionSource = "search" | "direct" | "referral" | "social" | "campaign";

export interface Acquisition {
  source: AcquisitionSource;
  detail: string;
  landing: string;
}

export const ACQUISITION_COOKIE = "plazo_acq";

const SEARCH_ENGINES: [RegExp, string][] = [
  [/(^|\.)google\.[a-z.]+$/, "google"],
  [/^com\.google\.android\.googlequicksearchbox$/, "google"],
  [/(^|\.)bing\.com$/, "bing"],
  [/(^|\.)duckduckgo\.com$/, "duckduckgo"],
  [/(^|\.)qwant\.com$/, "qwant"],
  [/(^|\.)ecosia\.org$/, "ecosia"],
  [/(^|\.)yahoo\.[a-z.]+$/, "yahoo"],
  [/^search\.brave\.com$/, "brave"],
  [/(^|\.)startpage\.com$/, "startpage"],
  [/(^|\.)yandex\.[a-z.]+$/, "yandex"],
];
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)facebook\.com$|^fb\.me$/, "facebook"],
  [/(^|\.)instagram\.com$/, "instagram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
  [/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "x"],
  [/(^|\.)tiktok\.com$/, "tiktok"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
  [/(^|\.)pinterest\.[a-z.]+$/, "pinterest"],
  [/(^|\.)whatsapp\.com$|^wa\.me$/, "whatsapp"],
];

const slug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function hostOf(referrer: string): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    // Android apps refer as android-app://<package>/
    return (url.protocol === "android-app:" ? url.host : url.hostname).toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** The origin of a visit, from its first page's address and the referrer. */
export function classifyVisit(href: string, referrer: string, siteHost: string): Acquisition {
  const url = new URL(href);
  const landing = url.pathname;
  const params = url.searchParams;
  const utmSource = params.get("utm_source");
  const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();
  if (params.get("gclid") || params.get("gbraid") || params.get("wbraid")) return { source: "campaign", detail: "google-ads", landing };
  if (utmSource && utmMedium !== "organic") return { source: "campaign", detail: slug(utmSource), landing };
  const host = hostOf(referrer);
  const own = siteHost.toLowerCase().replace(/^www\./, "");
  if (!host || host === own || host.endsWith(`.${own}`)) {
    if (utmSource) return { source: "search", detail: slug(utmSource), landing };
    return { source: "direct", detail: "", landing };
  }
  for (const [re, name] of SEARCH_ENGINES) if (re.test(host)) return { source: "search", detail: name, landing };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { source: "social", detail: name, landing };
  return { source: "referral", detail: slug(host), landing };
}

/** The cookie's value ("search|google|/path"), and back. */
export function encodeAcquisition(a: Acquisition): string {
  return encodeURIComponent([a.source, a.detail, a.landing].join("|"));
}

export function decodeAcquisition(value: string | undefined): Acquisition | null {
  if (!value) return null;
  let raw: string;
  try {
    raw = decodeURIComponent(value);
  } catch {
    return null;
  }
  const [source, detail = "", ...rest] = raw.split("|");
  const landing = rest.join("|");
  if (!["search", "direct", "referral", "social", "campaign"].includes(source)) return null;
  return { source: source as AcquisitionSource, detail: detail.slice(0, 60), landing: landing.slice(0, 200) };
}
