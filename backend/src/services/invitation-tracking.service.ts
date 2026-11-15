import { Container, Service } from 'typedi';
import { PLAZO_PRO_APP_STORE_URL, PLAZO_PRO_PLAY_STORE_URL, SECRET_KEY } from '@/config';
import prisma, { Prisma } from '@/database';
import { appPlatformOf, deviceOf, INVITATION_TRACKING_RETENTION_DAYS, TrackedTarget, trackingIdOf, trackingKey } from '@/domain/invitation-tracking';
import { logger } from '@/utils/logger';
import { NotificationService } from './notification.service';

export type InvitationKind = 'operator' | 'team';
export type InvitationView = 'all' | 'not_opened' | 'not_clicked' | 'no_app';
export const INVITATION_VIEWS: InvitationView[] = ['all', 'not_opened', 'not_clicked', 'no_app'];

/** A sign-in's client: the browser's User-Agent and Plazo Pro's own header. */
export interface SignInClient {
  userAgent: string | null;
  client?: string | null;
}

/** How long after the email a sign-in still counts for it. */
const SIGN_IN_WINDOW_MS = 60 * 86400000;

const secret = () => SECRET_KEY as string;
const quietly = (what: string) => (error: unknown) =>
  logger.warn(`[Invitation tracking] ${what} not recorded: ${error instanceof Error ? error.message : String(error)}`);

/**
 * 15/11/2026 (« traquer les ouvertures de mail d'invitation, par qui, sur quel support, s'ils téléchargent l'app »,
 * Plateforme › Invitations): what followed each invitation email. Nothing here ever fails the action that records it.
 */
@Service()
export class InvitationTrackingService {
  private notifications = Container.get(NotificationService);

  /** A row for an email about to go out, with the tracked addresses to put in it (none without the site's address). */
  public async start(staffId: string, operatorId: string, kind: InvitationKind) {
    const row = await prisma.invitationTracking.create({ data: { staffId, operatorId, kind, emailSent: false } });
    const key = trackingKey(row.id, secret());
    const url = (path: string) => this.notifications.siteUrl(`/api/public/invitations/${key}${path}`);
    return {
      id: row.id,
      pixelUrl: url('/open.gif'),
      playStoreUrl: url('/go/play') ?? PLAZO_PRO_PLAY_STORE_URL,
      appStoreUrl: PLAZO_PRO_APP_STORE_URL ? (url('/go/app_store') ?? PLAZO_PRO_APP_STORE_URL) : null,
      demoUrl: url('/go/demo') ?? this.notifications.siteUrl('/pro/demo'),
    };
  }

  public async sent(id: string, emailSent: boolean): Promise<void> {
    await prisma.invitationTracking.update({ where: { id }, data: { emailSent } }).catch(quietly('send'));
  }

  /** GET /public/invitations/:key/open.gif */
  public async opened(key: string, userAgent: string | null, now = new Date()): Promise<void> {
    const id = trackingIdOf(key, secret());
    if (!id) return;
    const device = deviceOf(userAgent);
    await prisma.invitationTracking
      .update({ where: { id }, data: { openCount: { increment: 1 }, lastOpenedAt: now } })
      .then(() => prisma.invitationTracking.updateMany({ where: { id, openedAt: null }, data: { openedAt: now, openDevice: device } }))
      .catch(() => undefined);
  }

  /** GET /public/invitations/:key/go/:target: where to send the person (fixed addresses only, never one from the link). */
  public async followed(key: string, target: TrackedTarget, userAgent: string | null, now = new Date()): Promise<string> {
    const destination =
      target === 'play'
        ? PLAZO_PRO_PLAY_STORE_URL
        : target === 'app_store'
          ? (PLAZO_PRO_APP_STORE_URL ?? PLAZO_PRO_PLAY_STORE_URL)
          : (this.notifications.siteUrl('/pro/demo') ?? '/pro/demo');
    const id = trackingIdOf(key, secret());
    if (!id) return destination;
    const device = deviceOf(userAgent);
    const data: Prisma.InvitationTrackingUpdateManyMutationInput =
      target === 'demo' ? { demoClickAt: now } : { storeClickAt: now, storeClick: target };
    await prisma.invitationTracking
      .updateMany({ where: { id, ...(target === 'demo' ? { demoClickAt: null } : { storeClickAt: null }) }, data })
      .then(() => prisma.invitationTracking.updateMany({ where: { id, clickedAt: null }, data: { clickedAt: now, clickDevice: device } }))
      .catch(quietly('click'));
    return destination;
  }

  /** The invitation page was opened from the email's button (the page asks who is invited). */
  public async pageOpened(staffId: string, userAgent: string | null, now = new Date()): Promise<void> {
    const row = await this.latest(staffId);
    if (!row || row.clickedAt) return;
    await prisma.invitationTracking
      .updateMany({ where: { id: row.id, clickedAt: null }, data: { clickedAt: now, clickDevice: deviceOf(userAgent) } })
      .catch(quietly('page'));
  }

  public async passwordSet(staffId: string, now = new Date()): Promise<void> {
    const row = await this.latest(staffId);
    if (!row) return;
    await prisma.invitationTracking
      .updateMany({ where: { id: row.id, passwordSetAt: null }, data: { passwordSetAt: now } })
      .catch(quietly('password'));
  }

  /** A sign-in after an invitation: in Plazo Pro (« has the app ») or on the web. */
  public async signedIn(staffId: string, client: SignInClient, now = new Date()): Promise<void> {
    const row = await this.latest(staffId);
    if (!row || now.getTime() - row.sentAt.getTime() > SIGN_IN_WINDOW_MS) return;
    const platform = appPlatformOf(client.client, client.userAgent);
    const write = platform
      ? prisma.invitationTracking.updateMany({ where: { id: row.id, appSignInAt: null }, data: { appSignInAt: now, appPlatform: platform } })
      : prisma.invitationTracking.updateMany({
          where: { id: row.id, webSignInAt: null },
          data: { webSignInAt: now, webDevice: deviceOf(client.userAgent) },
        });
    await write.catch(quietly('sign-in'));
  }

  private latest(staffId: string) {
    return prisma.invitationTracking
      .findFirst({ where: { staffId }, orderBy: { sentAt: 'desc' }, select: { id: true, sentAt: true, clickedAt: true } })
      .catch(() => null);
  }

  /** GET /internal/platform/invitations?view=: the last invitation of each invited person, newest first. */
  public async list(view: InvitationView) {
    const rows = await prisma.invitationTracking.findMany({
      orderBy: { sentAt: 'desc' },
      distinct: ['staffId'],
      take: 500,
      include: {
        staff: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
        operator: { select: { id: true, name: true } },
      },
    });
    const sends = await prisma.invitationTracking.groupBy({
      by: ['staffId'],
      _count: { _all: true },
      where: { staffId: { in: rows.map(r => r.staffId) } },
    });
    const sendsOf = new Map(sends.map(s => [s.staffId, s._count._all]));
    const items = rows.map(r => ({
      id: r.id,
      kind: r.kind,
      operator: r.operator,
      staff: {
        id: r.staff.id,
        name: `${r.staff.firstName} ${r.staff.lastName}`.trim(),
        email: r.staff.email,
        role: r.staff.role,
        isActive: r.staff.isActive,
      },
      sends: sendsOf.get(r.staffId) ?? 1,
      sentAt: r.sentAt,
      emailSent: r.emailSent,
      opened: r.openedAt ? { at: r.openedAt, lastAt: r.lastOpenedAt, count: r.openCount, device: r.openDevice } : null,
      clicked: r.clickedAt ? { at: r.clickedAt, device: r.clickDevice } : null,
      store: r.storeClickAt ? { at: r.storeClickAt, store: r.storeClick } : null,
      demoAt: r.demoClickAt,
      passwordSetAt: r.passwordSetAt,
      app: r.appSignInAt ? { at: r.appSignInAt, platform: r.appPlatform } : null,
      web: r.webSignInAt ? { at: r.webSignInAt, device: r.webDevice } : null,
    }));
    const counts = {
      all: items.length,
      not_opened: items.filter(i => i.emailSent && !i.opened && !i.clicked).length,
      not_clicked: items.filter(i => i.emailSent && !i.clicked && !i.passwordSetAt).length,
      no_app: items.filter(i => !i.app).length,
    };
    const shown =
      view === 'not_opened'
        ? items.filter(i => i.emailSent && !i.opened && !i.clicked)
        : view === 'not_clicked'
          ? items.filter(i => i.emailSent && !i.clicked && !i.passwordSetAt)
          : view === 'no_app'
            ? items.filter(i => !i.app)
            : items;
    return { data: shown, counts };
  }

  /** The night's purge: rows 13 months after their email. */
  public async purge(now = new Date()): Promise<number> {
    const before = new Date(now.getTime() - INVITATION_TRACKING_RETENTION_DAYS * 86400000);
    return (await prisma.invitationTracking.deleteMany({ where: { sentAt: { lt: before } } })).count;
  }
}
