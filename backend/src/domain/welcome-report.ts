/**
 * 18/11/2026 (« affiche une liste des mails d'invitation envoyés côté plateforme », direction B): Plateforme › Mails d'accueil.
 * Every booking of the other channels over the period is either one the 15-minute pass handled (its outcome) or one that
 * never was a candidate, with the first reason met, in the order of TravellerWelcomeService.run's own filters.
 */

import { travellerEmail } from '@/domain/traveller-email';

export type WelcomeOutcome = 'sent' | 'repeat' | 'opted_out' | 'no_email' | 'failed';

export const NOT_SENT_REASONS = [
  'before_launch',
  'no_email',
  'no_listing',
  'operator_off',
  'cancelled',
  'anonymized',
  'already_dropped',
  'pending',
  'arrival_passed',
] as const;
export type NotSentReason = (typeof NOT_SENT_REASONS)[number];

export interface WelcomeFacts {
  createdAt: Date;
  arrivalAt: Date;
  status: string;
  channelDetail: string | null;
  externalReference: string | null;
  importId: string | null;
  anonymizedAt: Date | null;
  customerEmail: string | null;
  welcomeEmailAt: Date | null;
  welcomeEmailOutcome: string | null;
  hasListing: boolean;
  operatorOff: boolean;
}

export type WelcomeState = { kind: 'handled'; outcome: WelcomeOutcome | 'in_progress' } | { kind: 'not_sent'; reason: NotSentReason };

/** The traveller_welcome migration ran before this instant (deployed on 15/11/2026). */
const MIGRATED_BEFORE = new Date('2026-11-16T00:00:00Z');

/**
 * `markedAt`: the first welcomeEmailAt ever written, the instant the traveller_welcome migration marked every older
 * booking « repeat »; a booking it marked is « before launch », never a real « already received ».
 */
export function welcomeStateOf(r: WelcomeFacts, now: Date, markedAt: Date | null): WelcomeState {
  if (markedAt && markedAt < MIGRATED_BEFORE && r.welcomeEmailOutcome === 'repeat' && r.welcomeEmailAt?.getTime() === markedAt.getTime()) {
    return { kind: 'not_sent', reason: 'before_launch' };
  }
  if (r.welcomeEmailAt) {
    const o = r.welcomeEmailOutcome;
    return {
      kind: 'handled',
      outcome: o === 'sent' || o === 'repeat' || o === 'opted_out' || o === 'no_email' || o === 'failed' ? o : 'in_progress',
    };
  }
  const reason = notSentReason(r, now);
  return { kind: 'not_sent', reason };
}

function notSentReason(r: WelcomeFacts, now: Date): NotSentReason {
  // 20/11/2026: Allopark and file imports are sent too, as long as the traveller's own address is known.
  if (!travellerEmail(r.customerEmail)) return 'no_email';
  if (!r.hasListing) return 'no_listing';
  if (r.operatorOff) return 'operator_off';
  if (r.status === 'cancelled' || r.status === 'no_show') return 'cancelled';
  if (r.anonymizedAt) return 'anonymized';
  if (r.status !== 'upcoming') return 'already_dropped';
  // The pass sends as soon as the email is known, until the drop-off (20/11/2026).
  if (r.arrivalAt.getTime() > now.getTime()) return 'pending';
  return 'arrival_passed';
}

/** « camille.martin@gmail.com » → « c•••••@gmail.com »: the platform sees who, not the whole address. */
export function maskEmail(email: string | null | undefined): string | null {
  const e = (email ?? '').trim();
  const at = e.lastIndexOf('@');
  if (at < 1) return null;
  return `${e[0]}•••••${e.slice(at)}`;
}

/** « Camille Martin » → « Camille M. ». */
export function shortName(first: string | null, last: string | null): string {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  if (!f && !l) return 'Client';
  return [f, l ? `${l[0].toUpperCase()}.` : ''].filter(Boolean).join(' ');
}
