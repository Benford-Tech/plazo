import { travellerEmail } from './traveller-email';
import { cleanNamePart, CustomerNames, customerNamesOf } from './customer-name';
import type { ParsedBooking } from './importers/types';
import { formatFlight, importedPlate, plateKey } from './reservation';
import { localDateTime, parseInstant } from './time';

/**
 * 10/10/2026 (« C'est une modification »: « Plazo relit la page Allopark (l'état actuel de la réservation), met à jour
 * la réservation existante… »): what differs between a booking and its comparator's current state (Allopark's booking
 * page). Pure side: the fields compared after the normalisation the booking itself uses, the values shown to the staff,
 * and the columns to write; the rules on whether to write them live in ReservationService.applyImportChange.
 */

/** The fields a comparator's change may update, in the order the staff read them. */
export const IMPORT_CHANGE_FIELDS = [
  'arrivalAt',
  'returnAt',
  'passengers',
  'plate',
  'departureFlight',
  'returnFlight',
  'customerPhone',
  'customerName',
  'customerEmail',
  'vehicleModel',
  'priceCents',
  // 21/10/2026: a comparator's cancellation (ParkVia), « Statut : Attendu → Annulé ».
  'status',
] as const;
export type ImportChangeField = (typeof IMPORT_CHANGE_FIELDS)[number];

/**
 * One change, as the staff read it: dates in the parking's local time (« 2026-12-15T18:00 »), the price in cents, the
 * rest as stored; `from` is null when the booking had nothing.
 */
export interface ImportChange {
  field: ImportChangeField;
  from: string | number | null;
  to: string | number | null;
}

/**
 * Why a change is left to the staff: the booking is closed (handed back, cancelled, no-show), the car is already there
 * and the arrival moves, no room on the new nights, a booking made on Plazo (never changed by a comparator's email), or
 * dates that make no stay (a return before the arrival, more than 90 days). 10/10/2026 (« Tu n'as pas récupéré le prix
 * pour la modif »): `ambiguous`, several bookings typed without the comparator's reference match the change (same car,
 * same stay: ReservationService.unreferencedMatches), none is chosen.
 */
export const IMPORT_CHANGE_REASONS = [
  'reservation_closed',
  'already_arrived',
  'no_room',
  'plazo_booking',
  'invalid_stay',
  'ambiguous',
  // 21/10/2026: a comparator's cancellation of a booking Plazo does not have.
  'unknown_booking',
] as const;
export type ImportChangeReason = (typeof IMPORT_CHANGE_REASONS)[number];

/** The booking's columns a change writes. */
export interface ImportChangeData extends Partial<CustomerNames> {
  arrivalAt?: Date;
  returnAt?: Date;
  passengers?: number;
  plate?: string;
  plateKey?: string;
  departureFlight?: string;
  returnFlight?: string;
  customerPhone?: string;
  customerEmail?: string;
  vehicleModel?: string;
  priceCents?: number;
  /** The comparator's new amount, kept with the price it sets (10/10/2026). */
  importedPriceCents?: number;
}

/** What the comparison reads of a booking. */
export interface ChangeableBooking {
  arrivalAt: Date;
  returnAt: Date;
  passengers: number;
  plate: string;
  plateKey: string;
  departureFlight: string | null;
  returnFlight: string | null;
  customerPhone: string;
  customerFirstName: string;
  customerLastName: string;
  customerName: string;
  customerEmail: string | null;
  vehicleModel: string | null;
  priceCents: number | null;
  /** The amount the comparator last gave; null for a booking it never priced (typed by hand, older rows). */
  importedPriceCents?: number | null;
}

export interface ImportDiff {
  changes: ImportChange[];
  data: ImportChangeData;
}

/** The digits of a phone number, a French international prefix made national: « +33 6 12… » and « 06 12… » are one number. */
export function phoneKey(phone: string): string {
  const trimmed = phone.trim();
  let digits = trimmed.replace(/\D/g, '');
  const international = trimmed.startsWith('+') || digits.startsWith('00');
  if (international) {
    digits = digits.replace(/^00/, '');
    if (digits.startsWith('33')) digits = `0${digits.slice(2)}`;
  }
  return digits;
}

/** Words of a name, without accents, lower-case, two letters or more: « Jean DUPONT » → ['jean', 'dupont']. */
export function nameWords(name: string): string[] {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(w => w.length >= 2);
}

/** What sameTraveller reads of a booking. */
export interface TravellerKeys {
  plateKey: string;
  customerPhone: string;
  customerName: string;
}

/**
 * 15/10/2026 (« ne pas planter à l'import quand la plaque est manquante »): the same traveller's booking — the same plate
 * when both have one, else the same phone (6 digits at least) and a word of the name in common (« DUPONT Jean » is « Jean
 * Dupont »). An anonymised booking (phone '') never matches.
 */
export function sameTraveller(a: TravellerKeys, b: TravellerKeys): boolean {
  if (a.plateKey && b.plateKey) return a.plateKey === b.plateKey;
  const phone = phoneKey(a.customerPhone);
  if (phone.length < 6 || phone !== phoneKey(b.customerPhone)) return false;
  const words = nameWords(b.customerName);
  return nameWords(a.customerName).some(w => words.includes(w));
}

const same = (a: string | null | undefined, b: string | null | undefined) =>
  cleanNamePart(a).toLocaleLowerCase('fr') === cleanNamePart(b).toLocaleLowerCase('fr');

/**
 * The changes from `current` to the comparator's `booking`, field by field, only for what the booking gives (a field
 * left blank on the page changes nothing): local times of the parking made instants as the booking form does
 * (parseInstant), plates by their letters and digits (plateKey; 15/10/2026: what is no plate is ignored, importedPlate),
 * flights as formatFlight writes them (a value that is no flight number is ignored), phones by their digits (phoneKey),
 * names, e-mails and car models without case.
 */
export function importChanges(current: ChangeableBooking, booking: ParsedBooking, timeZone: string): ImportDiff {
  const changes: ImportChange[] = [];
  const data: ImportChangeData = {};
  const local = (instant: Date) => localDateTime(instant, timeZone);

  for (const field of ['arrivalAt', 'returnAt'] as const) {
    const given = booking[field];
    const instant = given ? parseInstant(given, timeZone) : null;
    if (instant && instant.getTime() !== current[field].getTime()) {
      changes.push({ field, from: local(current[field]), to: local(instant) });
      data[field] = instant;
    }
  }

  const passengers = booking.passengers;
  if (typeof passengers === 'number' && Number.isInteger(passengers) && passengers > 0 && passengers !== current.passengers) {
    changes.push({ field: 'passengers', from: current.passengers, to: passengers });
    data.passengers = passengers;
  }

  // 15/10/2026: a blank or junk plate never erases one; a booking imported without a plate ('') takes the page's.
  const plate = importedPlate(booking.plate);
  if (plate && plateKey(plate) !== current.plateKey) {
    changes.push({ field: 'plate', from: current.plate, to: plate });
    data.plate = plate;
    data.plateKey = plateKey(plate);
  }

  for (const field of ['departureFlight', 'returnFlight'] as const) {
    const flight = booking[field]?.trim() ? formatFlight(booking[field]!) : null;
    if (flight && flight !== current[field]) {
      changes.push({ field, from: current[field], to: flight });
      data[field] = flight;
    }
  }

  const phone = booking.customerPhone?.trim();
  if (phone && phoneKey(phone) && phoneKey(phone) !== phoneKey(current.customerPhone)) {
    changes.push({ field: 'customerPhone', from: current.customerPhone, to: phone });
    data.customerPhone = phone;
  }

  // The page names the traveller in two fields; one left blank keeps the stored half.
  const first = cleanNamePart(booking.customerFirstName);
  const last = cleanNamePart(booking.customerLastName);
  if (first || last) {
    const names = customerNamesOf({ customerFirstName: first || current.customerFirstName, customerLastName: last || current.customerLastName });
    if (names.customerName && !same(names.customerName, current.customerName)) {
      changes.push({ field: 'customerName', from: current.customerName, to: names.customerName });
      Object.assign(data, names);
    }
  }

  const email = travellerEmail(booking.customerEmail);
  if (email && email !== (current.customerEmail ?? '').trim().toLowerCase()) {
    changes.push({ field: 'customerEmail', from: current.customerEmail, to: email });
    data.customerEmail = email;
  }

  const vehicle = booking.vehicleModel?.trim().slice(0, 40);
  if (vehicle && !same(vehicle, current.vehicleModel)) {
    changes.push({ field: 'vehicleModel', from: current.vehicleModel, to: vehicle });
    data.vehicleModel = vehicle;
  }

  // 10/10/2026 (relecture de « Pouvoir modifier le prix après l'intégration du mail »): the price follows the
  // comparator's own amount. A page that still gives the amount it gave before leaves a price the staff corrected
  // alone; one it never priced compares with the price itself.
  const price = booking.priceCents;
  const known = current.importedPriceCents ?? current.priceCents;
  if (typeof price === 'number' && Number.isInteger(price) && price > 0 && price !== known && price !== current.priceCents) {
    changes.push({ field: 'priceCents', from: current.priceCents, to: price });
    data.priceCents = price;
    data.importedPriceCents = price;
  }

  return { changes, data };
}

/** The same diff without one field (a locked price): its change and its column go. */
export function withoutField(diff: ImportDiff, field: ImportChangeField): ImportDiff {
  const data = { ...diff.data };
  delete data[field as keyof ImportChangeData];
  if (field === 'plate') delete data.plateKey;
  if (field === 'priceCents') delete data.importedPriceCents;
  if (field === 'customerName') {
    delete data.customerFirstName;
    delete data.customerLastName;
  }
  return { changes: diff.changes.filter(c => c.field !== field), data };
}
