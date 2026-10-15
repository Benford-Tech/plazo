import { ArrivalKind } from '@/database';
import { shortName } from './arrival';
import { plateSegment } from './reservation';

/** Push notifications sent to the staff about a traveller's arrival (French, short). */

export type ArrivalPushEvent = 'started' | 'announced' | 'soon' | 'at_meeting_point';

export interface ArrivalPushInput {
  event: ArrivalPushEvent;
  kind: ArrivalKind;
  customerName: string;
  /** 09/10/2026: the stored first and last name, for "C. Martin" (missing: split from customerName). */
  customerFirstName?: string | null;
  customerLastName?: string | null;
  plate: string;
  parkingName: string;
  etaMinutes: number | null;
  meetingLabel: string | null;
  /** E (06/10/2026): the traveller's word, appended to the body. */
  note?: string | null;
}

export interface PushMessage {
  title: string;
  body: string;
}

export function arrivalPush(input: ArrivalPushInput): PushMessage {
  const message = arrivalPushBase(input);
  const note = input.note?.trim();
  return note ? { ...message, body: `${message.body} · « ${note} »` } : message;
}

function arrivalPushBase(input: ArrivalPushInput): PushMessage {
  const who = shortName(input.customerName, { firstName: input.customerFirstName, lastName: input.customerLastName });
  const eta = input.etaMinutes;
  const isReturn = input.kind === 'return';
  const place = input.meetingLabel || (isReturn ? 'point de rendez-vous' : input.parkingName);
  // 15/10/2026: a booking imported without its plate (read on arrival) leaves it out.
  const plate = plateSegment(input.plate);
  switch (input.event) {
    case 'announced':
      return {
        title: isReturn ? 'Retour annoncé' : 'Arrivée annoncée',
        body: `${isReturn ? 'Retour : ' : ''}${who} : « J'arrive dans ${eta} min »${plate}`,
      };
    case 'at_meeting_point':
      return isReturn
        ? { title: 'Client au point de rendez-vous', body: `Retour : ${who} est au point de rendez-vous · ${place}${plate}` }
        : { title: 'Client arrivé', body: `${who} est à l'accueil${plate} · ${input.parkingName}` };
    case 'started':
    case 'soon': {
      const when = eta === null ? 'est en route' : `arrive dans ${eta} min`;
      return isReturn
        ? { title: 'Retour en approche', body: `Retour : ${who} ${when} au point de rendez-vous${plate}` }
        : { title: 'Arrivée en approche', body: `${who} ${when}${plate} · ${input.parkingName}` };
    }
  }
}
