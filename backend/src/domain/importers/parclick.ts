import { amountAfter, flatten, NOM, numericDateTime, PHONE, PLATE } from './common';
import { EmailImporter, ParsedBooking } from './types';

/**
 * Parclick's confirmation (09/10/2026 sample: « Voici votre réservation ! · Arrivée au parking 09/10/2026 19:45 →
 * Sortie du parking 11/10/2026 19:45 · Référence de la réservation: BQYGK6J7 »). The traveller's details, when the
 * email carries them, follow the usual labels; what it lacks waits in « Mails à vérifier » or is read by Claude.
 */
export const parclickImporter: EmailImporter = {
  provider: 'Parclick',
  senders: ['parclick'],

  detect: text => /parclick/i.test(text) && /r[ée]f[ée]rence de la r[ée]servation/i.test(text),

  parse(text) {
    const flat = flatten(text);
    const booking: ParsedBooking = { provider: 'Parclick' };
    booking.externalReference = /R[ée]f[ée]rence de la r[ée]servation\s*:?\s*([A-Z0-9-]{5,20})\b/i.exec(flat)?.[1];

    // « Arrivée au parking » then « Sortie du parking », each a date and a time (labels and values may come in rows).
    const stay = flat.slice(Math.max(0, flat.search(/Arriv[ée]e au parking/i)));
    const moments = [...stay.matchAll(/(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}[:h]\d{2})/g)];
    if (moments[0]) booking.arrivalAt = numericDateTime(moments[0][1], moments[0][2].replace('h', ':'));
    if (moments[1]) booking.returnAt = numericDateTime(moments[1][1], moments[1][2].replace('h', ':'));

    booking.customerName =
      new RegExp(
        String.raw`(?:${NOM.source}(?: et pr[ée]nom)?|Titulaire|Conducteur)\s*:\s*(.+?)\s+(?:T[ée]l[ée]phone|E-?mail|Immatriculation|Plaque|Mod[èe]le|V[ée]hicule)\b`,
        'i',
      )
        .exec(flat)?.[1]
        ?.trim() ?? /\bBonjour\s+([^,!.]{2,60}?)\s*[,!]/.exec(flat)?.[1]?.trim();
    booking.customerPhone = new RegExp(String.raw`T[ée]l[ée]phone\s*:?\s*(${PHONE.source})`, 'i').exec(flat)?.[1]?.trim();
    booking.customerEmail = /E-?mail\s*:?\s*([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/i.exec(flat)?.[1];
    booking.plate = new RegExp(String.raw`(?:Immatriculation|Plaque(?: d'immatriculation)?|Matricule)\s*:?\s*(${PLATE.source})`, 'i').exec(flat)?.[1];
    booking.priceCents = amountAfter(flat, /(?:Prix total|Montant total|Total pay[ée]|Total)/i);
    return booking;
  },
};
