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
/** Never more pages than this per email: the email's own link, else one page per address the email was sent to. */
export const MAX_PAGES = 2;

const REFERENCE = /^AL-\d{6,}$/;
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

/**
 * The pages to open for this booking, most likely first: the email's link to its confirmation page (rebuilt on
 * www.allopark.com with only its email, reference and view, so nothing else of the link is followed), else the page
 * built from the reference and each address the email was sent to (the parking's own mailbox for a forwarded email:
 * the link Allopark gives the parking carries that address and view=parking). Addresses on `excludeDomain` (Plazo's
 * inbound addresses) are never used.
 */
export function alloparkPageUrls(input: {
  html?: string | null;
  text?: string | null;
  reference: string;
  addresses: string[];
  excludeDomain?: string;
}): string[] {
  const reference = input.reference.trim().toUpperCase();
  if (!REFERENCE.test(reference)) return [];
  const content = decodeEntities(`${input.html ?? ''}\n${input.text ?? ''}`);
  const links = [...content.matchAll(/https?:\/\/(?:www\.)?allopark\.com\/[^\s"'<>()\[\]]*/gi)].map(m => m[0]);
  let locale = DEFAULT_LOCALE;
  for (const link of links) {
    let url: URL;
    try {
      url = new URL(link.replace(/^http:/i, 'https:'));
    } catch {
      continue;
    }
    if (!isAlloparkUrl(url.toString())) continue;
    const path = /^\/([a-z]{2}(?:-[a-z]{2})?)\/(confirmation\/?$)?/i.exec(url.pathname);
    if (!path) continue;
    // The email's other links (the parking's page, « Contactez-nous ») give the site's language.
    locale = path[1];
    const email = url.searchParams.get('email')?.trim();
    if (!path[2] || url.searchParams.get('reference')?.trim().toUpperCase() !== reference || !email || !EMAIL.test(email)) continue;
    const view = url.searchParams.get('view');
    return [pageUrl(locale, { email, reference, view: view && /^[a-z]{1,20}$/i.test(view) ? view : null })];
  }
  const excluded = input.excludeDomain ? `@${input.excludeDomain.toLowerCase()}` : null;
  const addresses = [...new Set(input.addresses.map(a => a.trim().toLowerCase()))].filter(a => EMAIL.test(a) && !(excluded && a.endsWith(excluded)));
  return addresses.slice(0, MAX_PAGES).map(email => pageUrl(locale, { email, reference, view: 'parking' }));
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

/**
 * What the booking page's form says (« Vos informations »), or null when the page is not this booking's (an
 * unknown reference or address shows Allopark's home page, without the form). Fields left blank on the page stay
 * undefined; the amount stays the email's.
 */
export function parseAlloparkPage(html: string, reference: string): ParsedBooking | null {
  const ref = reference.trim().toUpperCase();
  if (!REFERENCE.test(ref)) return null;
  const start = html.search(/<form\b[^>]*\bname\s*=\s*["']edit_reservation["']/i);
  if (start < 0) return null;
  const end = html.indexOf('</form>', start);
  const form = html.slice(start, end < 0 ? undefined : end);
  // The page names its booking (« Réservation N° AL-… », the date change form's hidden reference): another one is not read.
  if (!new RegExp(`\\b${ref}\\b`, 'i').test(html)) return null;

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
