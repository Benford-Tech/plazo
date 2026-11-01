import { ParsedBooking } from './types';

/**
 * 01/11/2026 (« apprends ça aussi »): the booking form of the parking's own website, as its site emails it to the
 * parking (« Envoyé depuis Safe Parking Lyon Aéroport »): one label per line and its value on the next (or after « : »):
 * Nom, E-mail, Date et heure d'arrivée « 10/11 à 18h30 » (no year), Date et heure de départ, Plaque d'immatriculation,
 * Services (« Parking », « Voiturier »…). No phone: the booking is reached by its e-mail (createFromImport stores no phone).
 * Not a comparator: channel `website`, no commission, never in the comparators' list (EMAIL_IMPORTERS).
 */
export const WEBSITE_PROVIDER = 'Site du parking';

const LABELS = {
  name: /^nom(?: et pr[ée]nom| complet)?$/i,
  email: /^e-?mail|^adresse (?:e-?)?mail$/i,
  arrival: /^date et heure d['’]arriv[ée]e$/i,
  departure: /^date et heure de d[ée]part$/i,
  plate: /^(?:plaque d['’]immatriculation|immatriculation)$/i,
  phone: /^(?:t[ée]l[ée]phone|portable|mobile)$/i,
  services: /^services?$/i,
};

type Field = keyof typeof LABELS;

/** Its signature: both « Date et heure » labels and the website's « Envoyé depuis … » footer. */
export function isWebsiteForm(raw: string): boolean {
  const text = apostrophes(raw);
  return /date et heure d['’]arriv[ée]e/i.test(text) && /date et heure de d[ée]part/i.test(text) && /envoy[ée] depuis\s+\S/i.test(text);
}

/** A WordPress form writes its apostrophe as an entity the HTML-to-text step may leave (« d&#039;arrivée »). */
const apostrophes = (text: string) => text.replace(/&#0*39;|&apos;|&#x0*27;|&rsquo;/gi, "'");

/** Each label's value: the rest of its line after « : », else the next non-empty line. */
function fieldsOf(text: string): Partial<Record<Field, string>> {
  const lines = apostrophes(text)
    .split(/\r?\n/)
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out: Partial<Record<Field, string>> = {};
  for (let i = 0; i < lines.length; i++) {
    const [label, ...rest] = lines[i].split(/\s*:\s*/);
    const field = (Object.keys(LABELS) as Field[]).find(key => LABELS[key].test(label.trim()));
    if (!field || out[field] !== undefined) continue;
    const inline = rest.join(':').trim();
    const value = inline || lines[i + 1] || '';
    // The next line may be another label (an empty field).
    if (!inline && (Object.keys(LABELS) as Field[]).some(key => LABELS[key].test(value))) continue;
    out[field] = value;
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * « 10/11 à 18h30 », « 10/11/2026 18:30 »: the local time. Without a year, the next such date that is not more than 60
 * days past `now` (a stay booked for January in December; an email read again some weeks later).
 */
export function websiteDateTime(raw: string, now: Date, timeZone: string): string | undefined {
  const m = /(\d{1,2})\s*[/.-]\s*(\d{1,2})(?:\s*[/.-]\s*(\d{2,4}))?\D+?(\d{1,2})\s*[h:]\s*(\d{2})?/i.exec(raw);
  if (!m) return undefined;
  const [day, month, hour, minute] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5] ?? 0)];
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return undefined;
  let year: number;
  if (m[3]) year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  else {
    const today = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    const current = Number(today.slice(0, 4));
    const earliest = new Date(Date.parse(`${today}T00:00:00Z`) - 60 * 86400000).toISOString().slice(0, 10);
    year = `${current}-${pad(month)}-${pad(day)}` < earliest ? current + 1 : current;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1) return undefined;
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** The booking of the website's form, or null for any other email. */
export function parseWebsiteForm(text: string, now: Date, timeZone: string): ParsedBooking | null {
  if (!isWebsiteForm(text)) return null;
  const f = fieldsOf(text);
  const email = f.email?.match(/[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+/)?.[0];
  const services = f.services?.trim();
  return {
    provider: WEBSITE_PROVIDER,
    channel: 'website',
    customerName: f.name?.trim() || undefined,
    customerEmail: email,
    customerPhone: f.phone?.trim() || undefined,
    arrivalAt: f.arrival ? websiteDateTime(f.arrival, now, timeZone) : undefined,
    returnAt: f.departure ? websiteDateTime(f.departure, now, timeZone) : undefined,
    plate: f.plate?.trim() || undefined,
    notes: services && !/^parking$/i.test(services) ? `Service demandé sur le site : ${services}` : undefined,
  };
}
