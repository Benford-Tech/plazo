import { ReservationChannel } from '@/database';
import { shortName } from './arrival';
import { PushMessage } from './arrival-messages';
import type { ImportChange } from './import-change';

/** Push to the team when a booking arrives without them (site, import; 06/10/2026). */
export interface NewBookingPushInput {
  customerName: string;
  /** 09/10/2026: the stored first and last name, for "C. Martin" (missing: split from customerName). */
  customerFirstName?: string | null;
  customerLastName?: string | null;
  plate: string;
  passengers: number;
  channel: ReservationChannel;
  channelDetail: string | null;
  /** Local day and time, "11/10 06:30". */
  arrival: string;
  /** Local day, "13/10". */
  returnDay: string;
}

const CHANNELS: Record<ReservationChannel, string> = {
  plazo: 'Plazo',
  website: 'Site',
  phone: 'Téléphone',
  counter: 'Comptoir',
  aggregator: 'Comparateur',
  import: 'Import',
};

export function newBookingPush(input: NewBookingPushInput): PushMessage {
  const source = input.channelDetail?.trim() || CHANNELS[input.channel];
  return {
    title: `Nouvelle réservation · ${source}`,
    body: `${shortName(input.customerName, { firstName: input.customerFirstName, lastName: input.customerLastName })} · ${input.plate} · ${input.passengers} pass. · arrivée ${input.arrival} → retour ${input.returnDay}`,
  };
}

/** « 2026-12-15T18:00 » -> « 15 déc. 18:00 » (the parking's local time, as the change keeps it). */
function dayMonthTime(local: string): string {
  const [date, time] = local.split('T');
  if (!date || !time) return local;
  const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  return `${day} ${time.slice(0, 5)}`;
}

const euros = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

/**
 * What a change says in the push: the new dates, travellers, plate and price; the other fields by their name only,
 * since the « Nouvelle réservation » push shows no more of the traveller (no phone, e-mail, flight or car).
 */
function changeWords(change: ImportChange): string {
  const to = change.to;
  switch (change.field) {
    case 'arrivalAt':
      return `arrivée ${dayMonthTime(String(to))}`;
    case 'returnAt':
      return `retour ${dayMonthTime(String(to))}`;
    case 'passengers':
      return `${to} ${Number(to) > 1 ? 'personnes' : 'personne'}`;
    case 'plate':
      return `plaque ${to}`;
    case 'priceCents':
      return `prix ${euros(Number(to))}`;
    case 'departureFlight':
      return 'vol aller';
    case 'returnFlight':
      return 'vol retour';
    case 'customerPhone':
      return 'téléphone';
    case 'customerName':
      return 'nom';
    case 'customerEmail':
      return 'e-mail';
    case 'vehicleModel':
      return 'véhicule';
  }
}

/**
 * 10/10/2026 (« C'est une modification »): push to the team when Plazo applies a comparator's change of a booking:
 * « Réservation modifiée · Allopark », « AL-884880719 · retour 15 déc. 18:00 · 4 personnes ».
 */
export function bookingChangedPush(input: {
  /** The comparator's reference when there is one, else the booking's own. */
  reference: string;
  channel: ReservationChannel;
  channelDetail: string | null;
  changes: ImportChange[];
}): PushMessage {
  const source = input.channelDetail?.trim() || CHANNELS[input.channel];
  return {
    title: `Réservation modifiée · ${source}`,
    body: [input.reference, ...input.changes.map(changeWords)].join(' · '),
  };
}
