import { BookingNotify, StaffRole } from '@/database';
import { can } from './roles';

/**
 * 02/11/2026 (« Mets en place les notifs » : cloche, navigateur, « Mes notifications »; maquettes
 * https://claude.ai/artifact/4cuK17SNEJq2m3qLWqNXnU). What the team hears of, and where: the phone (OneSignal, the
 * existing pushes), the browser of the pro space (Web Push) and the bell (`staff_notifications`, kept 30 days).
 */
export const NOTIFICATION_EVENTS = [
  'booking_new',
  'booking_change',
  'inbox',
  // 12/11/2026: a traveller wrote to Plazo's WhatsApp number (« Messages WhatsApp »).
  'whatsapp',
  'extra',
  'arrival',
  'return',
  'shuttle',
  'valet',
  'team',
  'platform',
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export const NOTIFICATION_CHANNELS = ['phone', 'browser', 'bell'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type ChannelSet = Record<NotificationChannel, boolean>;
/** What a member changed by hand, per event; anything absent follows the role's default. */
export type ChannelOverrides = Partial<Record<NotificationEvent, Partial<ChannelSet>>>;

/** The bell keeps a notification this long. */
export const BELL_RETENTION_DAYS = 30;

export interface NotifiedStaff {
  role: StaffRole;
  post: StaffRole | null;
  notifyArrivals: boolean;
  notifyReturns: boolean;
  notifyShuttles: boolean;
  notifyPlatform: boolean;
  bookingNotify: BookingNotify;
  notificationChannels: unknown;
}

/** The events a role hears of at all: a mail to check needs the inbox, a join request the team. */
export function eventsFor(role: StaffRole): NotificationEvent[] {
  return NOTIFICATION_EVENTS.filter(event => {
    if (event === 'inbox' || event === 'whatsapp') return can(role, 'reservations:manage');
    if (event === 'team') return can(role, 'team:manage');
    return true;
  });
}

/** Browser and bell by default, per role (the phone keeps its older settings, see `phoneDefault`). */
const BROWSER: Record<StaffRole, NotificationEvent[]> = {
  manager: ['booking_new', 'booking_change', 'inbox', 'whatsapp', 'extra', 'team'],
  agent: ['booking_new', 'booking_change', 'inbox', 'whatsapp', 'arrival'],
  driver: [],
  valet: [],
};
const BELL: Record<StaffRole, NotificationEvent[]> = {
  manager: [...NOTIFICATION_EVENTS],
  agent: ['booking_new', 'booking_change', 'inbox', 'whatsapp', 'extra', 'arrival', 'return', 'platform'],
  driver: ['arrival', 'return', 'shuttle', 'platform'],
  valet: ['valet', 'extra', 'return', 'platform'],
};

/** The phone as before the bell: the older columns where there is one, the audience's rule otherwise. */
function phoneDefault(staff: NotifiedStaff, event: NotificationEvent): boolean {
  switch (event) {
    case 'booking_new':
      return staff.bookingNotify !== 'never';
    case 'booking_change':
    case 'extra':
      return staff.bookingNotify !== 'never';
    case 'arrival':
      return staff.notifyArrivals;
    case 'return':
      return staff.notifyReturns;
    case 'shuttle':
      return staff.notifyShuttles;
    case 'platform':
      return staff.notifyPlatform;
    case 'team':
      return staff.role === 'manager';
    case 'valet':
      return staff.role === 'valet' || staff.role === 'manager' || staff.post === 'valet';
    case 'inbox':
      return false;
    // A traveller waiting for an answer: on the phone of the managers and the front desk.
    case 'whatsapp':
      return staff.role === 'manager' || staff.role === 'agent';
  }
}

/** The member's hand-made changes, read defensively from the JSON column. */
export function readOverrides(value: unknown): ChannelOverrides {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: ChannelOverrides = {};
  for (const event of NOTIFICATION_EVENTS) {
    const entry = (value as Record<string, unknown>)[event];
    if (!entry || typeof entry !== 'object') continue;
    const set: Partial<ChannelSet> = {};
    for (const channel of NOTIFICATION_CHANNELS) {
      const v = (entry as Record<string, unknown>)[channel];
      if (typeof v === 'boolean') set[channel] = v;
    }
    if (Object.keys(set).length) out[event] = set;
  }
  return out;
}

/**
 * Where an event reaches this member. The phone of the events that have an older column (arrivals, returns, shuttles,
 * platform, new bookings) is that column, never the JSON: the older apps still change it.
 */
export function channelsOf(staff: NotifiedStaff, event: NotificationEvent): ChannelSet {
  if (!eventsFor(staff.role).includes(event)) return { phone: false, browser: false, bell: false };
  const overrides = readOverrides(staff.notificationChannels)[event] ?? {};
  const columnPhone = ['booking_new', 'arrival', 'return', 'shuttle', 'platform'].includes(event);
  return {
    phone: columnPhone ? phoneDefault(staff, event) : (overrides.phone ?? phoneDefault(staff, event)),
    browser: overrides.browser ?? BROWSER[staff.role].includes(event),
    bell: overrides.bell ?? BELL[staff.role].includes(event),
  };
}

/** Every event the member hears of, with its channels (« Mes notifications »). */
export function channelMatrix(staff: NotifiedStaff): Partial<Record<NotificationEvent, ChannelSet>> {
  return Object.fromEntries(eventsFor(staff.role).map(event => [event, channelsOf(staff, event)]));
}

/** The JSON column after a member's change; the phone of a column event is left to its column. */
export function mergeOverrides(current: unknown, patch: ChannelOverrides): ChannelOverrides {
  const next = readOverrides(current);
  for (const event of NOTIFICATION_EVENTS) {
    const change = patch[event];
    if (!change) continue;
    next[event] = { ...next[event], ...change };
  }
  return next;
}

/** The older column a phone switch writes to, for the events that have one (new bookings use `bookings`). */
export function phoneColumn(event: NotificationEvent): 'notifyArrivals' | 'notifyReturns' | 'notifyShuttles' | 'notifyPlatform' | null {
  switch (event) {
    case 'arrival':
      return 'notifyArrivals';
    case 'return':
      return 'notifyReturns';
    case 'shuttle':
      return 'notifyShuttles';
    case 'platform':
      return 'notifyPlatform';
    default:
      return null;
  }
}

/** Where tapping the notification leads, in the pro space (web) and Plazo Pro alike. */
export function notificationTarget(data: Record<string, string> | undefined): string | null {
  if (!data) return null;
  if (data.reservationId) return `/reservations/${data.reservationId}`;
  if (data.type === 'inbox') return data.emailId ? `/reservations/a-verifier?mail=${data.emailId}` : '/reservations/a-verifier';
  if (data.type === 'whatsapp') return data.conversationId ? `/reservations/whatsapp?c=${data.conversationId}` : '/reservations/whatsapp';
  if (data.type === 'team') return '/equipe';
  if (data.type === 'shuttle') return '/navettes';
  if (data.type === 'sms_phone') return '/parking/reglages#sms';
  return null;
}
