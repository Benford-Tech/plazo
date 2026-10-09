import { ListingStatus } from '@/database';

export const SERVICES = ['shuttle', 'valet', 'covered', 'ev_charging', 'open_24h', 'fenced', 'cctv'] as const;
export type Service = (typeof SERVICES)[number];

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Slugs a listing can never take: the traveller site serves /<airport>/<slug> for a parking page, and these segments
 * are (or will be) its own routes under an airport (09/10/2026: a listing called "recherche" never resolved).
 */
export const RESERVED_LISTING_SLUGS = [
  'recherche',
  'guide',
  'guides',
  'reserver',
  'avis',
  'comparatif',
  'aide',
  'faq',
  'ma-reservation',
  'api',
  'pro',
] as const;

export function isReservedListingSlug(slug: string): boolean {
  return (RESERVED_LISTING_SLUGS as readonly string[]).includes(slug);
}

/**
 * Review of a listing by the platform. The operator sends a draft (or a refused listing, once
 * corrected) for validation and can withdraw it; the platform validates or refuses what it was
 * sent, and can take a published listing offline. Edits never change the status: a published
 * listing stays online while edited (each edit is in the audit log).
 */
export type ListingAction = 'submit' | 'withdraw' | 'approve' | 'reject' | 'unpublish';

const TRANSITIONS: Record<ListingAction, { from: readonly ListingStatus[]; to: ListingStatus }> = {
  submit: { from: ['draft', 'rejected'], to: 'pending_review' },
  // The operator takes its page offline, or cancels its request.
  withdraw: { from: ['pending_review', 'published'], to: 'draft' },
  approve: { from: ['pending_review'], to: 'published' },
  reject: { from: ['pending_review'], to: 'rejected' },
  unpublish: { from: ['published'], to: 'draft' },
};

/** The status after an action, or null when the action is not possible from `status`. */
export function nextListingStatus(status: ListingStatus, action: ListingAction): ListingStatus | null {
  const t = TRANSITIONS[action];
  return t.from.includes(status) ? t.to : null;
}
