import { isTestOperatorName } from './test-feed';

/**
 * 11/11/2026 (« A avec la page loueur de C », maquettes https://claude.ai/artifact/J9vfWx7FuFYrdHgGKaJT7L): the super
 * admin's cockpit counts real operators apart from the platform's own account, its test operators and the demos.
 */
export type OperatorKind = 'real' | 'test' | 'demo' | 'platform';

export function operatorKind(o: { name: string; isDemo: boolean; prospectDemo: boolean; isPlatform: boolean }): OperatorKind {
  if (o.isPlatform) return 'platform';
  if (o.isDemo || o.prospectDemo) return 'demo';
  if (isTestOperatorName(o.name)) return 'test';
  return 'real';
}

/** One line of « À traiter »: what is waiting, for which operator, and where it is handled. */
export interface PlatformTodo {
  kind: 'listing_review' | 'whatsapp_requested' | 'stripe_missing' | 'contract_missing' | 'contract_pending' | 'invitation_expired' | 'payout_failed';
  operatorId: string;
  operatorName: string;
  /** listing_review: the listing; payout_failed: how many transfers failed. */
  listingId?: string;
  count?: number;
}

export interface TodoOperator {
  id: string;
  name: string;
  kind: OperatorKind;
  status: string;
  listing: { id: string; status: string } | null;
  payments: { connected: boolean };
  contract: { status: string } | null;
  invitation: { expired: boolean } | null;
}

/**
 * What the platform has to do, most pressing first: a listing waiting for review (any operator but a demo), then for a
 * real active operator its failed transfers, a Stripe account not linked, no Plazo contract or one not yet signed, and an
 * invitation that expired before it was accepted.
 */
export function platformTodos(
  operators: TodoOperator[],
  failedPayouts: Map<string, number>,
  /** 14/11/2026: parkings that asked for their own WhatsApp number (« Demander mon numéro WhatsApp »). */
  whatsappRequested: Set<string> = new Set(),
): PlatformTodo[] {
  const order: PlatformTodo['kind'][] = [
    'listing_review',
    'whatsapp_requested',
    'payout_failed',
    'stripe_missing',
    'invitation_expired',
    'contract_missing',
    'contract_pending',
  ];
  const todos: PlatformTodo[] = [];
  for (const o of operators) {
    const base = { operatorId: o.id, operatorName: o.name };
    if (o.kind !== 'demo' && o.listing?.status === 'pending_review') todos.push({ kind: 'listing_review', listingId: o.listing.id, ...base });
    if (o.kind !== 'demo' && whatsappRequested.has(o.id)) todos.push({ kind: 'whatsapp_requested', ...base });
    if (o.kind !== 'real') continue;
    if (o.invitation?.expired) {
      todos.push({ kind: 'invitation_expired', ...base });
      continue;
    }
    if (o.invitation || o.status !== 'active') continue;
    const failed = failedPayouts.get(o.id) ?? 0;
    if (failed) todos.push({ kind: 'payout_failed', count: failed, ...base });
    if (!o.payments.connected) todos.push({ kind: 'stripe_missing', ...base });
    if (!o.contract) todos.push({ kind: 'contract_missing', ...base });
    else if (o.contract.status === 'pending') todos.push({ kind: 'contract_pending', ...base });
  }
  return todos.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}
