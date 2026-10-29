import { travellerEmailIn } from '../traveller-email';
import { amountAfter, flatten, numericDateTime, PLATE } from './common';
import { EmailImporter, ParsedBooking } from './types';

/**
 * ParkVia's notice to the parking (20/10/2026 sample: « ParkVia - Nouvelle notification de réservation · Numéro de
 * réservation: PC90935265 · Date de remise du véhicule: 23/10/2026 15:00:00 · Date de récupération du véhicule:
 * 26/10/2026 09:30:00 · Passagers · Nom · Tel Portable: 612345678 (33) · Numéro d'immatriculation »). The amount is its
 * « Total »; the phone is written without its leading 0, the country code after it in brackets.
 */
const REFERENCE = /Num[ée]ro de r[ée]servation\s*:?\s*([A-Z]{1,4}\d{5,12})\b/i;
const MOMENT = (label: string) => new RegExp(`${label}\\s*:?\\s*(\\d{1,2}\\/\\d{1,2}\\/\\d{4})\\s+(\\d{1,2}:\\d{2})(?::\\d{2})?`, 'i');

/** « 612345678 (33) » → « +33 612345678 »; a number already written in full stays as it is. */
export function parkviaPhone(raw: string | undefined): string | undefined {
  const match = /^\s*(\+?[\d .]{6,18}\d)\s*(?:\((\d{1,3})\))?/.exec(raw ?? '');
  if (!match) return undefined;
  const number = match[1].replace(/[ .]/g, '');
  if (!match[2] || number.startsWith('+') || number.startsWith('0')) return number;
  return `+${match[2]} ${number}`;
}

export const parkviaImporter: EmailImporter = {
  provider: 'ParkVia',
  senders: ['parkvia'],

  detect: text => /parkvia/i.test(text) && REFERENCE.test(flatten(text)) && /Date de remise du v[ée]hicule/i.test(text),

  parse(text) {
    const flat = flatten(text);
    const booking: ParsedBooking = { provider: 'ParkVia' };
    booking.externalReference = REFERENCE.exec(flat)?.[1]?.toUpperCase();
    const arrival = MOMENT(String.raw`Date de remise du v[ée]hicule`).exec(flat);
    const pickUp = MOMENT(String.raw`Date de r[ée]cup[ée]ration du v[ée]hicule`).exec(flat);
    if (arrival) booking.arrivalAt = numericDateTime(arrival[1], arrival[2]);
    if (pickUp) booking.returnAt = numericDateTime(pickUp[1], pickUp[2]);

    booking.priceCents = amountAfter(flat, /\bTotal/i);
    const passengers = Number(/Passagers\s*:?\s*(\d{1,2})\b/i.exec(flat)?.[1]);
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;
    booking.customerName = /\bNom\s*:\s*(.+?)\s+(?:T[ée]l|E-?mail|Num[ée]ro d'immatriculation)\b/i.exec(flat)?.[1]?.trim();
    booking.customerPhone = parkviaPhone(/T[ée]l(?:[ée]phone)?(?: portable)?\s*:?\s*([+\d][\d .]{5,20}(?:\s*\(\d{1,3}\))?)/i.exec(flat)?.[1]);
    booking.customerEmail = travellerEmailIn(flat);
    booking.plate = new RegExp(String.raw`Num[ée]ro d'immatriculation\s*:?\s*(${PLATE.source})`, 'i').exec(flat)?.[1];
    return booking;
  },
};
