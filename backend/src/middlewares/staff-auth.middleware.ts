import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { staffPassport } from '@/config/passport';
import { can, Permission } from '@/domain/roles';
import { AuthenticatedStaff, RequestWithStaff } from '@/interfaces/auth.interface';
import { HttpException } from '@/utils/httpException';

const AUTH_ERR_MSG = 'Please log in to continue';

export type RequestWithStaffSession = RequestWithStaff & { tokenUid: string };

/** Authenticates a staff member from the bearer token, optionally requiring a permission. */
export const StaffAuthMiddleware = (permission?: Permission) => (request: Request, res: Response, next: NextFunction) => {
  const req = request as RequestWithStaffSession;
  staffPassport.authenticate('internal', { session: false }, (err: unknown, staff: AuthenticatedStaff | false, info: { tokenUid?: string }) => {
    if (err) return next(err);
    if (!staff) return next(new HttpException(httpStatus.UNAUTHORIZED, AUTH_ERR_MSG, 'unauthorized'));
    if (!staff.isActive) return next(new HttpException(httpStatus.UNAUTHORIZED, AUTH_ERR_MSG, 'unauthorized'));
    if (permission && !can(staff.role, permission)) {
      return next(new HttpException(httpStatus.FORBIDDEN, 'You do not have access to this action', 'forbidden'));
    }
    req.staff = staff;
    req.tokenUid = info?.tokenUid as string;
    next();
  })(req, res, next);
};
