import httpStatus from 'http-status';
import { Container, Service } from 'typedi';
import { SECRET_KEY } from '@/config';
import prisma from '@/database';
import { manageLinkExpired, manageToken } from '@/domain/booking';
import { APP_LINK_CLAIM_HOURS, AppPlatform, appLinkReference, deviceFingerprint, isValidAppLinkCode } from '@/domain/app-link';
import { greetingName } from '@/domain/customer-name';
import { localDateTime } from '@/domain/time';
import { HttpException } from '@/utils/httpException';
import { NotificationService } from './notification.service';

const notFound = () => new HttpException(httpStatus.NOT_FOUND, 'Unknown or expired link', 'not_found');

/** What the site's rebound page and the app need to open a booking from its short code. */
export interface AppLinkTarget {
  reference: string;
  manageToken: string;
  firstName: string;
  parking: { title: string };
  /** Local time of the parking, "YYYY-MM-DDTHH:mm". */
  arrivalAt: string;
  returnAt: string;
}

const SELECT = {
  id: true,
  reference: true,
  manageTokenVersion: true,
  returnAt: true,
  arrivalAt: true,
  customerFirstName: true,
  customerLastName: true,
  customerName: true,
  channel: true,
  parking: { select: { name: true, timezone: true, listing: { select: { title: true } } } },
} as const;

/**
 * « Lien court Plazo » (direction B, 27/10/2026): resolves https://www.plazo.fr/a/<code>, remembers a phone that left
 * for the store, and gives the app its booking at the first launch.
 */
@Service()
export class AppLinkService {
  private notifications = Container.get(NotificationService);

  private get secret(): string {
    if (!SECRET_KEY) throw new HttpException(httpStatus.SERVICE_UNAVAILABLE, 'SECRET_KEY is not configured', 'links_unavailable');
    return SECRET_KEY;
  }

  /** The short link of a booking, or null when the site's URL or the secret is unknown. */
  public url(booking: { id: string; reference: string; manageTokenVersion: number }): string | null {
    if (!SECRET_KEY) return null;
    return this.notifications.appLinkUrl(booking);
  }

  /** The booking a code names (404 for a malformed, forged, revoked or expired code). */
  public async resolve(code: string): Promise<AppLinkTarget> {
    const reference = appLinkReference(code);
    if (!reference) throw notFound();
    const booking = await prisma.reservation.findFirst({ where: { reference, channel: 'plazo' }, select: SELECT });
    if (!booking?.parking.listing || !isValidAppLinkCode(booking, code, this.secret)) throw notFound();
    if (manageLinkExpired(booking.returnAt)) throw notFound();
    return this.target(booking);
  }

  /**
   * A phone leaves the rebound page for the store: remembered for 24 h by its address and platform. Older claims of
   * the same phone are replaced (the last link tapped wins).
   */
  public async claim(code: string, ip: string, platform: AppPlatform): Promise<void> {
    const reference = appLinkReference(code);
    if (!reference) throw notFound();
    const booking = await prisma.reservation.findFirst({ where: { reference, channel: 'plazo' }, select: SELECT });
    if (!booking?.parking.listing || !isValidAppLinkCode(booking, code, this.secret) || manageLinkExpired(booking.returnAt)) throw notFound();
    const fingerprint = deviceFingerprint(ip, platform);
    await prisma.$transaction([
      prisma.appLinkClaim.deleteMany({ where: { fingerprint } }),
      prisma.appLinkClaim.create({
        data: { reservationId: booking.id, fingerprint, platform, expiresAt: new Date(Date.now() + APP_LINK_CLAIM_HOURS * 3600000) },
      }),
    ]);
  }

  /**
   * The app's first launch: the booking this phone was waiting for, if any. A code (Android's install referrer, when
   * the store passes it) wins over the fingerprint; a matching claim is consumed either way.
   */
  public async resume(
    ip: string,
    platform: AppPlatform,
    code?: string | null,
  ): Promise<{ found: false } | ({ found: true; match: 'code' | 'device' } & AppLinkTarget)> {
    if (code) {
      const target = await this.resolve(code).catch(() => null);
      if (target) {
        await prisma.appLinkClaim.deleteMany({ where: { fingerprint: deviceFingerprint(ip, platform) } });
        return { found: true, match: 'code', ...target };
      }
    }
    const claim = await prisma.appLinkClaim.findFirst({
      where: { fingerprint: deviceFingerprint(ip, platform), expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      include: { reservation: { select: SELECT } },
    });
    if (!claim) return { found: false };
    await prisma.appLinkClaim.deleteMany({ where: { fingerprint: claim.fingerprint } });
    const booking = claim.reservation;
    if (!booking.parking.listing || manageLinkExpired(booking.returnAt)) return { found: false };
    return { found: true, match: 'device', ...this.target(booking) };
  }

  /** Nightly: claims past their 24 h. */
  public async purge(now = new Date()): Promise<number> {
    const { count } = await prisma.appLinkClaim.deleteMany({ where: { expiresAt: { lt: now } } });
    return count;
  }

  private target(booking: {
    id: string;
    reference: string;
    manageTokenVersion: number;
    arrivalAt: Date;
    returnAt: Date;
    customerFirstName: string;
    customerLastName: string;
    customerName: string;
    parking: { name: string; timezone: string; listing: { title: string } | null };
  }): AppLinkTarget {
    return {
      reference: booking.reference,
      manageToken: manageToken(booking.id, this.secret, booking.manageTokenVersion),
      firstName: greetingName(booking),
      parking: { title: booking.parking.listing?.title ?? booking.parking.name },
      arrivalAt: localDateTime(booking.arrivalAt, booking.parking.timezone),
      returnAt: localDateTime(booking.returnAt, booking.parking.timezone),
    };
  }
}
