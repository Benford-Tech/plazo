import { formatFlight } from '../reservation';
import { euroCents, numericDateTime, PLATE, stripAccents } from './common';
import { EmailImporter, ParsedBooking } from './types';

/**
 * 25/10/2026 (« celui ci aussi », then « pas compris par plazo »): Park Hit's notice to the parking (« Park Hit: Nouvelle
 * réservation F2006A65BCF7 », from noreply@parkhit.com), as « Clé : valeur » fields, one per line, each ended by « ; »
 * (sample of the client n°1: « Réservation : F2006A65BCF7; Prénom :
 * …; Nom : …; Nombre de véhicules : 1; Type de véhicule : Peugeot 208 Verte-Jaune; Nombre de voyageurs : 1; Date de
 * dépôt : 31/10/2026; Heure de dépôt : 13:45; Date de récupération : 04/11/2026; Heure de récupération : 11:45; Adresse
 * mail : …; Téléphone du client : +33…; Immatriculation : …; Coût de la réservation : 32,00€; Montant déjà payé : 32,00€;
 * Restant à payer : 0,00€; Mode de paiement : CB; Commentaires : ; Numéro de vol aller : 7841; Numéro de vol retour :
 * 7842; »). The body never names Park Hit (only the subject and the sender do): its layout is its signature, so a
 * forward by hand is read too. The flights come without their airline (« 7841 »): kept for the staff in the notes,
 * never read as a flight number (formatFlight would make « 78 41 » of it).
 */
export const PARKHIT_PROVIDER = 'Park Hit';

const KEYS = {
  reference: 'reservation',
  firstName: 'prenom',
  lastName: 'nom',
  vehicle: 'type de vehicule',
  passengers: 'nombre de voyageurs',
  arrivalDate: 'date de depot',
  arrivalTime: 'heure de depot',
  returnDate: 'date de recuperation',
  returnTime: 'heure de recuperation',
  email: 'adresse mail',
  phone: 'telephone du client',
  plate: 'immatriculation',
  price: 'cout de la reservation',
  comments: 'commentaires',
  outbound: 'numero de vol aller',
  inbound: 'numero de vol retour',
};

const REFERENCE = /^[A-Z0-9][A-Z0-9-]{4,19}$/i;

const normalise = (key: string) =>
  stripAccents(key)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** The sheet's fields by their normalised key (« Heure de dépôt : 13:45 » is cut at its first colon). */
export function sheetFields(text: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const piece of text.split(/[;\n\r]+/)) {
    const match = /^\s*([^:]{2,40}?)\s*:\s*(.*?)\s*$/.exec(piece.replace(/[  ]/g, ' '));
    if (!match) continue;
    const key = normalise(match[1]);
    if (key && !fields.has(key)) fields.set(key, match[2]);
  }
  return fields;
}

/** « 7841 » (no airline) is kept as typed for the notes; « EZY4411 » is a flight. */
function flightOf(value: string | undefined): { flight?: string; typed?: string } {
  const typed = value?.trim();
  if (!typed) return {};
  return /^\d+$/.test(typed) || !formatFlight(typed) ? { typed } : { flight: typed };
}

export const parkhitImporter: EmailImporter = {
  provider: PARKHIT_PROVIDER,
  senders: ['parkhit'],

  detect(text) {
    const fields = sheetFields(text);
    return (
      REFERENCE.test(fields.get(KEYS.reference) ?? '') &&
      fields.has(KEYS.arrivalDate) &&
      fields.has(KEYS.returnDate) &&
      (fields.has(KEYS.plate) || fields.has(KEYS.phone))
    );
  },

  parse(text) {
    const fields = sheetFields(text);
    const get = (key: string) => fields.get(key)?.trim() || undefined;
    const booking: ParsedBooking = { provider: PARKHIT_PROVIDER };
    booking.externalReference = get(KEYS.reference)?.toUpperCase();
    booking.customerFirstName = get(KEYS.firstName);
    booking.customerLastName = get(KEYS.lastName);
    const name = [booking.customerFirstName, booking.customerLastName].filter(Boolean).join(' ');
    if (name) booking.customerName = name;
    const arrival = get(KEYS.arrivalDate);
    const back = get(KEYS.returnDate);
    if (arrival) booking.arrivalAt = numericDateTime(arrival, get(KEYS.arrivalTime) ?? '00:00');
    if (back) booking.returnAt = numericDateTime(back, get(KEYS.returnTime) ?? '00:00');
    const passengers = Number(get(KEYS.passengers));
    if (Number.isInteger(passengers) && passengers > 0) booking.passengers = passengers;
    booking.customerEmail = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(get(KEYS.email) ?? '')?.[0];
    booking.customerPhone = get(KEYS.phone);
    const plate = get(KEYS.plate)?.toUpperCase();
    if (plate && new RegExp(`^${PLATE.source}$`).test(plate)) booking.plate = plate;
    const price = /\d[\d\s]*(?:[.,]\d{1,2})?/.exec(get(KEYS.price) ?? '')?.[0];
    if (price) booking.priceCents = euroCents(price.includes(',') || price.includes('.') ? price.replace('.', ',') : `${price},00`);
    booking.vehicleModel = get(KEYS.vehicle);
    const notes: string[] = [];
    const outbound = flightOf(get(KEYS.outbound));
    const inbound = flightOf(get(KEYS.inbound));
    if (outbound.flight) booking.departureFlight = outbound.flight;
    if (inbound.flight) booking.returnFlight = inbound.flight;
    if (outbound.typed) notes.push(`Vol aller indiqué sur la fiche : ${outbound.typed} (sans compagnie)`);
    if (inbound.typed) notes.push(`Vol retour indiqué sur la fiche : ${inbound.typed} (sans compagnie)`);
    const comments = get(KEYS.comments);
    if (comments) notes.push(`Commentaire du client : ${comments}`);
    if (notes.length) booking.notes = notes.join('\n');
    return booking;
  },
};
