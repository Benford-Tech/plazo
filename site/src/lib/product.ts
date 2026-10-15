// The product name is still a working name: it lives only in the repository's product.json.
import product from "../../../product.json";

export const PRODUCT_NAME: string = product.name;
export const SUPPORT_EMAIL: string = product.supportEmail;

/** The company that publishes the site (legal pages). Empty fields are still to be provided. */
export type Company = typeof product.company;
export const COMPANY: Company = product.company;

/**
 * The service client's phone line (footer A, 15/10/2026). Empty fields are not given yet: the site shows nothing for
 * them (never « [à compléter] »). `hours` is written to stand alone and to follow « Notre équipe vous répond », e.g.
 * « Du lundi au vendredi, de 9 h à 18 h »; `responseTime` follows « Réponse par e-mail sous », e.g. « 48 h ».
 */
export interface SupportConfig {
  phone: string;
  hours: string;
  responseTime: string;
}
export const SUPPORT: SupportConfig = product.support;

/** Plazo's accounts on the social networks (full https:// addresses); an empty one is not shown. */
export interface SocialConfig {
  instagram: string;
  facebook: string;
  linkedin: string;
}
export const SOCIAL: SocialConfig = product.social;

/** Whether the footer offers « La lettre Plazo » (Brevo list and double opt-in template set up on the API). */
export const NEWSLETTER: boolean = product.newsletter;

/** Whether the support address is a real one (product.json still holds a placeholder before launch). */
export function hasSupportEmail(email: string = SUPPORT_EMAIL): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && !/@example\.(com|org|net)$/i.test(email);
}
