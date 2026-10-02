import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { Container } from 'typedi';
import { staffPassport } from '@/config/passport';
import { can, Permission } from '@/domain/roles';
import { AuthenticatedStaff, RequestWithStaff } from '@/interfaces/auth.interface';
import { AuditService } from '@/services/audit.service';
import { HttpException } from '@/utils/httpException';
import { logger } from '@/utils/logger';

const AUTH_ERR_MSG = 'Please log in to continue';
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export type RequestWithStaffSession = RequestWithStaff & { tokenUid: string };

/**
 * Every write made while a platform admin acts inside an operator's space is recorded before it
 * runs, with the admin's own staff id (real identity) and the route (never the body). The HTTP
 * status is added once the response is sent.
 */
async function auditViewAsWrite(req: Request, res: Response, staff: AuthenticatedStaff) {
  if (!staff.actingAs || !WRITE_METHODS.has(req.method)) return;
  const path = req.originalUrl.split('?')[0];
  const entry = await Container.get(AuditService).recordViewAsWrite(staff, { method: req.method, path });
  res.on('finish', () => {
    Container.get(AuditService)
      .completeViewAsWrite(entry.id, res.statusCode)
      .catch(() => logger.warn(`[Audit] Could not record the outcome of view-as write ${entry.id}`));
  });
}

/** Authenticates a staff member from the bearer token, optionally requiring a permission. */
export const StaffAuthMiddleware = (permission?: Permission) => (request: Request, res: Response, next: NextFunction) => {
  const req = request as RequestWithStaffSession;
  staffPassport.authenticate(
    'internal',
    { session: false },
    (err: unknown, staff: AuthenticatedStaff | false, info: { tokenUid?: string; code?: string } | undefined) => {
      if (err) return next(err);
      if (!staff)
        return next(new HttpException(httpStatus.UNAUTHORIZED, AUTH_ERR_MSG, info?.code === 'account_suspended' ? info.code : 'unauthorized'));
      if (!staff.isActive) return next(new HttpException(httpStatus.UNAUTHORIZED, AUTH_ERR_MSG, 'unauthorized'));
      if (permission && !can(staff.role, permission)) {
        return next(new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden'));
      }
      req.staff = staff;
      req.tokenUid = info?.tokenUid as string;
      auditViewAsWrite(req, res, staff).then(() => next(), next);
    },
  )(req, res, next);
};

/**
 * The operator's team and the accounts' passwords stay theirs: read-only while a platform admin
 * views their space. Goes after StaffAuthMiddleware.
 */
export const RefuseInViewAs = () => (request: Request, res: Response, next: NextFunction) => {
  if ((request as RequestWithStaffSession).staff?.actingAs) {
    return next(new HttpException(httpStatus.FORBIDDEN, 'Read-only while viewing an operator space', 'view_as_read_only'));
  }
  next();
};
