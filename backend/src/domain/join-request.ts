/**
 * Joining a parking with the daily code (13/10/2026): the person signed in with Apple or Google asks to join, a manager
 * accepts (choosing the role, preset to the post asked for, never « Gérant ») or refuses. Pure helpers.
 */
import { createHash } from 'crypto';
import type { JoinRequestStatus, StaffRole } from '@/database';
import type { PushMessage } from './arrival-messages';

/** The roles a person may ask for, and a manager give, on joining: never manager (a manager promotes afterwards). */
export const JOINABLE_ROLES = ['agent', 'driver', 'valet'] as const satisfies readonly StaffRole[];
export type JoinableRole = (typeof JOINABLE_ROLES)[number];

export function isJoinableRole(role: unknown): role is JoinableRole {
  return typeof role === 'string' && (JOINABLE_ROLES as readonly string[]).includes(role);
}

/** The post as the push says it: « … comme chauffeur ». */
const ROLE_PHRASE: Record<StaffRole, string> = {
  manager: 'gérant',
  agent: 'agent d’accueil',
  driver: 'chauffeur',
  valet: 'voiturier',
};

/** A first or last name as stored: trimmed, single spaces, 60 characters at most (like the staff names). */
export function cleanNamePart(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').slice(0, 60).trim();
}

/** The names kept on an identity: a non-empty stored name wins (Apple sends the name only on the first authorisation). */
export function mergedNames(
  stored: { firstName: string; lastName: string },
  given: { firstName?: string | null; lastName?: string | null },
): { firstName: string; lastName: string } {
  return {
    firstName: cleanNamePart(stored.firstName) || cleanNamePart(given.firstName),
    lastName: cleanNamePart(stored.lastName) || cleanNamePart(given.lastName),
  };
}

/** « Demande pour rejoindre l’équipe » to the operator's managers. */
export function joinRequestPush(input: { firstName: string; lastName: string; operatorName: string; wishedRole: StaffRole }): PushMessage {
  const who = `${input.firstName} ${input.lastName}`.trim();
  return {
    title: 'Demande pour rejoindre l’équipe',
    body: `${who} veut rejoindre ${input.operatorName} comme ${ROLE_PHRASE[input.wishedRole]}.`,
  };
}

/** A pending request past its expiry reads as expired, even before the nightly purge marks it. */
export function effectiveStatus(request: { status: JoinRequestStatus; expiresAt: Date }, now = new Date()): JoinRequestStatus {
  return request.status === 'pending' && request.expiresAt <= now ? 'expired' : request.status;
}

/**
 * The key the join attempts are counted on: SHA-256 of "provider:subject" (never the raw subject). It outlives the
 * identity row, so deleting the identity and signing in again does not reset the limits.
 */
export function subjectKeyOf(identity: { provider: string; subject: string }): string {
  return createHash('sha256').update(`${identity.provider}:${identity.subject}`).digest('hex');
}

/** The address of a member who left (« Quitter ce parking ») or deleted their account: the real one is freed. */
export const leftEmail = (staffId: string) => `left-${staffId}@plazo.invalid`;
export const deletedEmail = (staffId: string) => `deleted-${staffId}@plazo.invalid`;
/** Shown wherever a deleted account still appears (trips, reservations handled). */
export const DELETED_ACCOUNT_NAME = 'Compte supprimé';
