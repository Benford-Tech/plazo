import { amountAfter, flatten, FLIGHT, frenchDateTime, NOM, numericDateTime, PHONE, PLATE } from './common';
import { EmailImporter, ParsedBooking } from './types';

const DATE_TIME = String.raw`(\d{1,2}\/\d{1,2}\/\d{4})\s+(?:à\s+)?(\d{1,2}[:h]\d{2})`;
/** « ven. 23 oct. 2026 à 09:00 »: a weekday, then the day, the month in letters, the year and the time. */
const TEXT_DATE_TIME = String.raw`(?:[a-zé]{3,9}\.?\s+)?(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})\s+(?:à\s+)?(\d{1,2})[:h](\d{2})`;

/** A date after its label, numeric (« 10/10/2026 04:30 ») or in letters (« ven. 23 oct. 2026 à 09:00 »). */
function dateAfter(flat: string, label: string): string | undefined {
  const numeric = new RegExp(`${label}\\s*:?\\s*${DATE_TIME}`, 'i').exec(flat);
  if (numeric) return numericDateTime(numeric[1], numeric[2].replace('h', ':'));
  const text = new RegExp(`${label}\\s*:?\\s*${TEXT_DATE_TIME}`, 'i').exec(flat);
  return text ? frenchDateTime(text[1], text[2], text[3], text[4], text[5]) : undefined;
}

/**
 * Onepark's notice to the parking (09/10/2026 sample: « Une nouvelle réservation Onepark a été enregistrée pour votre
 * parking »): a table of labels and values. « Début » and « Fin » bound the package; the planned pick-up of the car
 * (« Date et heure prévue de récupération du véhicule ») is the real return, used when given.
 *
 * Its shorter notice (20/10/2026 sample): « Début : ven. 23 oct. 2026 à 09:00 », « Montant résa : 20,00 € », the whole
 * name in « Nom » (no « Prénom », split by the server), a « Téléphone », and neither a booking number nor a plate.
 */
export const oneparkImporter: EmailImporter = {
  provider: 'Onepark',
  senders: ['onepark'],

  detect: text => /onepark/i.test(text) && /nouvelle r[ée]servation onepark|num[ée]ro de r[ée]servation/i.test(text) && /\bd[ée]but\b/i.test(text),

  parse(text) {
    const flat = flatten(text);
    const booking: ParsedBooking = { provider: 'Onepark' };
    booking.externalReference = /Num[ée]ro de r[ée]servation\s*:?\s*([A-Z0-9-]{4,20})\b/i.exec(flat)?.[1];
    const first = new RegExp(String.raw`Pr[ée]nom\s*:?\s*(.+?)\s+${NOM.source}`, 'i').exec(flat)?.[1]?.trim();
    const last = new RegExp(String.raw`${NOM.source}\s*:?\s*(.+?)\s+(?:Portable|T[ée]l[ée]phone|Pays|E-?mail)\b`, 'i').exec(flat)?.[1]?.trim();
    if (first || last) booking.customerName = [first, last].filter(Boolean).join(' ');
    // Without « Prénom », « Nom » holds the whole name: the server splits it.
    if (first) booking.customerFirstName = first;
    if (first && last) booking.customerLastName = last;
    booking.customerPhone = new RegExp(String.raw`(?:Portable|T[ée]l[ée]phone)\s*:?\s*(${PHONE.source})`, 'i').exec(flat)?.[1]?.trim();
    booking.customerEmail = /E-?mail\s*:?\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/i.exec(flat)?.[1];

    booking.arrivalAt = dateAfter(flat, String.raw`D[ée]but`);
    const pickUp = new RegExp(String.raw`r[ée]cup[ée]ration du v[ée]hicule\s*:?\s*${TEXT_DATE_TIME}`, 'i').exec(flat);
    booking.returnAt =
      (pickUp ? frenchDateTime(pickUp[1], pickUp[2], pickUp[3], pickUp[4], pickUp[5]) : undefined) ?? dateAfter(flat, String.raw`\bFin`);

    booking.priceCents = amountAfter(flat, /Montant (?:de la r[ée]servation|r[ée]sa)/i);
    booking.vehicleModel = /Mod[èe]le (?:du )?v[ée]hicule\s*:?\s*(.+?)\s+Plaque/i.exec(flat)?.[1]?.trim();
    booking.plate = new RegExp(String.raw`Plaque d'immatriculation\s*:?\s*(${PLATE.source})`, 'i').exec(flat)?.[1];
    const passengers = Number(/Nombre de passagers\s*:?\s*(\d{1,2})\b/i.exec(flat)?.[1]);
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;
    booking.returnFlight = new RegExp(`vol (?:au |du )?retour\\s*:?\\s*(${FLIGHT.source})\\b`, 'i').exec(flat)?.[1];
    booking.departureFlight = new RegExp(`vol (?:à l'|a l'|de l')?aller\\s*:?\\s*(${FLIGHT.source})\\b`, 'i').exec(flat)?.[1];
    return booking;
  },
};
