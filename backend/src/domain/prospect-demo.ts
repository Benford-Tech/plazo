import { randomBytes } from 'crypto';
import type { StaffRole } from '@/database';

/**
 * 21/10/2026 (« mets un environnement de démo de l'app », choice A + B + C): the prospects' demo of Plazo Pro. One
 * operator, « Parking des Cèdres (démo) », flagged `prospectDemo`: no public listing, nothing sent outside (SMS, e-mails,
 * payments, team), its bookings kept moving by the test feed, wiped and seeded again every night. A prospect enters it
 * from plazo.fr/pro/demo (anyone) or their own link plazo.fr/pro/demo/<token> (14 days, its opens counted), choosing a role.
 */

export const DEMO_OPERATOR_NAME = 'Parking des Cèdres (démo)';
export const DEMO_OPERATOR_SLUG = 'parking-des-cedres-demo';
export const DEMO_PARKING = {
  name: 'Parking des Cèdres',
  address: '12 route de Grenoble, 69720 Saint-Laurent-de-Mure',
  location: { lat: 45.6869, lng: 5.0471 },
  shuttleTravelMinutes: 8,
  meetingPoint: {
    label: 'Terminal 1 · Arrêt navettes',
    instructions: 'À la sortie du hall d’arrivée du Terminal 1, suivez « Navettes parkings » : le minibus blanc s’arrête à l’arrêt n° 3.',
    location: { lat: 45.7187, lng: 5.0819 },
  },
  pricing: { firstDayCents: 1000, dayCents: 450 },
};
/** Ten files of twelve cars: 120 places. */
export const DEMO_FILES = Array.from({ length: 10 }, (_, i) => ({ code: `F${String(i + 1).padStart(2, '0')}`, capacity: 12 }));
export const DEMO_VEHICLES = [
  { model: 'Mercedes Vito', colour: 'blanc', plate: 'DM-101-PZ', seats: 8 },
  { model: 'Renault Trafic', colour: 'gris', plate: 'DM-102-PZ', seats: 8 },
  { model: 'Peugeot Expert', colour: 'bleu', plate: 'DM-103-PZ', seats: 7 },
];
/** Comparator rates shown on « Chiffre d'affaires » and the dashboard. */
export const DEMO_COMMISSIONS = [
  { comparatorKey: 'allopark', label: 'Allopark', rateBp: 1800 },
  { comparatorKey: 'onepark', label: 'Onepark', rateBp: 2000 },
];

export const DEMO_ROLES = ['manager', 'agent', 'driver', 'valet'] as const satisfies readonly StaffRole[];
export type DemoRole = (typeof DEMO_ROLES)[number];

/** The demo's four members (never a real address: `.invalid` is reserved, RFC 2606). */
export const DEMO_STAFF: Record<DemoRole, { email: string; firstName: string; lastName: string; post: string }> = {
  manager: { email: 'demo-gerant@demo.plazo.invalid', firstName: 'Claire', lastName: 'Démo', post: 'manager' },
  agent: { email: 'demo-accueil@demo.plazo.invalid', firstName: 'Sami', lastName: 'Démo', post: 'agent' },
  driver: { email: 'demo-chauffeur@demo.plazo.invalid', firstName: 'Karim', lastName: 'Démo', post: 'driver' },
  valet: { email: 'demo-voiturier@demo.plazo.invalid', firstName: 'Léa', lastName: 'Démo', post: 'valet' },
};

export const isDemoRole = (value: unknown): value is DemoRole => typeof value === 'string' && (DEMO_ROLES as readonly string[]).includes(value);

/** « … (démo) »: the cheap check of the test feed's trigger (the flag is checked in the database). */
export const isProspectDemoName = (name: string) => /\(démo\)\s*$/.test(name);

/** A prospect's link is valid 14 days. */
export const DEMO_LINK_DAYS = 14;

/** A link token: 12 letters and digits (≈ 71 bits). */
export function demoLinkToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

export const DEMO_TOKEN_RE = /^[A-Za-z0-9]{8,32}$/;

/** The nightly reset runs with the 01:00 UTC cron (purge-expired-tokens): the next one after `now`. */
export function nextDemoReset(now: Date): Date {
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 1, 0, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}
