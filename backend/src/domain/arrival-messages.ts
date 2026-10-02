import { ArrivalKind } from '@/database';
import { shortName } from './arrival';

/** Push notifications sent to the staff about a traveller's arrival (French, short). */

export type ArrivalPushEvent = 'started' | 'announced' | 'soon' | 'at_meeting_point';

export interface ArrivalPushInput {
  event: ArrivalPushEvent;
  kind: ArrivalKind;
  customerName: string;
  plate: string;
  parkingName: string;
  etaMinutes: number | null;
  meetingLabel: string | null;
}

export interface PushMessage {
  title: string;
  body: string;
}

export function arrivalPush(input: ArrivalPushInput): PushMessage {
  const who = shortName(input.customerName);
  const eta = input.etaMinutes;
  const isReturn = input.kind === 'return';
  const place = input.meetingLabel || (isReturn ? 'point de rendez-vous' : input.parkingName);
  switch (input.event) {
    case 'announced':
      return {
        title: isReturn ? 'Retour annoncé' : 'Arrivée annoncée',
        body: `${isReturn ? 'Retour : ' : ''}${who} : « J'arrive dans ${eta} min » · ${input.plate}`,
      };
    case 'at_meeting_point':
      return isReturn
        ? { title: 'Client au point de rendez-vous', body: `Retour : ${who} est au point de rendez-vous · ${place} · ${input.plate}` }
        : { title: 'Client arrivé', body: `${who} est à l'accueil · ${input.plate} · ${input.parkingName}` };
    case 'started':
    case 'soon': {
      const when = eta === null ? 'est en route' : `arrive dans ${eta} min`;
      return isReturn
        ? { title: 'Retour en approche', body: `Retour : ${who} ${when} au point de rendez-vous · ${input.plate}` }
        : { title: 'Arrivée en approche', body: `${who} ${when} · ${input.plate} · ${input.parkingName}` };
    }
  }
}
