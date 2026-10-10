import { forwardedRecipientsOf } from '../inbound-email';
import { isCancellationOrChange } from './common';
import { isComparatorAddress } from './index';
import { ParsedBooking } from './types';

/**
 * 10/10/2026 (« il faut naviguer vers [la page de la réservation] pour récupérer les infos des réservations
 * Allopark »): Allopark's confirmation emails leave « Vos informations » blank (passengers, plate, phone, name…);
 * the booking page they link to (« Consulter ma réservation »: /fr-be/confirmation?email=…&reference=AL-…&view=parking)
 * shows them in its edit form, without a login. Pure helpers: which page to open, what its form says.
 */

export const ALLOPARK_ORIGIN = 'https://www.allopark.com';
const ALLOPARK_HOSTS = ['www.allopark.com', 'allopark.com'];
const DEFAULT_LOCALE = 'fr-be';
/**
 * Never more pages than this per email: the email's own link, else one page per candidate address
 * (alloparkPageAddresses); 10/10/2026: 3 (2 before), within one 8 s budget for every page and redirect.
 */
export const MAX_PAGES = 3;

const REFERENCE = /^AL-\d{6,}$/;
/** An Allopark reference in an email's subject or text. */
const REFERENCE_IN_EMAIL = /\bAL-\d{6,}\b/;
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;

/** True for an https page of allopark.com: the only site Plazo opens on an email's behalf. */
export function isAlloparkUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' && ALLOPARK_HOSTS.includes(parsed.hostname.toLowerCase()) && !parsed.username && !parsed.password && !parsed.port
    );
  } catch {
    return false;
  }
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');
}

function pageUrl(locale: string, params: { email: string; reference: string; view?: string | null }): string {
  const query = new URLSearchParams({ email: params.email, reference: params.reference });
  if (params.view) query.set('view', params.view);
  return `${ALLOPARK_ORIGIN}/${locale.toLowerCase()}/confirmation?${query.toString()}`;
}

/** At most this many links are kept per email (stored for a re-analysis), each at most this long. */
export const MAX_LINKS = 10;
const LINK_MAX_CHARS = 500;
const LOCALE_PATH = /^\/([a-z]{2}(?:-[a-z]{2})?)\/(confirmation\/?$)?/i;

/**
 * The allopark.com links of an email (its HTML and text parts, entities decoded), deduplicated, confirmation pages
 * first. 10/10/2026 (« pouvoir relancer l'analyse d'un mail »): they are stored with the email so that a re-analysis
 * still finds its page; a link that is not a confirmation page only gives the site's language, so its query (a
 * customer's name and address in « Contactez-nous », an unsubscribe token) is dropped.
 */
export function alloparkLinks(html?: string | null, text?: string | null): string[] {
  const content = decodeEntities(`${html ?? ''}\n${text ?? ''}`);
  const found = [...content.matchAll(/https?:\/\/(?:www\.)?allopark\.com\/[^\s"'<>()\[\]]*/gi)].map(m => m[0]);
  const confirmations: string[] = [];
  const others: string[] = [];
  for (const link of found) {
    let url: URL;
    try {
      url = new URL(link);
    } catch {
      continue;
    }
    const confirmation = !!LOCALE_PATH.exec(url.pathname)?.[2];
    const kept = confirmation ? link : `${url.protocol}//${url.host}${url.pathname}`;
    if (kept.length <= LINK_MAX_CHARS) (confirmation ? confirmations : others).push(kept);
  }
  return [...new Set([...confirmations, ...others])].slice(0, MAX_LINKS);
}

/** An allopark.com link of the email, as a URL (http made https), or null for any other link. */
function alloparkUrlOf(link: string): URL | null {
  try {
    const url = new URL(link.replace(/^http:/i, 'https:'));
    return isAlloparkUrl(url.toString()) ? url : null;
  } catch {
    return null;
  }
}

/**
 * The email's link to this booking's confirmation page (« Consulter ma réservation »), rebuilt on www.allopark.com with
 * only its email, reference and view, so nothing else of the link is followed; null when the email has none (or one
 * for another booking, or without a valid address). `links` come from alloparkLinks().
 */
export function alloparkConfirmationPage(links: string[], reference: string): string | null {
  const ref = reference.trim().toUpperCase();
  if (!REFERENCE.test(ref)) return null;
  for (const link of links) {
    const url = alloparkUrlOf(link);
    const path = url ? LOCALE_PATH.exec(url.pathname) : null;
    if (!url || !path?.[2]) continue;
    const email = url.searchParams.get('email')?.trim();
    if (url.searchParams.get('reference')?.trim().toUpperCase() !== ref || !email || !EMAIL.test(email)) continue;
    const view = url.searchParams.get('view');
    return pageUrl(path[1], { email, reference: ref, view: view && /^[a-z]{1,20}$/i.test(view) ? view : null });
  }
  return null;
}

/** The site's language the email's links use (the parking's page, « Contactez-nous »): the last one given. */
function localeOf(links: string[]): string {
  let locale = DEFAULT_LOCALE;
  for (const link of links) {
    const url = alloparkUrlOf(link);
    const path = url ? LOCALE_PATH.exec(url.pathname) : null;
    if (path) locale = path[1];
  }
  return locale;
}

/** A candidate address for a booking page: a valid address, neither Plazo's (`excludeDomain`) nor a comparator's. */
function isCandidate(address: string, excludeDomain?: string): boolean {
  const excluded = excludeDomain ? `@${excludeDomain.toLowerCase()}` : null;
  return EMAIL.test(address) && !(excluded && address.endsWith(excluded)) && !isComparatorAddress(address);
}

/**
 * The pages to open for this booking, most likely first: the email's link to its confirmation page
 * (alloparkConfirmationPage), else the page built from the reference and each candidate address, at most MAX_PAGES
 * (the parking's own mailbox: the link Allopark gives the parking carries that address and view=parking; see
 * alloparkPageAddresses). Addresses on `excludeDomain` (Plazo's inbound addresses) and the comparators' addresses are
 * never used.
 */
export function alloparkPageUrls(input: { links: string[]; reference: string; addresses: string[]; excludeDomain?: string }): string[] {
  const reference = input.reference.trim().toUpperCase();
  if (!REFERENCE.test(reference)) return [];
  const linked = alloparkConfirmationPage(input.links, reference);
  if (linked) return [linked];
  const locale = localeOf(input.links);
  const addresses = [...new Set(input.addresses.map(a => a.trim().toLowerCase()))].filter(a => isCandidate(a, input.excludeDomain));
  return addresses.slice(0, MAX_PAGES).map(email => pageUrl(locale, { email, reference, view: 'parking' }));
}

/** Where the parking's mailbox may be found, for an email without its confirmation link. */
export interface PageCandidates {
  /** a. The addresses the email itself was sent to (its To and Cc: ownRecipientsOf). */
  recipients: string[];
  /** b. The email's text: the header of a forwarded message names the mailbox it was sent to (forwardedRecipientsOf). */
  text: string;
  /** c. The sender: the parking's mailbox for an email forwarded by hand (a comparator's address is dropped). */
  from: string | null;
  /** d. The Gmail boxes that asked to forward to the Plazo address. */
  requesters: string[];
  /** e. The operator's active managers' addresses. */
  managers: string[];
}

/**
 * 10/10/2026 (« les mails de Allopark ne sont toujours pas complets, tu ne vas pas chercher dans les liens »): the
 * addresses whose booking page is tried, in this order: the email's own recipients, the recipients of the forwarded
 * message's header, the sender, the Gmail boxes that forward to Plazo, the managers; lower-cased, deduplicated, never
 * Plazo's (`excludeDomain`) nor a comparator's. An email forwarded by hand is sent to the Plazo address only: its
 * header, its sender or the manager's address then lead to the page.
 */
export function alloparkPageAddresses(input: PageCandidates, excludeDomain?: string): string[] {
  const all = [
    ...input.recipients,
    ...forwardedRecipientsOf(input.text),
    ...(input.from ? [input.from] : []),
    ...input.requesters,
    ...input.managers,
  ];
  return [...new Set(all.map(a => a.trim().toLowerCase()))].filter(a => isCandidate(a, excludeDomain));
}

/**
 * 10/10/2026: the Allopark reference whose booking page is worth opening, or null: an email that names Allopark (in
 * its text, subject or sender) and carries an Allopark reference (subject first, then text), that is no cancellation
 * or change (never a booking from the page for those). The importer may not have recognised it (« Allopark » only in
 * the sender, the reference only in the subject); the caller opens the page only when no importer read it in full.
 */
export function alloparkReferenceOf(email: {
  text: string;
  subject: string | null;
  /** The sender's name and address. */
  from: string | null;
}): string | null {
  const subject = email.subject ?? '';
  if (!/allopark/i.test(`${subject}\n${email.text}\n${email.from ?? ''}`)) return null;
  if (isCancellationOrChange(`${subject}\n${email.text}`)) return null;
  return REFERENCE_IN_EMAIL.exec(subject)?.[0] ?? REFERENCE_IN_EMAIL.exec(email.text)?.[0] ?? null;
}

/** The value of a named input of the form, decoded; undefined when the input is missing or blank. */
function inputValue(form: string, name: string): string | undefined {
  const tag = new RegExp(`<input\\b[^>]*\\bname\\s*=\\s*["']${name}["'][^>]*>`, 'i').exec(form)?.[0];
  if (!tag) return undefined;
  const value = /\bvalue\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(tag);
  const text = decodeEntities(value?.[1] ?? value?.[2] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, 120) : undefined;
}

/** "2026-12-10 09:00:00" -> "2026-12-10T09:00" (the parking's local time, as the page prints it). */
function localDateTime(value: string | undefined): string | undefined {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::\d{2})?$/.exec(value) : null;
  return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}` : undefined;
}

const EDIT_FORM = /<form\b[^>]*\bname\s*=\s*["']edit_reservation["']/i;

/**
 * What a page shows of a booking, for the logs (10/10/2026) and parseAlloparkPage: the booking form (« Vos
 * informations », absent from Allopark's home page, shown for an unknown reference or address) and the reference (the
 * page names its booking: « Réservation N° AL-… », the date change form's hidden reference; another one is not read).
 */
export function alloparkPageFacts(html: string, reference: string): { form: boolean; reference: boolean } {
  const ref = reference.trim().toUpperCase();
  return { form: EDIT_FORM.test(html), reference: REFERENCE.test(ref) && new RegExp(`\\b${ref}\\b`, 'i').test(html) };
}

/**
 * What the booking page's form says (« Vos informations »), or null when the page is not this booking's (an
 * unknown reference or address shows Allopark's home page, without the form). Fields left blank on the page stay
 * undefined; the amount stays the email's.
 */
export function parseAlloparkPage(html: string, reference: string): ParsedBooking | null {
  const ref = reference.trim().toUpperCase();
  const facts = alloparkPageFacts(html, ref);
  if (!facts.form || !facts.reference) return null;
  const start = html.search(EDIT_FORM);
  const end = html.indexOf('</form>', start);
  const form = html.slice(start, end < 0 ? undefined : end);

  const booking: ParsedBooking = { provider: 'Allopark', externalReference: ref };
  booking.arrivalAt = localDateTime(inputValue(form, 'date_in'));
  booking.returnAt = localDateTime(inputValue(form, 'date_out'));
  const passengers = Number(inputValue(form, 'people_navette'));
  if (Number.isInteger(passengers) && passengers > 0 && passengers <= 20) booking.passengers = passengers;
  booking.plate = inputValue(form, 'plate');
  const vehicle = [inputValue(form, 'brand'), inputValue(form, 'model')].filter(Boolean).join(' ');
  if (vehicle) booking.vehicleModel = vehicle;
  // The page's « vol aller » is fly_arrival, its « vol retour » fly_departure (labels checked on the page, 10/10/2026).
  booking.departureFlight = inputValue(form, 'fly_arrival');
  booking.returnFlight = inputValue(form, 'fly_departure');
  booking.customerPhone = inputValue(form, 'phone');
  const first = inputValue(form, 'firstname');
  const last = inputValue(form, 'lastname');
  if (first) booking.customerFirstName = first;
  if (last) booking.customerLastName = last;
  if (first || last) booking.customerName = [first, last].filter(Boolean).join(' ');
  const email = inputValue(form, 'email_customer');
  if (email && EMAIL.test(email)) booking.customerEmail = email;

  for (const key of Object.keys(booking) as (keyof ParsedBooking)[]) if (booking[key] === undefined) delete booking[key];
  return booking;
}
