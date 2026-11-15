import { Request, Response, Router } from 'express';
import { Container } from 'typedi';
import { PIXEL_GIF, TRACKED_TARGETS, TrackedTarget } from '@/domain/invitation-tracking';
import { Routes } from '@/interfaces/routes.interface';
import { PlatformAdminMiddleware } from '@/middlewares/platform-admin.middleware';
import { INVITATION_VIEWS, InvitationTrackingService, InvitationView } from '@/services/invitation-tracking.service';
import catchAsync from '@/utils/catchAsync';

/**
 * @swagger
 * /public/invitations/{key}/open.gif:
 *   get:
 *     tags: [Platform]
 *     summary: "The invitation email's open image (15/11/2026, approximate): a 1 × 1 GIF, always served"
 * /public/invitations/{key}/go/{target}:
 *   get:
 *     tags: [Platform]
 *     summary: "A store badge or the demo link of an invitation email (target play | app_store | demo): recorded, then 302 to the fixed address"
 * /internal/platform/invitations:
 *   get:
 *     tags: [Platform]
 *     summary: "Plateforme › Invitations: the last invitation of each invited person and what followed (?view=all|not_opened|not_clicked|no_app)"
 */
export class InvitationTrackingRoute implements Routes {
  public router = Router();
  private service = () => Container.get(InvitationTrackingService);

  constructor() {
    this.router.get(
      '/public/invitations/:key/open.gif',
      catchAsync(async (req: Request, res: Response) => {
        await this.service().opened(String(req.params.key), req.get('user-agent') ?? null);
        res.set('Content-Type', 'image/gif');
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.send(PIXEL_GIF);
      }),
    );
    this.router.get(
      '/public/invitations/:key/go/:target',
      catchAsync(async (req: Request, res: Response) => {
        const target = String(req.params.target) as TrackedTarget;
        if (!TRACKED_TARGETS.includes(target)) {
          res.status(404).json({ message: 'Not found', code: 'not_found' });
          return;
        }
        const destination = await this.service().followed(String(req.params.key), target, req.get('user-agent') ?? null);
        res.set('Cache-Control', 'no-store');
        res.set('Referrer-Policy', 'no-referrer');
        res.redirect(302, destination);
      }),
    );
    this.router.get(
      '/internal/platform/invitations',
      PlatformAdminMiddleware(),
      catchAsync(async (req: Request, res: Response) => {
        const asked = String(req.query.view ?? 'all') as InvitationView;
        res.set('Cache-Control', 'no-store');
        res.json(await this.service().list(INVITATION_VIEWS.includes(asked) ? asked : 'all'));
      }),
    );
  }
}
