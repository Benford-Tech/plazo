import { formatEuros } from './booking-messages';

/**
 * « Historique » of a reservation (30/10/2026, « avoir un historique des actions et de l'auteur sur les réservations »,
 * direction A): the audit entries about it, each with who did it (a member, the traveller, a comparator, Plazo), what
 * changed (before → after, values written for reading) and the few details the sentence needs. Pure functions.
 */

export type HistoryAuthorKind = 'staff' | 'traveller' | 'comparator' | 'system';
export type HistoryGroup = 'status' | 'change' | 'message' | 'other';

export interface HistoryAuthor {
  kind: HistoryAuthorKind;
  /** Member: first name; traveller: the booking's name; comparator: its name; system: null (« Plazo »). */
  name: string | null;
  staffId: string | null;
  photoUpdatedAt: string | null;
  /** A platform admin's write in consultation. */
  viewAs: boolean;
}

export interface HistoryChange {
  field: string;
  from: string;
  to: string;
}

export interface HistoryEvent {
  id: string;
  at: string;
  action: string;
  group: HistoryGroup;
  author: HistoryAuthor;
  changes: HistoryChange[];
  /** What the sentence needs (statuses, spot or file, kind of service or report…), never personal data. */
  info: Record<string, string | number | boolean | null>;
}

export interface AuditRow {
  id: string;
  action: string;
  details: unknown;
  createdAt: Date;
  staff: { id: string; firstName: string; name: string; photoUpdatedAt: Date | null } | null;
}

/** The fields a person reads in « modifié » lines, in this order; the bookkeeping columns stay out. */
const SHOWN_FIELDS = [
  'customerFirstName',
  'customerLastName',
  'customerPhone',
  'customerEmail',
  'plate',
  'vehicleModel',
  'vehicleColour',
  'arrivalAt',
  'returnAt',
  'passengers',
  'departureFlight',
  'returnFlight',
  'handover',
  'priceCents',
  'paymentMethod',
  'commissionOverrideBp',
  'commissionOverrideCents',
  'channel',
  'channelDetail',
  'externalReference',
  'customerNote',
  'notes',
  'childSeats',
] as const;
const DATE_FIELDS = new Set(['arrivalAt', 'returnAt']);
const MONEY_FIELDS = new Set(['priceCents', 'commissionOverrideCents']);

const ENUM_LABELS: Record<string, Record<string, string>> = {
  handover: { shuttle: 'Navette', valet: 'Voiturier au terminal' },
  paymentMethod: {
    card: 'Carte',
    cash: 'Espèces',
    cheque: 'Chèque',
    transfer: 'Virement',
    holiday_vouchers: 'Chèques-vacances',
    comparator: 'Payé au comparateur',
  },
  channel: { plazo: 'Plazo', website: 'Site du parking', phone: 'Téléphone', counter: 'Comptoir', aggregator: 'Comparateur', import: 'Import' },
};

const COMPARATOR_OF_SOURCE: Record<string, string> = {
  allopark: 'Allopark',
  onepark: 'Onepark',
  parkvia: 'ParkVia',
  parkmundo: 'ParkMundo',
  parclick: 'Parclick',
  parkhit: 'Park Hit',
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

const shortDate = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone })
    .format(new Date(iso))
    .replace(',', '')
    .replace(/ /g, ' ');

function seatsText(value: unknown): string {
  if (!isObject(value)) return '—';
  const parts = [
    [Number(value.infant) || 0, 'bébé'],
    [Number(value.toddler) || 0, '1 à 4 ans'],
    [Number(value.booster) || 0, 'réhausseur'],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, label]) => `${n} ${label}`);
  return parts.join(' · ') || 'aucun';
}

/** A value as the history writes it: dates at the parking's clock, euros, labels, « — » for nothing. */
export function displayValue(field: string, value: unknown, timeZone: string): string {
  if (field === 'childSeats') return seatsText(value);
  if (value === null || value === undefined || value === '') return '—';
  if (DATE_FIELDS.has(field) && typeof value === 'string') return shortDate(value, timeZone);
  if (MONEY_FIELDS.has(field) && typeof value === 'number') return formatEuros(value).replace(/ | /g, ' ');
  if (field === 'commissionOverrideBp' && typeof value === 'number') return `${(value / 100).toLocaleString('fr-FR')} %`;
  const label = ENUM_LABELS[field]?.[String(value)];
  if (label) return label;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > 80 ? `${text.slice(0, 79)}…` : text;
}

/** The changed fields of a « reservation.updated » entry ({ field: { from, to } } plus bookkeeping keys). */
export function changesOf(details: unknown, timeZone: string): HistoryChange[] {
  if (!isObject(details)) return [];
  const out: HistoryChange[] = [];
  for (const field of SHOWN_FIELDS) {
    const change = details[field];
    if (!isObject(change) || !('from' in change || 'to' in change)) continue;
    const from = displayValue(field, change.from, timeZone);
    const to = displayValue(field, change.to, timeZone);
    if (from !== to) out.push({ field, from, to });
  }
  return out;
}

function groupOf(action: string): HistoryGroup {
  if (action === 'reservation.status_changed') return 'status';
  if (action === 'reservation.updated' || action.startsWith('reservation.created') || action === 'reservation.imported') return 'change';
  if (action.startsWith('arrival.') || action.startsWith('return.') || action === 'contract.code_sent' || action.startsWith('sms.')) return 'message';
  return 'other';
}

function comparatorOf(details: Record<string, unknown>, channelDetail: string | null): string | null {
  if (typeof details.provider === 'string' && details.provider) return details.provider;
  if (typeof details.source === 'string') {
    const key = details.source.split('_')[0];
    if (COMPARATOR_OF_SOURCE[key]) return COMPARATOR_OF_SOURCE[key];
  }
  return details.by === 'inbound_email' ? channelDetail : null;
}

export function authorOf(row: AuditRow, booking: { customerName: string; channelDetail: string | null }): HistoryAuthor {
  const details = isObject(row.details) ? row.details : {};
  const viewAs = details.viewAs === true;
  if (row.staff)
    return {
      kind: 'staff',
      name: row.staff.firstName || row.staff.name,
      staffId: row.staff.id,
      photoUpdatedAt: row.staff.photoUpdatedAt?.toISOString() ?? null,
      viewAs,
    };
  const none = { staffId: null, photoUpdatedAt: null, viewAs };
  if (details.by === 'traveller' || row.action.startsWith('arrival.') || (row.action === 'reservation.created' && details.channel === 'plazo'))
    return { kind: 'traveller', name: booking.customerName, ...none };
  const comparator = comparatorOf(details, booking.channelDetail);
  if (comparator) return { kind: 'comparator', name: comparator, ...none };
  return { kind: 'system', name: null, ...none };
}

/** The details a sentence uses, picked by name (an entry can hold more, never shown). */
const INFO_KEYS = [
  'from',
  'to',
  'via',
  'by',
  'refunded',
  'note',
  'kind',
  'method',
  'decision',
  'device',
  'keyHook',
  'left',
  'rank',
  'photos',
  'damages',
  'minutes',
  'auto',
  'priceCents',
  'amountCents',
  'fileName',
  'source',
] as const;

function infoOf(action: string, details: unknown): HistoryEvent['info'] {
  if (!isObject(details)) return {};
  const info: HistoryEvent['info'] = {};
  for (const key of INFO_KEYS) {
    const value = details[key];
    // A « reservation.updated » entry's from / to are field changes, read by changesOf.
    if (action === 'reservation.updated' && (key === 'from' || key === 'to')) continue;
    if (typeof value === 'string') info[key] = value.length > 120 ? `${value.slice(0, 119)}…` : value;
    else if (typeof value === 'number' || typeof value === 'boolean' || value === null) info[key] = value;
  }
  return info;
}

/** The history, newest first. Entries that say nothing to a reader (an update with no shown field) are left out. */
export function reservationHistory(
  rows: AuditRow[],
  booking: { customerName: string; channelDetail: string | null },
  timeZone: string,
): HistoryEvent[] {
  return [...rows]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
    .map(row => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      action: row.action,
      group: groupOf(row.action),
      author: authorOf(row, booking),
      changes: row.action === 'reservation.updated' ? changesOf(row.details, timeZone) : [],
      info: infoOf(row.action, row.details),
    }))
    .filter(e => e.action !== 'reservation.updated' || e.changes.length > 0 || typeof e.info.note === 'string');
}
