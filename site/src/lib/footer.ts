import { formatPhone } from "./phone";
import {
  COMPANY,
  hasSupportEmail,
  NEWSLETTER,
  PRODUCT_NAME,
  SOCIAL,
  SUPPORT,
  SUPPORT_EMAIL,
  type Company,
  type SocialConfig,
  type SupportConfig,
} from "./product";
import { TIMEZONE } from "./site";

/**
 * Footer A (chosen by Joanny on 15/10/2026): a help card above the espresso footer, then payment, socials, the
 * newsletter and a legal line. Everything that depends on facts not given yet (support phone and hours, response
 * delay, real support address, social accounts, newsletter) comes from product.json and stays hidden while empty:
 * the public site never shows « [à compléter] » nor made-up data.
 */

export type SocialNetwork = keyof SocialConfig;

export const SOCIAL_NETWORKS: { network: SocialNetwork; label: string }[] = [
  { network: "instagram", label: "Instagram" },
  { network: "facebook", label: "Facebook" },
  { network: "linkedin", label: "LinkedIn" },
];

export interface SupportPhone {
  /** As shown: « 04 78 00 00 00 ». */
  display: string;
  /** tel: link, digits and a leading + only. */
  href: string;
}

export interface FooterConfig {
  /** The service client's line, or null while product.json has none. */
  phone: (SupportPhone & { hours: string | null }) | null;
  /** The contact form (/contact), offered only with a real support address. */
  contactForm: { responseTime: string | null } | null;
  /** The configured accounts only, in a fixed order. */
  social: { network: SocialNetwork; label: string; url: string }[];
  newsletter: boolean;
  company: Company;
}

export interface FooterSource {
  support: SupportConfig;
  social: SocialConfig;
  newsletter: boolean;
  supportEmail: string;
  company: Company;
}

const PRODUCT_SOURCE: FooterSource = { support: SUPPORT, social: SOCIAL, newsletter: NEWSLETTER, supportEmail: SUPPORT_EMAIL, company: COMPANY };

/** A phone number worth a « Appeler » button: phone characters only, at least 6 digits. */
export function supportPhone(value: string): SupportPhone | null {
  const phone = value.trim();
  if (!/^\+?[\d\s.()-]+$/.test(phone) || (phone.match(/\d/g) ?? []).length < 6) return null;
  return { display: formatPhone(phone), href: `tel:${phone.replace(/[^\d+]/g, "")}` };
}

/** An https:// address of a social account; anything else (empty, http, javascript:…) is not shown. */
export function socialUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}

const filled = (value: string) => {
  const text = value.trim();
  return text || null;
};

export function footerConfig(source: FooterSource = PRODUCT_SOURCE): FooterConfig {
  const phone = supportPhone(source.support.phone);
  return {
    phone: phone ? { ...phone, hours: filled(source.support.hours) } : null,
    contactForm: hasSupportEmail(source.supportEmail) ? { responseTime: filled(source.support.responseTime) } : null,
    social: SOCIAL_NETWORKS.flatMap(({ network, label }) => {
      const url = socialUrl(source.social[network] ?? "");
      return url ? [{ network, label, url }] : [];
    }),
    newsletter: source.newsletter === true,
    company: source.company,
  };
}

/** « Du lundi au vendredi… » read after « Notre équipe vous répond »: the first letter lowered, unless it starts an acronym. */
export function lowerFirst(text: string): string {
  return /^\p{Lu}\p{Ll}/u.test(text) ? text[0].toLocaleLowerCase("fr-FR") + text.slice(1) : text;
}

/** The year of the copyright, on the parkings' clock (a page built on 31 December at 23:30 UTC is already next year in Paris). */
export function currentYear(now: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, year: "numeric" }).format(now));
}

/**
 * The legal line: « © 2026 Benford Tech · Tous droits réservés », then the company's legal form, registration and
 * VAT number, each left out while product.json has none (`identity` null when none is known).
 */
export function legalLine(company: Company, year: number, rights: string, vat: (n: string) => string, product: string = PRODUCT_NAME) {
  const legalForm = filled(company.legalForm);
  const identity = [
    legalForm ? legalForm[0].toLocaleUpperCase("fr-FR") + legalForm.slice(1) : null,
    filled(company.registration),
    filled(company.vatNumber) ? vat(company.vatNumber.trim()) : null,
  ].filter((part): part is string => !!part);
  return {
    copyright: `© ${year} ${filled(company.name) ?? product} · ${rights}`,
    identity: identity.length ? identity.join(" · ") : null,
  };
}
