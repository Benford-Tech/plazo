import { amountAfter, flatten, FLIGHT, frenchDateTime, NOM, numericDateTime, PHONE, PLATE } from './common';
import { EmailImporter, ParsedBooking } from './types';

const DATE_TIME = String.raw`(\d{1,2}\/\d{1,2}\/\d{4})\s+(?:à\s+)?(\d{1,2}[:h]\d{2})`;

/**
 * Onepark's notice to the parking (09/10/2026 sample: « Une nouvelle réservation Onepark a été enregistrée pour votre
 * parking »): a table of labels and values. « Début » and « Fin » bound the package; the planned pick-up of the car
 * (« Date et heure prévue de récupération du véhicule ») is the real return, used when given.
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
    if (first) booking.customerFirstName = first;
    if (last) booking.customerLastName = last;
    booking.customerPhone = new RegExp(String.raw`(?:Portable|T[ée]l[ée]phone)\s*:?\s*(${PHONE.source})`, 'i').exec(flat)?.[1]?.trim();
    booking.customerEmail = /E-?mail\s*:?\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/i.exec(flat)?.[1];

    const start = new RegExp(`D[ée]but\\s*:?\\s*${DATE_TIME}`, 'i').exec(flat);
    if (start) booking.arrivalAt = numericDateTime(start[1], start[2].replace('h', ':'));
    const end = new RegExp(`\\bFin\\s*:?\\s*${DATE_TIME}`, 'i').exec(flat);
    // « dim. 18 oct. 2026 à 14:00 »
    const pickUp =
      /r[ée]cup[ée]ration du v[ée]hicule\s*:?\s*(?:[a-zé]{3,9}\.?\s+)?(\d{1,2})\s+([A-Za-zÀ-ÿ.]+)\s+(\d{4})\s+(?:à\s+)?(\d{1,2})[:h](\d{2})/i.exec(
        flat,
      );
    booking.returnAt =
      (pickUp ? frenchDateTime(pickUp[1], pickUp[2], pickUp[3], pickUp[4], pickUp[5]) : undefined) ??
      (end ? numericDateTime(end[1], end[2].replace('h', ':')) : undefined);

    booking.priceCents = amountAfter(flat, /Montant de la r[ée]servation/i);
    booking.vehicleModel = /Mod[èe]le (?:du )?v[ée]hicule\s*:?\s*(.+?)\s+Plaque/i.exec(flat)?.[1]?.trim();
    booking.plate = new RegExp(String.raw`Plaque d'immatriculation\s*:?\s*(${PLATE.source})`, 'i').exec(flat)?.[1];
    const passengers = Number(/Nombre de passagers\s*:?\s*(\d{1,2})\b/i.exec(flat)?.[1]);
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;
    booking.returnFlight = new RegExp(`vol (?:au |du )?retour\\s*:?\\s*(${FLIGHT.source})\\b`, 'i').exec(flat)?.[1];
    booking.departureFlight = new RegExp(`vol (?:à l'|a l'|de l')?aller\\s*:?\\s*(${FLIGHT.source})\\b`, 'i').exec(flat)?.[1];
    return booking;
  },
};
