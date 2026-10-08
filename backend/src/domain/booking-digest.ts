import { ReservationChannel } from '@/database';
import { PushMessage } from './arrival-messages';
import { QUIET_FROM, QUIET_UNTIL } from './day-before-sms';

/**
 * N-A « Récapitulatif horaire » (08/10/2026): every full hour, the staff on the `hourly` booking notification get one
 * push summing up the bookings created since the last digest, whatever their channel. Nothing leaves during the quiet
 * hours (22:00-07:00, local): the 07:00 digest then covers the night, since the watermark does not move meanwhile.
 */

/** A digest is skipped when the previous one ended less than this long ago (the scheduler fired twice). */
export const DIGEST_MIN_GAP_MINUTES = 50;
/** The window of a first digest (no watermark yet). */
export const DIGEST_DEFAULT_WINDOW_MINUTES = 60;
/** Beyond this, the body says since when it counts (the night, a scheduler that missed a run). */
export const DIGEST_LONG_WINDOW_MINUTES = 70;
export const DEFAULT_TIMEZONE = 'Europe/Paris';

/** True between 22:00 and 07:00 (`localTime` = "HH:MM" on the parking's clock). */
export function isQuietHour(localTime: string): boolean {
  const time = localTime.slice(0, 5);
  return time >= QUIET_FROM || time < QUIET_UNTIL;
}

export interface DigestWindow {
  /** Exclusive: the bookings created after this instant count. */
  start: Date;
  /** Inclusive. */
  end: Date;
  minutes: number;
}

/** (`lastDigestAt` or an hour ago, `now`]; null when the previous digest is too recent. */
export function digestWindow(now: Date, lastDigestAt: Date | null): DigestWindow | null {
  const start = lastDigestAt ?? new Date(now.getTime() - DIGEST_DEFAULT_WINDOW_MINUTES * 60000);
  const minutes = (now.getTime() - start.getTime()) / 60000;
  if (lastDigestAt && minutes < DIGEST_MIN_GAP_MINUTES) return null;
  return { start, end: now, minutes };
}

/** Where a booking came from, as the body names it: « 2 Plazo, 1 Allopark, 1 comptoir ». */
export function sourceLabel(channel: ReservationChannel, channelDetail: string | null): string {
  switch (channel) {
    case 'plazo':
      return 'Plazo';
    case 'website':
      return 'votre site';
    case 'phone':
      return 'téléphone';
    case 'counter':
      return 'comptoir';
    default:
      return channelDetail?.trim() || 'import';
  }
}

export interface DigestSource {
  label: string;
  count: number;
}

/** The bookings grouped by source, the biggest first, then by name. */
export function digestSources(bookings: { channel: ReservationChannel; channelDetail: string | null }[]): DigestSource[] {
  const counts = new Map<string, number>();
  for (const b of bookings) {
    const label = sourceLabel(b.channel, b.channelDetail);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

export interface DigestInput {
  sources: DigestSource[];
  /** Emails waiting in the inbox (« À traiter »), 0 to say nothing. */
  toCheck: number;
  /** Local "HH:MM" of the window's start, shown when the window is longer than usual. */
  since: string | null;
}

/** « 3 réservations reçues » · « 2 Plazo, 1 Allopark · 1 mail à vérifier · depuis 21:00 ». */
export function digestMessage(input: DigestInput): PushMessage {
  const total = input.sources.reduce((sum, s) => sum + s.count, 0);
  const parts = [input.sources.map(s => `${s.count} ${s.label}`).join(', ')];
  if (input.toCheck > 0) parts.push(`${input.toCheck} ${input.toCheck > 1 ? 'mails' : 'mail'} à vérifier`);
  if (input.since) parts.push(`depuis ${input.since}`);
  return {
    title: total > 1 ? `${total} réservations reçues` : `${total} réservation reçue`,
    body: parts.join(' · '),
  };
}
