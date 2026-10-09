import { ReservationChannel } from '@/database';
import { shortName } from './arrival';
import { PushMessage } from './arrival-messages';

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
