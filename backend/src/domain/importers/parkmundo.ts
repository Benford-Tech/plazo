import { amountAfter, flatten, FLIGHT, NOM, numericDateTime, PHONE, PLATE } from './common';
import { EmailImporter, ParsedBooking } from './types';

/**
 * ParkMundo's confirmation (09/10/2026 sample: « Confirmation · Merci pour votre réservation ! · Numéro de réservation:
 * PM… »): contact details, the trip (drop-off then pick-up, each a date, a time and a flight), the vehicle, then the
 * prices. The parking's revenue is « Prix du parking »: the « Coût de réservation » is ParkMundo's own fee.
 */
export const parkmundoImporter: EmailImporter = {
  provider: 'ParkMundo',
  senders: ['parkmundo'],

  // The brand is often only in the logo: its booking number and its own headings are enough.
  detect: text => /\bPM\d{8,}\b/.test(text) && /parkmundo|d[ée]tails du voyage|pack produit|co[ûu]t de r[ée]servation/i.test(text),

  parse(text) {
    const flat = flatten(text);
    const booking: ParsedBooking = { provider: 'ParkMundo' };
    booking.externalReference = /\b(PM\d{6,})\b/.exec(flat)?.[1];
    booking.customerName = new RegExp(
      String.raw`${NOM.source}\s*:?\s*(.+?)\s+(?:Num[ée]ro de t[ée]l[ée]phone|T[ée]l[ée]phone|E-?mail|D[ée]tails du voyage)\b`,
      'i',
    )
      .exec(flat)?.[1]
      ?.trim();
    booking.customerPhone = new RegExp(String.raw`(?:Num[ée]ro de )?t[ée]l[ée]phone\s*:?\s*(${PHONE.source})`, 'i').exec(flat)?.[1]?.trim();
    booking.customerEmail = /E-?mail\s*:?\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/i.exec(flat)?.[1];

    // The trip: the first two « date time [flight] » after « Détails du voyage » (else anywhere), drop-off then pick-up.
    const trip = flat.slice(Math.max(0, flat.search(/D[ée]tails du voyage/i)));
    const legs = [...trip.matchAll(new RegExp(String.raw`(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}[:h]\d{2})(?:\s+(${FLIGHT.source})\b)?`, 'g'))];
    if (legs[0]) {
      booking.arrivalAt = numericDateTime(legs[0][1], legs[0][2].replace('h', ':'));
      booking.departureFlight = legs[0][3];
    }
    if (legs[1]) {
      booking.returnAt = numericDateTime(legs[1][1], legs[1][2].replace('h', ':'));
      booking.returnFlight = legs[1][3];
    }

    booking.plate = new RegExp(String.raw`Num[ée]ro d'immatriculation\s*:?\s*(${PLATE.source})`, 'i').exec(flat)?.[1];
    booking.vehicleModel = /Marque et mod[èe]le\s*:?\s*(.+?)\s+(?:Couleur|Nombre de passagers|Prix)\b/i.exec(flat)?.[1]?.trim();
    booking.vehicleColour = /\bCouleur\s*:?\s*(.+?)\s+(?:Nombre de passagers|Prix|Sous-total)\b/i.exec(flat)?.[1]?.trim();
    const passengers = Number(/Nombre de passagers\s*:?\s*(\d{1,2})\b/i.exec(flat)?.[1]);
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;
    booking.priceCents = amountAfter(flat, /Prix du parking/i) ?? amountAfter(flat, /Sous-total/i) ?? amountAfter(flat, /\bTotal\b/i);
    return booking;
  },
};
