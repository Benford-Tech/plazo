import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { isVerifiedPlatformAdmin } from '@/config';
import { HttpException } from '@/utils/httpException';
import { RequestWithStaffSession, StaffAuthMiddleware } from './staff-auth.middleware';

/**
 * Internal tools of the platform owner (/api/internal/platform/...): a logged-in staff member
 * whose email is listed in PLATFORM_ADMIN_EMAILS and verified. Everyone else gets 403.
 */
export const PlatformAdminMiddleware = () => {
  const authenticate = StaffAuthMiddleware();
  return (req: Request, res: Response, next: NextFunction) =>
    authenticate(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!isVerifiedPlatformAdmin((req as RequestWithStaffSession).staff)) {
        return next(new HttpException(httpStatus.FORBIDDEN, 'Reserved to the platform administrators', 'forbidden'));
      }
      next();
    });
};
