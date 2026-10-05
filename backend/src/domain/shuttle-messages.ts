import { PushMessage } from './arrival-messages';
import { ShuttleDirection } from './shuttle';

/** Push notifications about the shuttles (N-A, 05/10/2026): to the staff, and to the passengers. */

export interface ShuttleTripFacts {
  direction: ShuttleDirection;
  driverFirstName: string;
  /** "Vito blanc" (model + colour), or null when the driver typed nothing. */
  vehicle: string | null;
  /** Where the shuttle goes: the stop's name, "l'aéroport" by default. */
  stopName: string | null;
  passengers: number;
  etaMinutes?: number | null;
}

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;
const where = (facts: ShuttleTripFacts) => facts.stopName ?? (facts.direction === 'pickup' ? "l'aéroport" : 'le terminal');
const who = (facts: ShuttleTripFacts) => [facts.vehicle, facts.driverFirstName].filter(Boolean).join(' · ');

/** To the staff when a trip starts. */
export function tripStartedPush(facts: ShuttleTripFacts): PushMessage {
  return {
    title: facts.direction === 'pickup' ? 'Navette partie chercher des clients' : 'Navette partie vers le terminal',
    body: `${who(facts)} → ${where(facts)} · ${plural(facts.passengers, 'client')}`,
  };
}

/** To the staff when a trip ends. */
export function tripEndedPush(facts: ShuttleTripFacts): PushMessage {
  return facts.direction === 'pickup'
    ? {
        title: 'Navette de retour au parking',
        body: `${who(facts)} · ${plural(facts.passengers, 'client')} récupéré${facts.passengers > 1 ? 's' : ''}`,
      }
    : {
        title: 'Clients déposés',
        body: `${who(facts)} · ${plural(facts.passengers, 'client')} déposé${facts.passengers > 1 ? 's' : ''} · ${where(facts)}`,
      };
}

/** To the passengers of a pick-up when it starts. */
export function shuttleLeavingPush(facts: ShuttleTripFacts): PushMessage {
  const eta = facts.etaMinutes != null ? ` · arrivée dans ~${facts.etaMinutes} min` : '';
  return { title: 'Votre navette est partie', body: `${facts.vehicle ?? 'Navette'} · ${facts.driverFirstName} vous rejoint à ${where(facts)}${eta}` };
}

/** To the passengers of a pick-up when the shuttle reaches the stop. */
export function shuttleArrivedPush(facts: ShuttleTripFacts): PushMessage {
  return { title: 'Votre navette est là', body: `${facts.vehicle ?? 'Navette'} · ${facts.driverFirstName} vous attend à ${where(facts)}` };
}
