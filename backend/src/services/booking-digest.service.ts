import { Container, Service } from 'typedi';
import prisma from '@/database';
import { DEFAULT_TIMEZONE, DIGEST_LONG_WINDOW_MINUTES, digestMessage, digestSources, digestWindow, isQuietHour } from '@/domain/booking-digest';
import { localDateTime } from '@/domain/time';
import { logger } from '@/utils/logger';
import { InboundEmailService } from './inbound-email.service';
import { PushService } from './push.service';

/** How long OneSignal keeps a digest for a phone that is off: the next one with bookings may be hours away. */
export const DIGEST_PUSH_TTL_SECONDS = 12 * 3600;

export interface DigestRun {
  /** Operators whose window was closed (a digest sent, or nothing to say). */
  operators: number;
  /** Digests handed to the phones (operators with at least one booking and one recipient). */
  sent: number;
  /** Operators left for later: quiet hours, or a digest less than 50 minutes old. */
  skipped: number;
}

/**
 * N-A « Récapitulatif horaire » (08/10/2026): called every hour (GET /internal/cron/booking-digest). For each active
 * operator, the bookings created since its last digest (Operator.bookingDigestAt), whatever the channel, go in one push
 * to the staff on `hourly`; the watermark then moves to now. Quiet hours (22:00-07:00 on the first parking's clock)
 * leave the watermark where it is, so the 07:00 digest covers the night.
 */
@Service()
export class BookingDigestService {
  public push = Container.get(PushService);
  public inbound = Container.get(InboundEmailService);

  public async run(now = new Date()): Promise<DigestRun> {
    const result: DigestRun = { operators: 0, sent: 0, skipped: 0 };
    const operators = await prisma.operator.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        bookingDigestAt: true,
        parkings: { select: { timezone: true }, orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });
    for (const operator of operators) {
      const timezone = operator.parkings[0]?.timezone ?? DEFAULT_TIMEZONE;
      const window = isQuietHour(localDateTime(now, timezone).slice(11)) ? null : digestWindow(now, operator.bookingDigestAt);
      if (!window) {
        result.skipped += 1;
        continue;
      }
      // Live bookings only: a Plazo checkout started and not paid (pending_payment), or a hold that lapsed or a booking
      // cancelled within the hour, is not « reçue ». A row's createdAt is stamped at its INSERT and its transaction commits
      // within milliseconds, so the window's edge loses nothing in practice.
      const bookings = await prisma.reservation.findMany({
        where: { operatorId: operator.id, createdAt: { gt: window.start, lte: window.end }, status: { notIn: ['pending_payment', 'cancelled'] } },
        select: { channel: true, channelDetail: true },
      });
      if (bookings.length) {
        const message = digestMessage({
          sources: digestSources(bookings),
          toCheck: await this.inbound.toCheckCount(operator.id),
          since: window.minutes > DIGEST_LONG_WINDOW_MINUTES ? localDateTime(window.start, timezone).slice(11) : null,
        });
        const recipients = await this.push.notifyStaff(operator.id, 'bookingDigest', message, {
          data: { type: 'booking', event: 'digest' },
          collapseId: `digest-${operator.id}`,
          // The 07:00 digest covers the night: a phone switched on at 08:05 must still get it.
          ttl: DIGEST_PUSH_TTL_SECONDS,
        });
        if (recipients > 0) result.sent += 1;
      }
      await prisma.operator.update({ where: { id: operator.id }, data: { bookingDigestAt: now } });
      result.operators += 1;
    }
    logger.info(`[Digest] ${result.operators} operators, ${result.sent} digests sent, ${result.skipped} skipped`);
    return result;
  }
}
